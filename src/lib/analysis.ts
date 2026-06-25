import type { DiaryEvent } from "./types";

export interface MealToPoopDelay {
  timestamp: number;    // poop timestamp (for x-axis)
  delayHours: number;   // hours between meal and poop
  delayFormatted: string;
  mealSlot: string;
}

export interface PoopToPoopInterval {
  timestamp: number;    // later poop timestamp (for x-axis)
  intervalHours: number;
  intervalFormatted: string;
}

function getMealSlotLabel(hour: number, minute: number): string {
  const t = hour * 60 + minute;
  if (t <= 12 * 60) return "Breakfast";
  if (t <= 16 * 60) return "Lunch";
  if (t <= 19 * 60) return "Snack";
  return "Dinner";
}

function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * For each poop, find the nearest preceding meal and compute the delay.
 */
export function computeMealToPoopDelays(events: DiaryEvent[]): MealToPoopDelay[] {
  const meals = events.filter((e) => e.type === "meal").sort((a, b) => a.timestamp - b.timestamp);
  const poops = events.filter((e) => e.type === "poop").sort((a, b) => a.timestamp - b.timestamp);

  const results: MealToPoopDelay[] = [];

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
    // Skip if > 14 hours (overnight, not directly related)
    if (delayMs > 14 * 60 * 60 * 1000) continue;

    const delayHours = delayMs / (1000 * 60 * 60);
    const mealDate = new Date(nearestMeal.timestamp);
    const mealSlot = getMealSlotLabel(mealDate.getHours(), mealDate.getMinutes());

    results.push({
      timestamp: poop.timestamp,
      delayHours,
      delayFormatted: formatDuration(delayHours),
      mealSlot,
    });
  }

  return results;
}

/**
 * Compute intervals between consecutive poops.
 */
export function computePoopToPoopIntervals(events: DiaryEvent[]): PoopToPoopInterval[] {
  const poops = events
    .filter((e) => e.type === "poop")
    .sort((a, b) => a.timestamp - b.timestamp);

  const results: PoopToPoopInterval[] = [];

  for (let i = 1; i < poops.length; i++) {
    const intervalMs = poops[i].timestamp - poops[i - 1].timestamp;
    const intervalHours = intervalMs / (1000 * 60 * 60);

    results.push({
      timestamp: poops[i].timestamp,
      intervalHours,
      intervalFormatted: formatDuration(intervalHours),
    });
  }

  return results;
}

export interface FirstPoopOfDay {
  timestamp: number;      // the poop timestamp (for x-axis)
  timeOfDayHours: number; // decimal hours from midnight (for y-axis)
  timeFormatted: string;  // e.g. "6:30 AM"
}

/**
 * For each day that has at least one poop, find the earliest poop
 * and return its time-of-day.
 */
export function computeFirstPoopOfDay(events: DiaryEvent[]): FirstPoopOfDay[] {
  const poops = events
    .filter((e) => e.type === "poop")
    .sort((a, b) => a.timestamp - b.timestamp);

  const dayMap = new Map<string, DiaryEvent>();
  for (const poop of poops) {
    const d = new Date(poop.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!dayMap.has(key)) {
      dayMap.set(key, poop);
    }
  }

  const results: FirstPoopOfDay[] = [];
  for (const poop of dayMap.values()) {
    const d = new Date(poop.timestamp);
    const timeOfDayHours = d.getHours() + d.getMinutes() / 60;
    const timeFormatted = d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Kolkata",
    });
    results.push({
      timestamp: poop.timestamp,
      timeOfDayHours,
      timeFormatted,
    });
  }

  return results.sort((a, b) => a.timestamp - b.timestamp);
}
