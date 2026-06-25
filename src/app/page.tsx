"use client";

import { useRef, useState } from "react";
import { useEvents, useEventsForDay } from "@/hooks/useEvents";
import { usePrediction } from "@/hooks/usePrediction";
import { useHealthRecords } from "@/hooks/useHealthRecords";
import Timeline from "@/components/Timeline";
import DayNavigator from "@/components/DayNavigator";
import QuickActions from "@/components/QuickActions";
import StatsPanel from "@/components/StatsPanel";
import EventList from "@/components/EventList";
import HealthRecords from "@/components/HealthRecords";
import PoodleProfile from "@/components/PoodleProfile";

const COOKIE_NAME = "poodle-diary-auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Strict`;
}

export default function Home() {
  const { events, loading, add, remove } = useEvents();
  const { records: healthRecords, add: addHealth, update: updateHealth, remove: removeHealth } = useHealthRecords();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [authInput, setAuthInput] = useState("");
  const [authError, setAuthError] = useState(false);
  const pendingActionRef = useRef<null | (() => void)>(null);

  const appPassword = process.env.NEXT_PUBLIC_APP_PASSWORD;

  const dayEvents = useEventsForDay(events, selectedDate);
  const todaysMeals = dayEvents.filter((e) => e.type === "meal");
  const predictions = usePrediction(events, todaysMeals, dayEvents);

  const weightRecords = healthRecords.filter((r) => r.type === "weight");

  const runWithEditAuth = (action: () => void) => {
    if (!appPassword) {
      action();
      return;
    }

    const saved = getCookie(COOKIE_NAME);
    if (saved === appPassword) {
      action();
      return;
    }

    pendingActionRef.current = action;
    setShowAuthPrompt(true);
    setAuthInput("");
    setAuthError(false);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authInput === appPassword) {
      setCookie(COOKIE_NAME, authInput, COOKIE_MAX_AGE);
      setShowAuthPrompt(false);
      setAuthError(false);
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      action?.();
      return;
    }

    setAuthError(true);
    setAuthInput("");
  };

  const handleAddMeal = (timestamp: number) => runWithEditAuth(() => add("meal", timestamp));
  const handleAddPoop = (timestamp: number) => runWithEditAuth(() => add("poop", timestamp));
  const handleRemoveEvent = (id: string) => runWithEditAuth(() => remove(id));
  const handleAddHealth = (
    type: "deworming" | "vaccination" | "weight",
    date: number,
    label: string,
    completed: boolean,
    notes?: string
  ) => runWithEditAuth(() => addHealth(type, date, label, completed, notes));
  const handleUpdateHealth = (
    id: string,
    fields: { label?: string; date?: number; notes?: string; completed?: boolean }
  ) => runWithEditAuth(() => updateHealth(id, fields));
  const handleRemoveHealth = (id: string) => runWithEditAuth(() => removeHealth(id));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce">🐾</div>
          <p className="text-stone-400 mt-2">Loading Poodle&apos;s diary...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <main className="max-w-6xl mx-auto px-4 pb-8">
      {/* Header */}
      <header className="pt-6 pb-4 text-center">
        <h1 className="text-2xl font-bold text-stone-800">
          🐶 Poodle&apos;s Diary
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Feeding &amp; pooping tracker
        </p>
      </header>

      {/* Poodle Profile */}
      <div className="mb-4">
        <PoodleProfile weightRecords={weightRecords} healthRecords={healthRecords} />
      </div>

      {/* Day Navigator */}
      <div className="mb-4">
        <DayNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      {/* Quick Actions — above timeline so it never overlaps */}
      <div className="mb-4">
        <QuickActions
          selectedDate={selectedDate}
          onAddMeal={handleAddMeal}
          onAddPoop={handleAddPoop}
        />
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <Timeline
          allEvents={events}
          predictions={predictions}
          selectedDate={selectedDate}
          daysToShow={30}
          healthRecords={healthRecords}
        />
      </div>

      {/* Stats */}
      <div className="mb-4">
        <StatsPanel
          allEvents={events}
          todaysEvents={dayEvents}
          predictions={predictions}
        />
      </div>

      {/* Event List */}
      <div className="mb-6">
        <EventList events={dayEvents} onRemove={handleRemoveEvent} />
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-stone-300" />
        <span className="text-xs text-stone-400 font-medium uppercase tracking-wider">Medical Records</span>
        <div className="flex-1 h-px bg-stone-300" />
      </div>

      {/* Health Records */}
      <div className="mt-4 mb-4">
        <HealthRecords
          records={healthRecords}
          onAdd={handleAddHealth}
          onUpdate={handleUpdateHealth}
          onRemove={handleRemoveHealth}
        />
      </div>
    </main>
    {showAuthPrompt && (
      <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-[2px] flex items-center justify-center px-4">
        <form onSubmit={handlePasswordSubmit} className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-xl space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Enter password to edit</h2>
            <p className="text-sm text-stone-500 mt-1">View mode is open. Editing requires one-time password verification.</p>
          </div>

          <input
            type="password"
            value={authInput}
            onChange={(e) => {
              setAuthInput(e.target.value);
              setAuthError(false);
            }}
            autoFocus
            placeholder="Password"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white text-stone-800 outline-none transition-colors ${
              authError ? "border-red-400 focus:border-red-500" : "border-stone-300 focus:border-amber-400"
            }`}
          />

          {authError && <p className="text-xs text-red-500">Wrong password</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAuthPrompt(false);
                setAuthInput("");
                setAuthError(false);
                pendingActionRef.current = null;
              }}
              className="px-3 py-2 rounded-lg bg-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    )}
    </>
  );
}
