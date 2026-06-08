"use client";

import { useState } from "react";
import type { DiaryEvent } from "@/lib/types";

interface EventListProps {
  events: DiaryEvent[];
  onRemove: (id: string) => void;
}

export default function EventList({ events, onRemove }: EventListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-stone-400">
        <div className="text-3xl mb-2">🐾</div>
        <p className="text-sm">No events recorded for this day</p>
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wide px-1">
        Events
      </h3>
      {sorted.map((event) => {
        const isMeal = event.type === "meal";
        const time = new Date(event.timestamp).toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Kolkata",
        });

        return (
          <div
            key={event.id}
            className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
              isMeal
                ? "bg-green-50 border-green-200"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{isMeal ? "🍖" : "💩"}</span>
              <div>
                <span className="font-medium text-stone-800">
                  {isMeal ? "Meal" : "Poop"}
                </span>
                <span className="text-stone-500 ml-2 text-sm">{time}</span>
              </div>
            </div>

            {confirmId === event.id ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onRemove(event.id);
                    setConfirmId(null);
                  }}
                  className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-xs px-2 py-1 rounded-lg bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmId(event.id)}
                className="text-stone-400 hover:text-red-500 transition-colors p-1"
                aria-label="Remove event"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4L12 12M12 4L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
