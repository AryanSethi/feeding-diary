"use client";

import { useState } from "react";
import { useEvents, useEventsForDay } from "@/hooks/useEvents";
import { usePrediction } from "@/hooks/usePrediction";
import Timeline from "@/components/Timeline";
import DayNavigator from "@/components/DayNavigator";
import QuickActions from "@/components/QuickActions";
import StatsPanel from "@/components/StatsPanel";
import EventList from "@/components/EventList";

export default function Home() {
  const { events, loading, add, remove } = useEvents();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dayEvents = useEventsForDay(events, selectedDate);
  const todaysMeals = dayEvents.filter((e) => e.type === "meal");
  const predictions = usePrediction(events, todaysMeals);

  const handleAddMeal = (timestamp: number) => add("meal", timestamp);
  const handleAddPoop = (timestamp: number) => add("poop", timestamp);

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
    <main className="max-w-2xl mx-auto px-4 pb-40 md:pb-8">
      {/* Header */}
      <header className="pt-6 pb-4 text-center">
        <h1 className="text-2xl font-bold text-stone-800">
          🐶 Poodle&apos;s Diary
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Feeding &amp; pooping tracker
        </p>
      </header>

      {/* Day Navigator */}
      <div className="mb-4">
        <DayNavigator
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      {/* Timeline */}
      <div className="mb-4">
        <Timeline
          allEvents={events}
          predictions={predictions}
          selectedDate={selectedDate}
          daysToShow={7}
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
      <div className="mb-4">
        <EventList events={dayEvents} onRemove={remove} />
      </div>

      {/* Quick Actions — floating on mobile, inline on desktop */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-stone-200 p-4 md:static md:bg-transparent md:backdrop-blur-none md:border-0 md:p-0 md:mb-4">
        <div className="max-w-2xl mx-auto">
          <QuickActions
            selectedDate={selectedDate}
            onAddMeal={handleAddMeal}
            onAddPoop={handleAddPoop}
          />
        </div>
      </div>
    </main>
  );
}
