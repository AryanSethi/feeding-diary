"use client";

import { useState, useEffect, useCallback } from "react";
import { generateDummyData } from "@/lib/dummyData";
import type { DiaryEvent, EventType } from "@/lib/types";

const STORAGE_KEY = "poodle-diary-events";

function loadLocal(): DiaryEvent[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);
  const seed = generateDummyData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveLocal(events: DiaryEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function useEvents() {
  const [events, setEvents] = useState<DiaryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEvents(loadLocal());
    setLoading(false);
  }, []);

  const add = useCallback((type: EventType, timestamp?: number, notes?: string) => {
    const ts = timestamp ?? Date.now();
    setEvents((prev) => {
      const next = [
        ...prev,
        { id: crypto.randomUUID(), type, timestamp: ts, notes },
      ].sort((a, b) => a.timestamp - b.timestamp);
      saveLocal(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setEvents((prev) => {
      const next = prev.filter((e) => e.id !== id);
      saveLocal(next);
      return next;
    });
  }, []);

  return { events, loading, add, remove };
}

export function useEventsForDay(events: DiaryEvent[], date: Date): DiaryEvent[] {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return events.filter(
    (e) => e.timestamp >= startOfDay.getTime() && e.timestamp <= endOfDay.getTime()
  );
}
