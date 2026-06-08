"use client";

import { useMemo } from "react";
import { getPredictions } from "@/lib/prediction";
import type { DiaryEvent, PredictionWindow } from "@/lib/types";

export function usePrediction(
  allEvents: DiaryEvent[],
  todaysMeals: DiaryEvent[]
): PredictionWindow[] {
  return useMemo(
    () => getPredictions(allEvents, todaysMeals),
    [allEvents, todaysMeals]
  );
}
