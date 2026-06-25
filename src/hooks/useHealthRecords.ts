"use client";

import { useState, useEffect, useCallback } from "react";
import {
  subscribeToHealthRecords,
  addHealthRecord,
  updateHealthRecord,
  removeHealthRecord,
  isFirebaseConfigured,
  ensureAuth,
  seedHealthRecordsIfEmpty,
} from "@/lib/firebase";
import type { HealthRecord, HealthRecordType } from "@/lib/types";

const STORAGE_KEY = "poodle-health-records";

function loadLocal(): HealthRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveLocal(records: HealthRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function useHealthRecords() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [useLocal, setUseLocal] = useState(false);

  useEffect(() => {
    if (isFirebaseConfigured()) {
      let unsubscribe: (() => void) | undefined;
      let cancelled = false;

      (async () => {
        try {
          await seedHealthRecordsIfEmpty();
        } catch (e) {
          console.warn("Health seed failed:", e);
        }
        if (cancelled) return;
        try {
          await ensureAuth();
        } catch (e) {
          console.warn("Auth failed:", e);
          setLoading(false);
          return;
        }
        if (cancelled) return;
        unsubscribe = subscribeToHealthRecords((recs) => {
          setRecords(recs);
          setLoading(false);
        });
      })();

      return () => {
        cancelled = true;
        unsubscribe?.();
      };
    } else {
      setUseLocal(true);
      setRecords(loadLocal());
      setLoading(false);
    }
  }, []);

  const add = useCallback(
    async (
      type: HealthRecordType,
      date: number,
      label: string,
      completed: boolean,
      notes?: string
    ) => {
      if (useLocal) {
        setRecords((prev) => {
          const next = [
            ...prev,
            { id: crypto.randomUUID(), type, date, label, completed, notes },
          ].sort((a, b) => a.date - b.date);
          saveLocal(next);
          return next;
        });
      } else {
        await addHealthRecord(type, date, label, completed, notes);
      }
    },
    [useLocal]
  );

  const update = useCallback(
    async (
      id: string,
      fields: Partial<Pick<HealthRecord, "label" | "date" | "notes" | "completed">>
    ) => {
      if (useLocal) {
        setRecords((prev) => {
          const next = prev.map((r) =>
            r.id === id ? { ...r, ...fields } : r
          );
          saveLocal(next);
          return next;
        });
      } else {
        await updateHealthRecord(id, fields);
      }
    },
    [useLocal]
  );

  const remove = useCallback(
    async (id: string) => {
      if (useLocal) {
        setRecords((prev) => {
          const next = prev.filter((r) => r.id !== id);
          saveLocal(next);
          return next;
        });
      } else {
        await removeHealthRecord(id);
      }
    },
    [useLocal]
  );

  return { records, loading, add, update, remove };
}
