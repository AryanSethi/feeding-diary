"use client";

import { useState } from "react";
import { MEAL_PRESETS } from "@/lib/types";

interface QuickActionsProps {
  selectedDate: Date;
  onAddMeal: (timestamp: number) => void;
  onAddPoop: (timestamp: number) => void;
}

export default function QuickActions({ selectedDate, onAddMeal, onAddPoop }: QuickActionsProps) {
  const isToday = new Date().toDateString() === selectedDate.toDateString();
  const [showPastPoop, setShowPastPoop] = useState(false);
  const [showPastMeal, setShowPastMeal] = useState(false);
  const [pastDate, setPastDate] = useState("");
  const [pastTime, setPastTime] = useState("");
  const [pastMealDate, setPastMealDate] = useState("");
  const [pastMealTime, setPastMealTime] = useState("");

  const handleNowMeal = () => onAddMeal(Date.now());
  const handleNowPoop = () => onAddPoop(Date.now());

  const handlePresetMeal = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date(selectedDate);
    d.setHours(h, m, 0, 0);
    onAddMeal(d.getTime());
  };

  const handlePastPoop = () => {
    if (!pastDate || !pastTime) return;
    const [y, mo, d] = pastDate.split("-").map(Number);
    const [h, m] = pastTime.split(":").map(Number);
    const ts = new Date(y, mo - 1, d, h, m, 0, 0).getTime();
    onAddPoop(ts);
    setPastDate("");
    setPastTime("");
    setShowPastPoop(false);
  };

  const handlePastMeal = () => {
    if (!pastMealDate || !pastMealTime) return;
    const [y, mo, d] = pastMealDate.split("-").map(Number);
    const [h, m] = pastMealTime.split(":").map(Number);
    const ts = new Date(y, mo - 1, d, h, m, 0, 0).getTime();
    onAddMeal(ts);
    setPastMealDate("");
    setPastMealTime("");
    setShowPastMeal(false);
  };

  return (
    <div className="space-y-3">
      {/* Quick add buttons — now */}
      {isToday && (
        <div className="flex gap-3">
          <button
            onClick={handleNowMeal}
            className="flex-1 py-3 px-4 rounded-2xl bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold text-base shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">🍖</span> Fed Poodle
          </button>
          <button
            onClick={handleNowPoop}
            className="flex-1 py-3 px-4 rounded-2xl bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white font-semibold text-base shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">💩</span> Poodle Pooped
          </button>
        </div>
      )}

      {/* Add past poop */}
      <div>
        {!showPastPoop ? (
          <button
            onClick={() => setShowPastPoop(true)}
            className="w-full py-2 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 text-sm font-medium border border-amber-200 transition-colors"
          >
            + Add poop from the past
          </button>
        ) : (
          <div className="flex gap-2 items-end flex-wrap p-3 rounded-xl bg-amber-50 border border-amber-200">
            <div>
              <label className="text-xs text-amber-700 font-medium block mb-1">Date</label>
              <input
                type="date"
                value={pastDate}
                onChange={(e) => setPastDate(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-amber-300 text-sm bg-white text-stone-800"
              />
            </div>
            <div>
              <label className="text-xs text-amber-700 font-medium block mb-1">Time</label>
              <input
                type="time"
                value={pastTime}
                onChange={(e) => setPastTime(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-amber-300 text-sm bg-white text-stone-800"
              />
            </div>
            <button
              onClick={handlePastPoop}
              disabled={!pastDate || !pastTime}
              className="px-3 py-1.5 rounded-lg bg-amber-700 text-white text-sm font-medium hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              💩 Add
            </button>
            <button
              onClick={() => setShowPastPoop(false)}
              className="px-3 py-1.5 rounded-lg bg-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Add past meal */}
      <div>
        {!showPastMeal ? (
          <button
            onClick={() => setShowPastMeal(true)}
            className="w-full py-2 px-4 rounded-xl bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-800 text-sm font-medium border border-green-200 transition-colors"
          >
            + Add meal from the past
          </button>
        ) : (
          <div className="flex gap-2 items-end flex-wrap p-3 rounded-xl bg-green-50 border border-green-200">
            <div>
              <label className="text-xs text-green-700 font-medium block mb-1">Date</label>
              <input
                type="date"
                value={pastMealDate}
                onChange={(e) => setPastMealDate(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-green-300 text-sm bg-white text-stone-800"
              />
            </div>
            <div>
              <label className="text-xs text-green-700 font-medium block mb-1">Time</label>
              <input
                type="time"
                value={pastMealTime}
                onChange={(e) => setPastMealTime(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-green-300 text-sm bg-white text-stone-800"
              />
            </div>
            <button
              onClick={handlePastMeal}
              disabled={!pastMealDate || !pastMealTime}
              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              🍖 Add
            </button>
            <button
              onClick={() => setShowPastMeal(false)}
              className="px-3 py-1.5 rounded-lg bg-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Preset meal times */}
      <div className="flex gap-2 flex-wrap">
        {MEAL_PRESETS.map((preset) => {
          const [h, m] = preset.time.split(":").map(Number);
          const label = `${h > 12 ? h - 12 : h}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
          return (
            <button
              key={preset.time}
              onClick={() => handlePresetMeal(preset.time)}
              className="px-3 py-1.5 rounded-xl bg-green-50 hover:bg-green-100 active:bg-green-200 text-green-800 text-sm font-medium border border-green-200 transition-colors"
            >
              🍖 {preset.label} ({label})
            </button>
          );
        })}
      </div>
    </div>
  );
}
