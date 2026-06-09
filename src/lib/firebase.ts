import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  Timestamp,
  type Firestore,
} from "firebase/firestore";
import { getAuth, signInAnonymously, type Auth } from "firebase/auth";
import type { DiaryEvent, EventType } from "./types";
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
 */
export async function seedFirestoreIfEmpty() {
  if (!isFirebaseConfigured()) return;
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
}
