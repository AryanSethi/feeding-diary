"use client";

import { useRef, useEffect } from "react";
import type { DiaryEvent, PredictionWindow } from "@/lib/types";

// Layout: time flows top-to-bottom, days are columns left-to-right
const HEADER_HEIGHT = 36;
const HOUR_LABEL_WIDTH = 32;
// Full 24-hour range: midnight to midnight
const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_SPAN = END_HOUR - START_HOUR;
const TIMELINE_HEIGHT = 640;

interface TimelineProps {
  allEvents: DiaryEvent[];
  predictions: PredictionWindow[];
  selectedDate: Date;
  daysToShow?: number;
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

function timeToTopPercent(timestamp: number, dayStartMs: number): number {
  const hours = (timestamp - dayStartMs) / (1000 * 60 * 60);
  return ((hours - START_HOUR) / HOUR_SPAN) * 100;
}

export default function Timeline({
  allEvents,
  predictions,
  selectedDate,
  daysToShow = 7,
}: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayStr = new Date().toDateString();

  // Build array of days ending on selectedDate
  const days: Date[] = [];
  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  // Auto-scroll so the rightmost columns (most recent days) are visible
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [selectedDate.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hour tick marks
  const hourTicks: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hourTicks.push(h);
  }

  return (
    <div className="w-full rounded-2xl bg-white shadow-sm border border-stone-200 overflow-hidden">
      <div className="flex">
        {/* Fixed hour labels column */}
        <div
          className="shrink-0 border-r border-stone-200 bg-stone-50"
          style={{ width: HOUR_LABEL_WIDTH }}
        >
          {/* Spacer for header row */}
          <div style={{ height: HEADER_HEIGHT }} />
          {/* Hour labels */}
          <div className="relative" style={{ height: TIMELINE_HEIGHT }}>
            {hourTicks.filter((h) => h % 2 === 0).map((h) => {
              const top = ((h - START_HOUR) / HOUR_SPAN) * 100;
              return (
                <div
                  key={h}
                  className="absolute w-full text-right pr-1 text-stone-400 select-none leading-none"
                  style={{
                    top: `${top}%`,
                    transform: "translateY(-50%)",
                    fontSize: 10,
                  }}
                >
                  {formatHour(h)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scrollable day columns */}
        <div
          ref={scrollRef}
          className="timeline-scroll overflow-x-auto flex-1"
        >
          <div className="flex" style={{ minWidth: "100%" }}>
            {days.map((day, dayIdx) => {
              const dayStartMs = day.getTime();
              const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000 - 1;
              const isToday = day.toDateString() === todayStr;

              const dayEvents = allEvents.filter(
                (e) => e.timestamp >= dayStartMs && e.timestamp <= dayEndMs
              );
              const dayPredictions = predictions.filter(
                (p) => p.endTime >= dayStartMs && p.startTime <= dayEndMs
              );

              const now = Date.now();
              const nowPct = isToday ? timeToTopPercent(now, dayStartMs) : -1;
              const showNow = isToday && nowPct >= 0 && nowPct <= 100;

              return (
                <div
                  key={day.toISOString()}
                  className={`flex-1 min-w-[90px] border-r last:border-r-0 border-stone-100 ${
                    isToday ? "bg-amber-50/40" : dayIdx % 2 === 0 ? "bg-white" : "bg-stone-50/30"
                  }`}
                >
                  {/* Day header */}
                  <div
                    className={`flex items-center justify-center text-xs font-semibold border-b border-stone-200 select-none ${
                      isToday ? "text-amber-800 bg-amber-100/60" : "text-stone-500"
                    }`}
                    style={{ height: HEADER_HEIGHT }}
                  >
                    {formatDayLabel(day)}
                  </div>

                  {/* Vertical timeline area */}
                  <div className="relative" style={{ height: TIMELINE_HEIGHT }}>
                    {/* Hour grid lines (horizontal) */}
                    {hourTicks.map((h) => {
                      const top = ((h - START_HOUR) / HOUR_SPAN) * 100;
                      return (
                        <div
                          key={h}
                          className={`absolute left-0 w-full ${
                            h % 3 === 0 ? "border-t border-stone-200" : "border-t border-stone-100"
                          }`}
                          style={{ top: `${top}%` }}
                        />
                      );
                    })}

                    {/* Prediction windows */}
                    {dayPredictions.map((p, i) => {
                      const startPct = Math.max(0, timeToTopPercent(p.startTime, dayStartMs));
                      const endPct = Math.min(100, timeToTopPercent(p.endTime, dayStartMs));
                      if (endPct <= 0 || startPct >= 100) return null;
                      return (
                        <div
                          key={`pred-${i}`}
                          className="absolute left-1 right-1 rounded-md"
                          style={{
                            top: `${startPct}%`,
                            height: `${endPct - startPct}%`,
                            background: `linear-gradient(180deg,
                              rgba(161,98,7,0.06) 0%,
                              rgba(161,98,7,${0.18 * p.confidence}) 50%,
                              rgba(161,98,7,0.06) 100%)`,
                          }}
                          title={`Predicted ~${new Date(p.meanTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })}`}
                        />
                      );
                    })}

                    {/* Event markers */}
                    {(() => {
                      // Group events that are close in time (within 30 min)
                      const CLOSE_THRESHOLD_MS = 30 * 60 * 1000;
                      const sorted = [...dayEvents].sort((a, b) => a.timestamp - b.timestamp);
                      const clusters: DiaryEvent[][] = [];
                      for (const ev of sorted) {
                        const last = clusters[clusters.length - 1];
                        if (last && ev.timestamp - last[last.length - 1].timestamp < CLOSE_THRESHOLD_MS) {
                          last.push(ev);
                        } else {
                          clusters.push([ev]);
                        }
                      }

                      return clusters.flatMap((cluster) => {
                        const count = cluster.length;
                        return cluster.map((event, idx) => {
                          const pct = timeToTopPercent(event.timestamp, dayStartMs);
                          if (pct < 0 || pct > 100) return null;
                          const isMeal = event.type === "meal";
                          const time = new Date(event.timestamp).toLocaleTimeString("en-IN", {
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: "Asia/Kolkata",
                          });

                          // If clustered, spread horizontally
                          let leftStyle: string;
                          if (count === 1) {
                            leftStyle = "50%";
                          } else {
                            // Evenly distribute across 20%–80% of column width
                            const frac = count === 1 ? 0.5 : 0.2 + (0.6 * idx) / (count - 1);
                            leftStyle = `${frac * 100}%`;
                          }

                          return (
                            <div
                              key={event.id}
                              className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
                              style={{ top: `${pct}%`, left: leftStyle }}
                              title={`${isMeal ? "Meal" : "Poop"} at ${time}`}
                            >
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm border-2 border-white ${
                                  isMeal ? "bg-green-400" : "bg-amber-700"
                                }`}
                              >
                                {isMeal ? "🍖" : "💩"}
                              </div>
                            </div>
                          );
                        });
                      });
                    })()}

                    {/* Current time marker */}
                    {showNow && (
                      <div
                        className="absolute left-0 w-full z-20"
                        style={{ top: `${nowPct}%` }}
                      >
                        <div className="h-0.5 w-full bg-red-500" />
                        <div className="absolute -top-1 -left-0.5 w-2.5 h-2.5 rounded-full bg-red-500" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
