import type { DiaryEvent, PredictionWindow } from "./types";

const DECAY_HALF_LIFE_DAYS = 7;

/**
 * Classify a poop as "morning" (before any meal that day) or "post-meal".
 */
function ismorningPoop(poop: DiaryEvent, allEvents: DiaryEvent[]): boolean {
  const poopDate = new Date(poop.timestamp);
  const dayStart = new Date(poopDate);
  dayStart.setHours(0, 0, 0, 0);

  // Find the first meal of that day
  const firstMealOfDay = allEvents
    .filter(
      (e) =>
        e.type === "meal" &&
        e.timestamp >= dayStart.getTime() &&
        e.timestamp < dayStart.getTime() + 24 * 60 * 60 * 1000
    )
    .sort((a, b) => a.timestamp - b.timestamp)[0];

  // If no meals that day, or poop happened before first meal → morning poop
  return !firstMealOfDay || poop.timestamp < firstMealOfDay.timestamp;
}

/**
 * Get the time-of-day in ms since midnight for a timestamp.
 */
function timeOfDayMs(timestamp: number): number {
  const d = new Date(timestamp);
  return (d.getHours() * 60 + d.getMinutes()) * 60 * 1000;
}

/**
 * Compute weighted average and standard deviation with exponential decay.
 */
function weightedStats(
  values: { value: number; daysAgo: number }[]
): { mean: number; stddev: number; sampleCount: number } {
  if (values.length === 0) return { mean: 0, stddev: 0, sampleCount: 0 };

  const weights = values.map((d) =>
    Math.exp((-Math.LN2 * d.daysAgo) / DECAY_HALF_LIFE_DAYS)
  );
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const mean =
    values.reduce((sum, d, i) => sum + d.value * weights[i], 0) / totalWeight;

  const variance =
    values.reduce(
      (sum, d, i) => sum + weights[i] * (d.value - mean) ** 2,
      0
    ) / totalWeight;

  return { mean, stddev: Math.sqrt(variance), sampleCount: values.length };
}

function getMealSlotLabel(hour: number, minute: number): string {
  const timeVal = hour * 60 + minute;
  if (timeVal <= 12 * 60) return "Breakfast";
  if (timeVal <= 16 * 60) return "Lunch";
  if (timeVal <= 19 * 60) return "Snack";
  return "Dinner";
}

/**
 * MODEL 1: Morning poop prediction.
 * Uses historical first-poop-of-day times (time-of-day distribution).
 * Only produces a prediction if today's first poop hasn't happened yet.
 */
function getMorningPrediction(
  allEvents: DiaryEvent[],
  todaysEvents: DiaryEvent[]
): PredictionWindow | null {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  // If today already has a poop, no morning prediction needed
  const todaysPoops = todaysEvents.filter((e) => e.type === "poop");
  if (todaysPoops.length > 0) return null;

  // Collect all historical morning poop times-of-day
  const morningPoops = allEvents
    .filter((e) => e.type === "poop" && ismorningPoop(e, allEvents));

  if (morningPoops.length < 2) return null;

  const samples = morningPoops.map((p) => ({
    value: timeOfDayMs(p.timestamp),
    daysAgo: (now - p.timestamp) / (1000 * 60 * 60 * 24),
  }));

  const stats = weightedStats(samples);
  if (stats.mean === 0) return null;

  const halfWindow = Math.max(stats.stddev, 30 * 60 * 1000); // min 30 min window
  const confidence = Math.min(stats.sampleCount / 8, 1);

  return {
    mealSlot: "Morning",
    startTime: todayMs + stats.mean - halfWindow,
    meanTime: todayMs + stats.mean,
    endTime: todayMs + stats.mean + halfWindow,
    confidence,
  };
}

/**
 * MODEL 2: Post-meal poop predictions.
 * For each of today's meals, predict poop using meal→poop delays,
 * excluding morning (pre-meal) poops from the training data.
 */
function getPostMealPredictions(
  allEvents: DiaryEvent[],
  todaysMeals: DiaryEvent[]
): PredictionWindow[] {
  const now = Date.now();
  const meals = allEvents
    .filter((e) => e.type === "meal")
    .sort((a, b) => a.timestamp - b.timestamp);
  const poops = allEvents
    .filter((e) => e.type === "poop" && !ismorningPoop(e, allEvents))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Compute meal→poop delays (only post-meal poops)
  const delays: {
    mealSlot: string;
    delayMs: number;
    daysAgo: number;
  }[] = [];

  for (const poop of poops) {
    let nearestMeal: DiaryEvent | null = null;
    for (let i = meals.length - 1; i >= 0; i--) {
      if (meals[i].timestamp < poop.timestamp) {
        nearestMeal = meals[i];
        break;
      }
    }
    if (!nearestMeal) continue;

    const delayMs = poop.timestamp - nearestMeal.timestamp;
    if (delayMs > 8 * 60 * 60 * 1000) continue;

    const mealHour = new Date(nearestMeal.timestamp).getHours();
    const mealMinute = new Date(nearestMeal.timestamp).getMinutes();
    const mealSlot = getMealSlotLabel(mealHour, mealMinute);
    const daysAgo = (now - poop.timestamp) / (1000 * 60 * 60 * 24);

    delays.push({ mealSlot, delayMs, daysAgo });
  }

  if (delays.length < 2) return [];

  const predictions: PredictionWindow[] = [];

  for (const meal of todaysMeals) {
    const mealHour = new Date(meal.timestamp).getHours();
    const mealMinute = new Date(meal.timestamp).getMinutes();
    const mealSlot = getMealSlotLabel(mealHour, mealMinute);

    let slotDelays = delays.filter((d) => d.mealSlot === mealSlot);
    if (slotDelays.length < 2) {
      slotDelays = delays;
    }

    const stats = weightedStats(
      slotDelays.map((d) => ({ value: d.delayMs, daysAgo: d.daysAgo }))
    );
    if (stats.mean === 0) continue;

    const halfWindow = Math.max(stats.stddev, 15 * 60 * 1000);
    const confidence = Math.min(stats.sampleCount / 10, 1);

    predictions.push({
      mealSlot,
      startTime: meal.timestamp + stats.mean - halfWindow,
      meanTime: meal.timestamp + stats.mean,
      endTime: meal.timestamp + stats.mean + halfWindow,
      confidence,
    });
  }

  return predictions;
}

/**
 * Combined prediction: morning + post-meal models.
 */
export function getPredictions(
  allEvents: DiaryEvent[],
  todaysMeals: DiaryEvent[],
  todaysEvents: DiaryEvent[]
): PredictionWindow[] {
  const allPoops = allEvents.filter((e) => e.type === "poop");
  if (allPoops.length < 3) return [];

  const predictions: PredictionWindow[] = [];

  // Model 1: Morning poop
  const morning = getMorningPrediction(allEvents, todaysEvents);
  if (morning) predictions.push(morning);

  // Model 2: Post-meal poops
  predictions.push(...getPostMealPredictions(allEvents, todaysMeals));

  return predictions;
}
