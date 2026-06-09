import type { DiaryEvent } from "./types";

function evt(type: "meal" | "poop", year: number, month: number, day: number, h: number, m: number): DiaryEvent {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: new Date(year, month - 1, day, h, m, 0, 0).getTime(),
  };
}

/**
 * Real recorded data for Poodle.
 * Meals at 10:30 AM, 2 PM, 5:30 PM, 8:30 PM every day.
 */
export function generateDummyData(): DiaryEvent[] {
  const events: DiaryEvent[] = [];

  // Helper to add a full day of meals
  const addMeals = (y: number, mo: number, d: number) => {
    events.push(evt("meal", y, mo, d, 10, 30));
    events.push(evt("meal", y, mo, d, 14, 0));
    events.push(evt("meal", y, mo, d, 17, 30));
    events.push(evt("meal", y, mo, d, 20, 30));
  };

  // June 3
  addMeals(2026, 6, 3);
  events.push(evt("poop", 2026, 6, 3, 2, 27));
  events.push(evt("poop", 2026, 6, 3, 19, 55));

  // June 4
  addMeals(2026, 6, 4);
  events.push(evt("poop", 2026, 6, 4, 6, 45));
  events.push(evt("poop", 2026, 6, 4, 14, 0));
  events.push(evt("poop", 2026, 6, 4, 21, 30));

  // June 5
  addMeals(2026, 6, 5);
  events.push(evt("poop", 2026, 6, 5, 5, 0));
  events.push(evt("poop", 2026, 6, 5, 11, 0));
  events.push(evt("poop", 2026, 6, 5, 17, 0));

  // June 6
  addMeals(2026, 6, 6);
  events.push(evt("poop", 2026, 6, 6, 3, 0));
  events.push(evt("poop", 2026, 6, 6, 12, 20));
  events.push(evt("poop", 2026, 6, 6, 21, 0));

  // June 7
  addMeals(2026, 6, 7);
  events.push(evt("poop", 2026, 6, 7, 11, 30));
  events.push(evt("poop", 2026, 6, 7, 15, 0));
  events.push(evt("poop", 2026, 6, 7, 21, 0));

  // June 8
  addMeals(2026, 6, 8);
  events.push(evt("poop", 2026, 6, 8, 4, 0));
  events.push(evt("poop", 2026, 6, 8, 10, 30));
  events.push(evt("poop", 2026, 6, 8, 20, 45));

  // June 9
  events.push(evt("meal", 2026, 6, 9, 9, 28));
  events.push(evt("meal", 2026, 6, 9, 13, 31));
  events.push(evt("poop", 2026, 6, 9, 8, 43));

  return events.sort((a, b) => a.timestamp - b.timestamp);
}
