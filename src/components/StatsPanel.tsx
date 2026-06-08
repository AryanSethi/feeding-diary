"use client";

import type { DiaryEvent, PredictionWindow } from "@/lib/types";
import { computeMealToPoopDelays, computePoopToPoopIntervals } from "@/lib/analysis";
import ScatterChart from "./ScatterChart";

interface StatsPanelProps {
  allEvents: DiaryEvent[];
  todaysEvents: DiaryEvent[];
  predictions: PredictionWindow[];
}

export default function StatsPanel({ allEvents, todaysEvents, predictions }: StatsPanelProps) {
  const todaysPoops = todaysEvents.filter((e) => e.type === "poop").length;
  const todaysMeals = todaysEvents.filter((e) => e.type === "meal").length;

  // Next predicted poop
  const now = Date.now();
  const upcoming = predictions
    .filter((p) => p.meanTime > now)
    .sort((a, b) => a.meanTime - b.meanTime);
  const nextPrediction = upcoming[0];
  const poops = allEvents.filter((e) => e.type === "poop");

  const mealToPoopDelays = computeMealToPoopDelays(allEvents);
  const poopToPoopIntervals = computePoopToPoopIntervals(allEvents);

  const formatCountdown = (targetMs: number) => {
    const diff = targetMs - now;
    if (diff <= 0) return "Any moment now!";
    const mins = Math.floor(diff / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `~${h}h ${m}m` : `~${m}m`;
  };

  return (
    <div className="space-y-4">
      {/* Top row: prediction + counts */}
      <div className="grid grid-cols-2 gap-3">
        {/* Next predicted poop */}
        <div className="col-span-2 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="text-xs font-medium text-amber-600 uppercase tracking-wide">
            Next Predicted Poop
          </div>
          {nextPrediction ? (
            <div className="mt-1">
              <span className="text-2xl font-bold text-amber-800">
                {formatCountdown(nextPrediction.meanTime)}
              </span>
              <span className="text-sm text-amber-600 ml-2">
                (~{new Date(nextPrediction.meanTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })},
                after {nextPrediction.mealSlot})
              </span>
            </div>
          ) : (
            <div className="mt-1 text-amber-700">
              {poops.length < 3 ? "Need more data (3+ poops)" : "No upcoming predictions"}
            </div>
          )}
        </div>

        {/* Today's counts */}
        <div className="p-3 rounded-2xl bg-green-50 border border-green-200">
          <div className="text-xs font-medium text-green-600 uppercase tracking-wide">
            Today&apos;s Meals
          </div>
          <div className="text-2xl font-bold text-green-800 mt-1">{todaysMeals}</div>
        </div>

        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200">
          <div className="text-xs font-medium text-stone-500 uppercase tracking-wide">
            Today&apos;s Poops
          </div>
          <div className="text-2xl font-bold text-stone-800 mt-1">{todaysPoops}</div>
        </div>
      </div>

      {/* Meal → Poop delay chart */}
      {mealToPoopDelays.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-2">
            Meal → Poop Time (hours)
          </div>
          <ScatterChart
            points={mealToPoopDelays.map((d) => ({
              x: d.timestamp,
              y: d.delayHours,
              label: `${d.delayFormatted} after ${d.mealSlot}`,
            }))}
            yLabel="Hours"
            color="#2563eb"
            height={160}
          />
          <div className="mt-2 flex gap-4 text-xs text-blue-700">
            <span>Min: {Math.min(...mealToPoopDelays.map((d) => d.delayHours)).toFixed(1)}h</span>
            <span>Avg: {(mealToPoopDelays.reduce((s, d) => s + d.delayHours, 0) / mealToPoopDelays.length).toFixed(1)}h</span>
            <span>Max: {Math.max(...mealToPoopDelays.map((d) => d.delayHours)).toFixed(1)}h</span>
          </div>
        </div>
      )}

      {/* Poop → Poop interval chart */}
      {poopToPoopIntervals.length > 0 && (
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
          <div className="text-xs font-medium text-purple-600 uppercase tracking-wide mb-2">
            Poop → Poop Interval (hours)
          </div>
          <ScatterChart
            points={poopToPoopIntervals.map((d) => ({
              x: d.timestamp,
              y: d.intervalHours,
              label: d.intervalFormatted,
            }))}
            yLabel="Hours"
            color="#7c3aed"
            height={160}
          />
          <div className="mt-2 flex gap-4 text-xs text-purple-700">
            <span>Min: {Math.min(...poopToPoopIntervals.map((d) => d.intervalHours)).toFixed(1)}h</span>
            <span>Avg: {(poopToPoopIntervals.reduce((s, d) => s + d.intervalHours, 0) / poopToPoopIntervals.length).toFixed(1)}h</span>
            <span>Max: {Math.max(...poopToPoopIntervals.map((d) => d.intervalHours)).toFixed(1)}h</span>
          </div>
        </div>
      )}
    </div>
  );
}
