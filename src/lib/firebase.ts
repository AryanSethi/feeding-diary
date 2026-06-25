import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp,
  type Firestore,
} from "firebase/firestore";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import type { DiaryEvent, EventType, HealthRecord, HealthRecordType } from "./types";
import { generateDummyData } from "./dummyData";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

function getFirebaseApp() {
  if (typeof window === "undefined") return null;
  if (!app) {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

function getDb(): Firestore {
  if (!db) db = getFirestore(getFirebaseApp()!);
  return db;
}

function getAuthInstance(): Auth {
  if (!auth) auth = getAuth(getFirebaseApp()!);
  return auth;
}

export async function ensureAuth() {
  const a = getAuthInstance();
  if (!a.currentUser) {
    await signInAnonymously(a);
  }
}

export function isFirebaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
}

export function subscribeToEvents(
  callback: (events: DiaryEvent[]) => void
) {
  if (!isFirebaseConfigured()) {
    callback([]);
    return () => {};
  }
  const eventsCollection = collection(getDb(), "events");
  const q = query(eventsCollection, orderBy("timestamp", "asc"));
  return onSnapshot(q, (snapshot) => {
    const events: DiaryEvent[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: data.type as EventType,
        timestamp:
          data.timestamp instanceof Timestamp
            ? data.timestamp.toMillis()
            : data.timestamp,
        notes: data.notes,
      };
    });
    callback(events);
  });
}

export async function addEvent(type: EventType, timestamp: number, notes?: string) {
  await ensureAuth();
  const eventsCollection = collection(getDb(), "events");
  await addDoc(eventsCollection, {
    type,
    timestamp: Timestamp.fromMillis(timestamp),
    notes: notes || null,
  });
}

export async function removeEvent(id: string) {
  await ensureAuth();
  await deleteDoc(doc(getDb(), "events", id));
}

/**
 * If Firestore has no events yet, seed it with the real recorded data.
 * This runs once on first visit after Firebase is configured.
 * Uses a lock flag to prevent concurrent calls from double-seeding.
 */
let seeding = false;
export async function seedFirestoreIfEmpty() {
  if (!isFirebaseConfigured() || seeding) return;
  seeding = true;
  try {
    await ensureAuth();
    const eventsCollection = collection(getDb(), "events");
    const snapshot = await getDocs(query(eventsCollection, orderBy("timestamp", "asc")));
    if (snapshot.size > 0) return; // Already has data

    const seedData = generateDummyData();
    for (const event of seedData) {
      await addDoc(eventsCollection, {
        type: event.type,
        timestamp: Timestamp.fromMillis(event.timestamp),
        notes: event.notes || null,
      });
    }
  } finally {
    seeding = false;
  }
}

// --- Health Records ---

export function subscribeToHealthRecords(
  callback: (records: HealthRecord[]) => void
) {
  if (!isFirebaseConfigured()) {
    callback([]);
    return () => {};
  }
  const col = collection(getDb(), "healthRecords");
  const q = query(col, orderBy("date", "asc"));
  return onSnapshot(q, (snapshot) => {
    const records: HealthRecord[] = snapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        type: data.type as HealthRecordType,
        date:
          data.date instanceof Timestamp
            ? data.date.toMillis()
            : data.date,
        label: data.label,
        notes: data.notes,
        completed: data.completed ?? true,
      };
    });
    callback(records);
  });
}

export async function addHealthRecord(
  type: HealthRecordType,
  date: number,
  label: string,
  completed: boolean,
  notes?: string
) {
  await ensureAuth();
  const col = collection(getDb(), "healthRecords");
  await addDoc(col, {
    type,
    date: Timestamp.fromMillis(date),
    label,
    completed,
    notes: notes || null,
  });
}

export async function updateHealthRecord(
  id: string,
  fields: Partial<Pick<HealthRecord, "label" | "date" | "notes" | "completed">>
) {
  await ensureAuth();
  const ref = doc(getDb(), "healthRecords", id);
  const update: Record<string, unknown> = {};
  if (fields.label !== undefined) update.label = fields.label;
  if (fields.notes !== undefined) update.notes = fields.notes || null;
  if (fields.completed !== undefined) update.completed = fields.completed;
  if (fields.date !== undefined) update.date = Timestamp.fromMillis(fields.date);
  await updateDoc(ref, update);
}

export async function removeHealthRecord(id: string) {
  await ensureAuth();
  await deleteDoc(doc(getDb(), "healthRecords", id));
}

// --- Seed health records ---

let seedingHealth = false;
export async function seedHealthRecordsIfEmpty() {
  if (!isFirebaseConfigured() || seedingHealth) return;
  seedingHealth = true;
  try {
    await ensureAuth();
    const col = collection(getDb(), "healthRecords");
    const snap = await getDocs(query(col, orderBy("date", "asc")));
    if (snap.size > 0) return;

    const seed: Omit<HealthRecord, "id">[] = [
      // Past deworming
      { type: "deworming", date: new Date(2026, 4, 25).getTime(), label: "1ml deworming med", completed: true },
      { type: "deworming", date: new Date(2026, 5, 5).getTime(), label: "1ml deworming med", completed: true },
      // Upcoming deworming
      { type: "deworming", date: new Date(2026, 5, 19).getTime(), label: "Deworming", completed: false },
      { type: "deworming", date: new Date(2026, 6, 3).getTime(), label: "Deworming", completed: false },
      { type: "deworming", date: new Date(2026, 7, 3).getTime(), label: "Deworming", completed: false },
      { type: "deworming", date: new Date(2026, 8, 3).getTime(), label: "Deworming", completed: false },
      { type: "deworming", date: new Date(2027, 0, 3).getTime(), label: "Deworming", completed: false },
      { type: "deworming", date: new Date(2027, 3, 3).getTime(), label: "Deworming", completed: false },
      { type: "deworming", date: new Date(2027, 6, 3).getTime(), label: "Deworming", completed: false },
      { type: "deworming", date: new Date(2027, 9, 3).getTime(), label: "Deworming", completed: false },
      // Past vaccinations
      { type: "vaccination", date: new Date(2026, 4, 20).getTime(), label: "DHPPiL", completed: true },
      { type: "vaccination", date: new Date(2026, 5, 4).getTime(), label: "Corona", completed: true },
      // Weights
      { type: "weight", date: new Date(2026, 4, 18).getTime(), label: "900g", completed: true },
      { type: "weight", date: new Date(2026, 5, 4).getTime(), label: "920g", completed: true },
      { type: "weight", date: new Date(2026, 5, 12).getTime(), label: "1.2 kg", completed: true },
    ];

    for (const rec of seed) {
      await addDoc(col, {
        type: rec.type,
        date: Timestamp.fromMillis(rec.date),
        label: rec.label,
        completed: rec.completed,
        notes: rec.notes || null,
      });
    }
  } finally {
    seedingHealth = false;
  }
}
