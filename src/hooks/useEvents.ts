"use client";

import { useState, useEffect, useCallback } from "react";
import {
  subscribeToEvents,
  addEvent,
  removeEvent,
  isFirebaseConfigured,
  seedFirestoreIfEmpty,
} from "@/lib/firebase";
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
  const [useLocal, setUseLocal] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured()) {
      // Seed Firestore with real data if empty, then subscribe
      seedFirestoreIfEmpty().then(() => {
        const unsubscribe = subscribeToEvents((evts) => {
          setEvents(evts);
          setLoading(false);
        });
        return () => unsubscribe();
      });
    } else {
      setUseLocal(true);
      setEvents(loadLocal());
      setLoading(false);
    }
  }, []);

  const add = useCallback(
    async (type: EventType, timestamp?: number, notes?: string) => {
      const ts = timestamp ?? Date.now();
      if (useLocal) {
        setEvents((prev) => {
          const next = [
            ...prev,
            { id: crypto.randomUUID(), type, timestamp: ts, notes },
          ].sort((a, b) => a.timestamp - b.timestamp);
          saveLocal(next);
          return next;
        });
      } else {
        await addEvent(type, ts, notes);
      }
    },
    [useLocal]
  );

  const remove = useCallback(
    async (id: string) => {
      if (useLocal) {
        setEvents((prev) => {
          const next = prev.filter((e) => e.id !== id);
          saveLocal(next);
          return next;
        });
      } else {
        await removeEvent(id);
      }
    },
    [useLocal]
  );

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
