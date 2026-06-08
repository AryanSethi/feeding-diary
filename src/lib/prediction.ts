import type { DiaryEvent, PredictionWindow } from "./types";

const DECAY_HALF_LIFE_DAYS = 7;

/**
 * Find the nearest preceding meal for each poop and compute the delay.
 */
function computeDelays(events: DiaryEvent[]): {
  mealSlot: string;
  delayMs: number;
  poopTime: number;
  daysAgo: number;
}[] {
  const meals = events.filter((e) => e.type === "meal").sort((a, b) => a.timestamp - b.timestamp);
  const poops = events.filter((e) => e.type === "poop").sort((a, b) => a.timestamp - b.timestamp);
  const now = Date.now();

  const delays: { mealSlot: string; delayMs: number; poopTime: number; daysAgo: number }[] = [];

  for (const poop of poops) {
    // Find the latest meal before this poop
    let nearestMeal: DiaryEvent | null = null;
    for (let i = meals.length - 1; i >= 0; i--) {
      if (meals[i].timestamp < poop.timestamp) {
        nearestMeal = meals[i];
        break;
      }
    }
    if (!nearestMeal) continue;

    const delayMs = poop.timestamp - nearestMeal.timestamp;
    // Skip if delay is more than 8 hours (likely unrelated)
    if (delayMs > 8 * 60 * 60 * 1000) continue;

    const mealHour = new Date(nearestMeal.timestamp).getHours();
    const mealMinute = new Date(nearestMeal.timestamp).getMinutes();
    const mealSlot = getMealSlotLabel(mealHour, mealMinute);
    const daysAgo = (now - poop.timestamp) / (1000 * 60 * 60 * 24);

    delays.push({ mealSlot, delayMs, poopTime: poop.timestamp, daysAgo });
  }

  return delays;
}

function getMealSlotLabel(hour: number, minute: number): string {
  const timeVal = hour * 60 + minute;
  if (timeVal <= 12 * 60) return "Breakfast";
  if (timeVal <= 16 * 60) return "Lunch";
  if (timeVal <= 19 * 60) return "Snack";
  return "Dinner";
}

/**
 * Compute weighted average and standard deviation with exponential decay.
 */
function weightedStats(delays: { delayMs: number; daysAgo: number }[]): {
  mean: number;
  stddev: number;
  sampleCount: number;
} {
  if (delays.length === 0) return { mean: 0, stddev: 0, sampleCount: 0 };

  const weights = delays.map((d) => Math.exp((-Math.LN2 * d.daysAgo) / DECAY_HALF_LIFE_DAYS));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  const mean =
    delays.reduce((sum, d, i) => sum + d.delayMs * weights[i], 0) / totalWeight;

  const variance =
    delays.reduce((sum, d, i) => sum + weights[i] * (d.delayMs - mean) ** 2, 0) /
    totalWeight;

  return { mean, stddev: Math.sqrt(variance), sampleCount: delays.length };
}

/**
 * Given all events and today's meals, predict poop windows.
 */
export function getPredictions(
  allEvents: DiaryEvent[],
  todaysMeals: DiaryEvent[]
): PredictionWindow[] {
  const delays = computeDelays(allEvents);
  if (delays.length < 3) return []; // Need at least 3 data points

  const predictions: PredictionWindow[] = [];

  for (const meal of todaysMeals) {
    const mealHour = new Date(meal.timestamp).getHours();
    const mealMinute = new Date(meal.timestamp).getMinutes();
    const mealSlot = getMealSlotLabel(mealHour, mealMinute);

    // Get delays for this meal slot
    let slotDelays = delays.filter((d) => d.mealSlot === mealSlot);

    // Fall back to all delays if not enough slot-specific data
    if (slotDelays.length < 2) {
      slotDelays = delays;
    }

    const stats = weightedStats(slotDelays);
    if (stats.mean === 0) continue;

    // Use 1 stddev window, minimum 15 min window
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
