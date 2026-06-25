"use client";

import Image from "next/image";
import { POODLE_DOB, type HealthRecord } from "@/lib/types";
import { TZ, LOCALE } from "@/lib/types";

interface PoodleProfileProps {
  weightRecords: HealthRecord[];
  healthRecords: HealthRecord[];
}

function getAge(dob: number): string {
  const now = new Date();
  const birth = new Date(dob);
  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 1) {
    const days = Math.floor((now.getTime() - dob) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? "s" : ""} old`;
  }
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y > 0) return `${y}y ${m}m old`;
  return `${m} month${m !== 1 ? "s" : ""} old`;
}

function daysUntil(ms: number): string {
  const diff = Math.ceil((ms - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  return `in ${diff}d`;
}

function formatShortDate(ms: number): string {
  return new Date(ms).toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
    timeZone: TZ,
  });
}

export default function PoodleProfile({ weightRecords, healthRecords }: PoodleProfileProps) {
  const sortedWeights = [...weightRecords]
    .filter((r) => r.completed)
    .sort((a, b) => a.date - b.date);
  const latestWeight = sortedWeights[sortedWeights.length - 1];

  const dob = new Date(POODLE_DOB).toLocaleDateString(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TZ,
  });

  const profileCard = (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200">
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-300 shrink-0">
        <Image
          src="/poodle.jpg"
          alt="Poodle the Shih Tzu"
          width={48}
          height={48}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-stone-800 text-lg leading-tight">Poodle <span className="text-xs font-normal text-stone-400">Shih Tzu</span></div>
        <div className="text-sm text-stone-600">
          {getAge(POODLE_DOB)} · Born {dob}
        </div>
      </div>
      <div className="text-right">
        {latestWeight ? (
          <>
            <div className="text-lg font-bold text-amber-700">{latestWeight.label}</div>
            <div className="text-[10px] text-stone-500">
              {new Date(latestWeight.date).toLocaleDateString(LOCALE, {
                day: "numeric",
                month: "short",
                timeZone: TZ,
              })}
            </div>
          </>
        ) : (
          <div className="text-sm text-stone-400">No weight data</div>
        )}
      </div>
    </div>
  );

  const nextDeworm = healthRecords
    .filter((r) => r.type === "deworming" && !r.completed)
    .sort((a, b) => a.date - b.date)[0];
  const nextVax = healthRecords
    .filter((r) => r.type === "vaccination" && !r.completed)
    .sort((a, b) => a.date - b.date)[0];

  if (!nextDeworm && !nextVax) return profileCard;

  return (
    <div className="space-y-2">
      {profileCard}
      <div className="flex gap-2">
        {nextDeworm && (
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200">
            <span className="text-sm">💊</span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-rose-700 leading-tight">Deworming</div>
              <div className="text-[10px] text-rose-600">{formatShortDate(nextDeworm.date)} · <span className="font-medium">{daysUntil(nextDeworm.date)}</span></div>
            </div>
          </div>
        )}
        {nextVax && (
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200">
            <span className="text-sm">💉</span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-sky-700 leading-tight">Vaccination</div>
              <div className="text-[10px] text-sky-600">{formatShortDate(nextVax.date)} · <span className="font-medium">{daysUntil(nextVax.date)}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
