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

// --- Health tracking types ---

export type HealthRecordType = "deworming" | "vaccination" | "weight";

export interface HealthRecord {
  id: string;
  type: HealthRecordType;
  date: number;       // Unix ms (date only, time irrelevant)
  label: string;      // e.g. "DHPPiL", "Deworming 1ml", "1.2 kg"
  notes?: string;
  completed: boolean; // false = upcoming/scheduled
}

export const POODLE_DOB = new Date(2026, 3, 6).getTime(); // April 6, 2026

export const MEAL_PRESETS = [
  { label: "Breakfast", time: "10:00" },
  { label: "Lunch", time: "13:30" },
  { label: "Snack", time: "17:00" },
  { label: "Dinner", time: "20:00" },
] as const;

export const TZ = "Asia/Kolkata";
export const LOCALE = "en-IN";
