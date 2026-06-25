"use client";

import { useRef, useEffect, useState } from "react";
import type { DiaryEvent, PredictionWindow, HealthRecord } from "@/lib/types";
import { MEAL_PRESETS, TZ } from "@/lib/types";

const HEADER_HEIGHT = 36;
const HEALTH_BANNER_HEIGHT = 22;
const HOUR_LABEL_WIDTH = 32;
const COL_WIDTH = 55;
const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_SPAN = END_HOUR - START_HOUR;
const TIMELINE_HEIGHT = 640;

const MEAL_LINE_COLORS = [
  "rgba(34,197,94,0.4)",
  "rgba(34,197,94,0.4)",
  "rgba(34,197,94,0.4)",
  "rgba(34,197,94,0.4)",
];

interface TimelineProps {
  allEvents: DiaryEvent[];
  predictions: PredictionWindow[];
  selectedDate: Date;
  daysToShow?: number;
  healthRecords?: HealthRecord[];
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

function formatDayLabel(date: Date): string {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yest.";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", timeZone: "Asia/Kolkata" });
}

function hourToY(hours: number): number {
  return ((hours - START_HOUR) / HOUR_SPAN) * TIMELINE_HEIGHT;
}

function tsToY(timestamp: number, dayStartMs: number): number {
  const hours = (timestamp - dayStartMs) / (1000 * 60 * 60);
  return hourToY(hours);
}

function getMinutesInTz(timestamp: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).formatToParts(new Date(timestamp));
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

export default function Timeline({
  allEvents,
  predictions,
  selectedDate,
  daysToShow = 30,
  healthRecords = [],
}: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = new Date().toDateString();
  const [tappedEvent, setTappedEvent] = useState<string | null>(null);

  const days: Date[] = [];
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [selectedDate.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps

  const hourTicks: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hourTicks.push(h);

  const totalWidth = COL_WIDTH * days.length;

  // Pre-compute per-day data
  const perDay = days.map((day) => {
    const dayStartMs = day.getTime();
    const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000 - 1;
    const events = allEvents.filter((e) => e.timestamp >= dayStartMs && e.timestamp <= dayEndMs);
    const preds = predictions.filter((p) => p.endTime >= dayStartMs && p.startTime <= dayEndMs);
    const health = healthRecords.filter((r) => r.type !== "weight" && new Date(r.date).toDateString() === day.toDateString());
    return { day, dayStartMs, dayEndMs, events, preds, health };
  });

  const mealPresetMinutes = MEAL_PRESETS.map((p) => {
    const [h, m] = p.time.split(":").map(Number);
    return h * 60 + m;
  });

  // Pre-compute meal connecting lines based on fixed daily meal slots
  const mealLines: { x: number; y: number; dayIdx: number }[][] = [];
  perDay.forEach((d, dayIdx) => {
    const meals = d.events.filter((e) => e.type === "meal");
    const bestPerSlot: ({ meal: DiaryEvent; diff: number } | null)[] = mealPresetMinutes.map(() => null);

    meals.forEach((meal) => {
      const mealMinutes = getMinutesInTz(meal.timestamp, TZ);
      let bestSlot = 0;
      let bestDiff = Number.POSITIVE_INFINITY;
      for (let slotIdx = 0; slotIdx < mealPresetMinutes.length; slotIdx++) {
        const diff = Math.abs(mealMinutes - mealPresetMinutes[slotIdx]);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestSlot = slotIdx;
        }
      }

      const current = bestPerSlot[bestSlot];
      if (!current || bestDiff < current.diff) {
        bestPerSlot[bestSlot] = { meal, diff: bestDiff };
      }
    });

    bestPerSlot.forEach((slot, slotIdx) => {
      if (!slot) return;
      if (!mealLines[slotIdx]) mealLines[slotIdx] = [];
      const y = tsToY(slot.meal.timestamp, d.dayStartMs);
      if (y >= 0 && y <= TIMELINE_HEIGHT) {
        mealLines[slotIdx].push({ x: dayIdx * COL_WIDTH + COL_WIDTH * 0.5, y, dayIdx });
      }
    });
  });

  return (
    <div
      className="w-full rounded-2xl bg-white shadow-sm border border-stone-200 overflow-hidden"
      onClick={() => setTappedEvent(null)}
    >
      <div className="flex">
        {/* Hour labels */}
        <div className="shrink-0 border-r border-stone-200 bg-stone-50" style={{ width: HOUR_LABEL_WIDTH }}>
          <div style={{ height: HEADER_HEIGHT }} />
          <div className="relative" style={{ height: TIMELINE_HEIGHT }}>
            {hourTicks.filter((h) => h % 2 === 0).map((h) => (
              <div
                key={h}
                className="absolute w-full text-right pr-1 text-stone-400 select-none leading-none"
                style={{ top: `${((h - START_HOUR) / HOUR_SPAN) * 100}%`, transform: "translateY(-50%)", fontSize: 10 }}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable chart */}
        <div ref={scrollRef} className="timeline-scroll overflow-x-auto flex-1">
          <div style={{ width: totalWidth, position: "relative" }}>
            {/* Day headers */}
            <div className="flex" style={{ height: HEADER_HEIGHT }}>
              {perDay.map((d, i) => {
                const isToday = d.day.toDateString() === todayStr;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-center text-xs font-semibold border-b border-r last:border-r-0 border-stone-200 select-none ${
                      isToday ? "text-amber-800 bg-amber-100/60" : "text-stone-500"
                    }`}
                    style={{ width: COL_WIDTH, height: HEADER_HEIGHT }}
                  >
                    {formatDayLabel(d.day)}
                  </div>
                );
              })}
            </div>

            {/* Single SVG chart */}
            <svg width={totalWidth} height={TIMELINE_HEIGHT} className="block">
              {/* Column backgrounds */}
              {perDay.map((d, i) => {
                const isToday = d.day.toDateString() === todayStr;
                return (
                  <rect
                    key={`bg-${i}`}
                    x={i * COL_WIDTH}
                    y={0}
                    width={COL_WIDTH}
                    height={TIMELINE_HEIGHT}
                    fill={isToday ? "rgba(251,191,36,0.08)" : i % 2 === 0 ? "white" : "rgba(120,113,108,0.03)"}
                  />
                );
              })}

              {/* Column borders */}
              {perDay.map((_, i) => (
                <line key={`col-${i}`} x1={(i + 1) * COL_WIDTH} y1={0} x2={(i + 1) * COL_WIDTH} y2={TIMELINE_HEIGHT} stroke="rgb(214,211,209)" strokeWidth={1} />
              ))}

              {/* Hour grid lines */}
              {hourTicks.map((h) => {
                const y = hourToY(h);
                return (
                  <line key={`grid-${h}`} x1={0} y1={y} x2={totalWidth} y2={y} stroke={h % 3 === 0 ? "rgb(214,211,209)" : "rgb(231,229,228)"} strokeWidth={1} />
                );
              })}

              {/* Prediction windows */}
              {perDay.map((d, dayIdx) =>
                d.preds.map((p, pi) => {
                  const y1 = Math.max(0, tsToY(p.startTime, d.dayStartMs));
                  const y2 = Math.min(TIMELINE_HEIGHT, tsToY(p.endTime, d.dayStartMs));
                  if (y2 <= 0 || y1 >= TIMELINE_HEIGHT) return null;
                  return (
                    <rect key={`pred-${dayIdx}-${pi}`} x={dayIdx * COL_WIDTH + 3} y={y1} width={COL_WIDTH - 6} height={y2 - y1} rx={4} fill={`rgba(161,98,7,${0.12 * p.confidence})`} />
                  );
                })
              )}

              {/* Meal connecting lines */}
              {mealLines.map((points, idx) => {
                const segments: typeof points[] = [];
                let current: typeof points = [];

                for (let i = 0; i < points.length; i++) {
                  const p = points[i];
                  if (current.length === 0) {
                    current.push(p);
                    continue;
                  }
                  const prev = current[current.length - 1];
                  // Break line if one or more days are missing for this meal index.
                  if (p.dayIdx - prev.dayIdx > 1) {
                    if (current.length >= 2) segments.push(current);
                    current = [p];
                  } else {
                    current.push(p);
                  }
                }
                if (current.length >= 2) segments.push(current);

                return segments.map((segment, segIdx) => (
                  <polyline
                    key={`line-${idx}-${segIdx}`}
                    points={segment.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke={MEAL_LINE_COLORS[idx % MEAL_LINE_COLORS.length]}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ));
              })}

              {/* Poop dots (below meals) */}
              {perDay.map((d, dayIdx) =>
                d.events
                  .filter((e) => e.type === "poop")
                  .map((event) => {
                    const y = tsToY(event.timestamp, d.dayStartMs);
                    if (y < 0 || y > TIMELINE_HEIGHT) return null;
                    return (
                      <circle
                        key={event.id}
                        cx={dayIdx * COL_WIDTH + COL_WIDTH * 0.65}
                        cy={y}
                        r={4}
                        fill="#ef4444"
                        stroke="white"
                        strokeWidth={1.5}
                        className="cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setTappedEvent(tappedEvent === event.id ? null : event.id); }}
                      />
                    );
                  })
              )}

              {/* Meal dots (on top) */}
              {perDay.map((d, dayIdx) =>
                d.events
                  .filter((e) => e.type === "meal")
                  .map((event) => {
                    const y = tsToY(event.timestamp, d.dayStartMs);
                    if (y < 0 || y > TIMELINE_HEIGHT) return null;
                    return (
                      <circle
                        key={event.id}
                        cx={dayIdx * COL_WIDTH + COL_WIDTH * 0.5}
                        cy={y}
                        r={3.5}
                        fill="#22c55e"
                        stroke="white"
                        strokeWidth={1.5}
                        className="cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setTappedEvent(tappedEvent === event.id ? null : event.id); }}
                      />
                    );
                  })
              )}


            </svg>

            {/* Tooltip (HTML overlay) */}
            {tappedEvent && (() => {
              for (let dayIdx = 0; dayIdx < perDay.length; dayIdx++) {
                const d = perDay[dayIdx];
                const event = d.events.find((e) => e.id === tappedEvent);
                if (!event) continue;
                const y = tsToY(event.timestamp, d.dayStartMs);
                const isMeal = event.type === "meal";
                const cx = dayIdx * COL_WIDTH + COL_WIDTH * (isMeal ? 0.5 : 0.65);
                const time = new Date(event.timestamp).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
                return (
                  <div
                    key="tooltip"
                    className="absolute z-30 pointer-events-none"
                    style={{ left: cx, top: HEADER_HEIGHT + y - 8, transform: "translate(-50%, -100%)" }}
                  >
                    <div className="px-2 py-1 rounded-lg bg-stone-800 text-white text-[10px] whitespace-nowrap shadow-lg">
                      {isMeal ? "🍖" : "💩"} {time}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-stone-800" />
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Health record banners */}
            {perDay.map((d, dayIdx) => {
              if (d.health.length === 0) return null;
              return (
                <div
                  key={`health-${dayIdx}`}
                  className="absolute flex flex-col gap-1 px-0.5 pt-1 z-[5]"
                  style={{ left: dayIdx * COL_WIDTH, top: HEADER_HEIGHT, width: COL_WIDTH }}
                >
                  {d.health.map((r) => {
                    const isDeworm = r.type === "deworming";
                    return (
                      <div
                        key={r.id}
                        className={`relative flex items-center justify-center gap-1 rounded-lg text-[11px] font-medium cursor-pointer hover:opacity-80 active:scale-95 transition-all ${
                          r.completed
                            ? isDeworm ? "bg-rose-100 text-rose-700 border border-rose-200 shadow-sm" : "bg-sky-100 text-sky-700 border border-sky-200 shadow-sm"
                            : isDeworm ? "bg-rose-50 text-rose-400 border border-dashed border-rose-300" : "bg-sky-50 text-sky-400 border border-dashed border-sky-300"
                        }`}
                        style={{ height: 28, padding: "0 4px" }}
                        title={`${r.label}${r.completed ? "" : " (scheduled)"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTappedEvent(tappedEvent === `health-${r.id}` ? null : `health-${r.id}`);
                        }}
                      >
                        <span className="text-sm">{isDeworm ? "💊" : "💉"}</span>
                        {tappedEvent === `health-${r.id}` && (
                          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 rounded-lg bg-stone-800 text-white text-[10px] whitespace-nowrap shadow-lg z-30 pointer-events-none">
                            {isDeworm ? "💊" : "💉"} {r.label}{r.completed ? "" : " (Due)"}
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-stone-800" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right hour labels */}
        <div className="shrink-0 border-l border-stone-200 bg-stone-50" style={{ width: HOUR_LABEL_WIDTH }}>
          <div style={{ height: HEADER_HEIGHT }} />
          <div className="relative" style={{ height: TIMELINE_HEIGHT }}>
            {hourTicks.filter((h) => h % 2 === 0).map((h) => (
              <div
                key={h}
                className="absolute w-full text-left pl-1 text-stone-400 select-none leading-none"
                style={{ top: `${((h - START_HOUR) / HOUR_SPAN) * 100}%`, transform: "translateY(-50%)", fontSize: 10 }}
              >
                {formatHour(h)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
