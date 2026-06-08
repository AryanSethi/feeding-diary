export type EventType = "meal" | "poop";

export interface DiaryEvent {
  id: string;
  type: EventType;
  timestamp: number; // Unix milliseconds
  notes?: string;
}

export interface PredictionWindow {
  mealSlot: string;
  startTime: number; // Unix ms
  meanTime: number;  // Unix ms
  endTime: number;   // Unix ms
  confidence: number; // 0-1, based on sample count
}

export const MEAL_PRESETS = [
  { label: "Breakfast", time: "10:30" },
  { label: "Lunch", time: "14:00" },
  { label: "Snack", time: "17:30" },
  { label: "Dinner", time: "20:30" },
] as const;

export const TZ = "Asia/Kolkata";
export const LOCALE = "en-IN";
