"use client";

import { useState } from "react";
import ScatterChart from "@/components/ScatterChart";
import type { HealthRecord, HealthRecordType } from "@/lib/types";

interface HealthRecordsProps {
  records: HealthRecord[];
  onAdd: (
    type: HealthRecordType,
    date: number,
    label: string,
    completed: boolean,
    notes?: string
  ) => void;
  onUpdate: (
    id: string,
    fields: Partial<Pick<HealthRecord, "label" | "date" | "notes" | "completed">>
  ) => void;
  onRemove: (id: string) => void;
}

const MEDICAL_TYPES: { key: Exclude<HealthRecordType, "weight">; label: string; emoji: string; color: string }[] = [
  { key: "deworming", label: "Deworming", emoji: "💊", color: "rose" },
  { key: "vaccination", label: "Vaccination", emoji: "💉", color: "sky" },
];

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function toInputDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

function fromInputDate(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

function parseWeightKg(label: string): number | null {
  const normalized = label.trim().toLowerCase();
  const m = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value)) return null;
  if (normalized.includes("kg")) return value;
  if (normalized.includes("g") && !normalized.includes("kg")) return value / 1000;
  return value;
}

export default function HealthRecords({
  records,
  onAdd,
  onUpdate,
  onRemove,
}: HealthRecordsProps) {
  const [addType, setAddType] = useState<Exclude<HealthRecordType, "weight">>("deworming");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showWeightAddForm, setShowWeightAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<HealthRecordType | null>(null);

  // Medical add form state
  const [addDate, setAddDate] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addCompleted, setAddCompleted] = useState(true);

  // Weight add form state
  const [weightDate, setWeightDate] = useState("");
  const [weightValue, setWeightValue] = useState("");
  const [weightNotes, setWeightNotes] = useState("");

  // Edit form state
  const [editDate, setEditDate] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCompleted, setEditCompleted] = useState(true);

  const selectedAddType = MEDICAL_TYPES.find((t) => t.key === addType)!;
  const medicalRecords = records
    .filter((r) => r.type !== "weight")
    .sort((a, b) => a.date - b.date);
  const weightRecords = records
    .filter((r) => r.type === "weight")
    .sort((a, b) => a.date - b.date);

  const upcoming = medicalRecords.filter((r) => !r.completed);
  const past = medicalRecords.filter((r) => r.completed);
  const sortedCompletedWeights = weightRecords.filter((r) => r.completed);

  const weightPoints = sortedCompletedWeights
    .map((r) => {
      const value = parseWeightKg(r.label);
      if (value == null) return null;
      return {
        x: r.date,
        y: value,
        label: `${formatDate(r.date)} - ${value.toFixed(2)} kg`,
      };
    })
    .filter((p): p is { x: number; y: number; label: string } => p !== null);

  const latestWeightPoint = weightPoints[weightPoints.length - 1];
  const previousWeightPoint = weightPoints.length > 1 ? weightPoints[weightPoints.length - 2] : null;
  const weightDelta =
    latestWeightPoint && previousWeightPoint
      ? latestWeightPoint.y - previousWeightPoint.y
      : null;

  // Next upcoming across non-weight types
  const nextUpcoming = records
    .filter((r) => !r.completed && r.type !== "weight")
    .sort((a, b) => a.date - b.date)[0];

  const handleAddMedical = () => {
    if (!addDate || !addLabel) return;
    onAdd(addType, fromInputDate(addDate), addLabel, addCompleted, addNotes || undefined);
    setAddDate("");
    setAddLabel("");
    setAddNotes("");
    setAddCompleted(true);
    setShowAddForm(false);
  };

  const handleAddWeight = () => {
    if (!weightDate || !weightValue) return;
    const numeric = Number(weightValue);
    if (!Number.isFinite(numeric) || numeric <= 0) return;
    onAdd("weight", fromInputDate(weightDate), `${numeric.toFixed(2)} kg`, true, weightNotes || undefined);
    setWeightDate("");
    setWeightValue("");
    setWeightNotes("");
    setShowWeightAddForm(false);
  };

  const startEdit = (r: HealthRecord) => {
    setEditingId(r.id);
    setEditingType(r.type);
    setEditDate(toInputDate(r.date));
    setEditLabel(r.label);
    setEditNotes(r.notes || "");
    setEditCompleted(r.completed);
  };

  const saveEdit = () => {
    if (!editingId || !editDate || !editLabel) return;
    onUpdate(editingId, {
      date: fromInputDate(editDate),
      label: editLabel,
      notes: editNotes || undefined,
      completed: editingType === "weight" ? true : editCompleted,
    });
    setEditingId(null);
    setEditingType(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this record?")) {
      onRemove(id);
    }
  };

  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-800" },
    sky: { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-700", badge: "bg-sky-100 text-sky-800" },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800" },
    stone: { bg: "bg-stone-50", border: "border-stone-200", text: "text-stone-700", badge: "bg-stone-100 text-stone-800" },
  };
  const colors = colorMap[selectedAddType.color];
  const weightColors = colorMap.emerald;

  const getTypeMeta = (type: HealthRecordType) => {
    if (type === "deworming") return MEDICAL_TYPES[0];
    if (type === "vaccination") return MEDICAL_TYPES[1];
    return { key: "weight", label: "Weight", emoji: "⚖️", color: "emerald" };
  };

  return (
    <section className="rounded-3xl bg-gradient-to-br from-white via-stone-50 to-emerald-50/50 shadow-sm border border-stone-200 p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏥</span>
          <h2 className="font-semibold text-stone-800">Health Records</h2>
        </div>
        {nextUpcoming && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-medium border border-amber-200">
            Next due: {formatDate(nextUpcoming.date)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-2 rounded-2xl bg-white/90 border border-emerald-200 p-3 md:p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-sm font-semibold text-emerald-800">⚖️ Weight Tracker</div>
              <div className="text-xs text-emerald-700/80">Growth trend over time</div>
            </div>
            {latestWeightPoint ? (
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-700">{latestWeightPoint.y.toFixed(2)} kg</div>
                <div className="text-[11px] text-stone-500">
                  {weightDelta == null
                    ? "First recorded point"
                    : `${weightDelta >= 0 ? "+" : ""}${weightDelta.toFixed(2)} kg vs previous`}
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-500">No weight entries yet</div>
            )}
          </div>

          {weightPoints.length > 0 ? (
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 p-2">
              <ScatterChart
                points={weightPoints}
                yLabel="kg"
                color="#059669"
                yTickFormatter={(value) => `${value.toFixed(1)}kg`}
                height={160}
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 px-3 py-6 text-sm text-emerald-800/70 text-center">
              Add weight records to see your puppy&apos;s growth trend.
            </div>
          )}

          <div className="mt-3 space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {weightRecords.length === 0 && (
              <div className="text-xs text-stone-500">No weight history available.</div>
            )}
            {weightRecords.map((r) =>
              editingId === r.id ? renderEditForm(weightColors, "⚖️", true) : renderRecord(r, false, weightColors, "⚖️")
            )}
          </div>

          {!showWeightAddForm ? (
            <button
              onClick={() => {
                setShowWeightAddForm(true);
                setShowAddForm(false);
                setEditingId(null);
              }}
              className="w-full mt-3 py-2 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-medium border border-emerald-300 transition-colors"
            >
              + Add Weight Entry
            </button>
          ) : (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex gap-2 flex-wrap">
                <div>
                  <label className="text-xs text-emerald-700 font-medium block mb-1">Date</label>
                  <input
                    type="date"
                    value={weightDate}
                    onChange={(e) => setWeightDate(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-stone-300 text-sm bg-white text-stone-800"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="text-xs text-emerald-700 font-medium block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={weightValue}
                    onChange={(e) => setWeightValue(e.target.value)}
                    placeholder="e.g. 2.85"
                    className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-sm bg-white text-stone-800"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-emerald-700 font-medium block mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={weightNotes}
                  onChange={(e) => setWeightNotes(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-sm bg-white text-stone-800"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddWeight}
                  disabled={!weightDate || !weightValue}
                  className="px-3 py-1.5 rounded-lg text-emerald-800 bg-white border border-emerald-300 text-sm font-medium hover:bg-emerald-100 disabled:opacity-40 transition-colors"
                >
                  ⚖️ Save
                </button>
                <button
                  onClick={() => setShowWeightAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-3 rounded-2xl bg-white/95 border border-stone-200 p-3 md:p-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
            <div>
              <div className="text-sm font-semibold text-stone-800">💉 Medical Schedule</div>
              <div className="text-xs text-stone-500">Upcoming and history for both deworming and vaccinations</div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {medicalRecords.length} record{medicalRecords.length === 1 ? "" : "s"}
            </span>
          </div>

          {upcoming.length > 0 && (
            <div className="mb-3">
              <div className={`text-xs font-medium ${colors.text} uppercase tracking-wide mb-1`}>Upcoming</div>
              {upcoming.map((r) =>
                editingId === r.id && editingType === r.type
                  ? renderEditForm(colorMap[getTypeMeta(r.type).color], getTypeMeta(r.type).emoji, false)
                  : renderRecord(r, true, colorMap[getTypeMeta(r.type).color], getTypeMeta(r.type).emoji)
              )}
            </div>
          )}

          {past.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">History</div>
              {past.map((r) =>
                editingId === r.id && editingType === r.type
                  ? renderEditForm(colorMap[getTypeMeta(r.type).color], getTypeMeta(r.type).emoji, false)
                  : renderRecord(r, false, colorMap[getTypeMeta(r.type).color], getTypeMeta(r.type).emoji)
              )}
            </div>
          )}

          {medicalRecords.length === 0 && (
            <div className="text-sm text-stone-400 py-2">No records yet.</div>
          )}

          {!showAddForm ? (
            <button
              onClick={() => {
                setShowAddForm(true);
                setShowWeightAddForm(false);
                setEditingId(null);
              }}
              className={`w-full py-2 px-4 rounded-xl ${colors.bg} hover:opacity-80 ${colors.text} text-sm font-medium border ${colors.border} transition-colors`}
            >
              + Add Medical Record
            </button>
          ) : (
            <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border} space-y-2`}>
              <div className="flex gap-2 flex-wrap">
                {MEDICAL_TYPES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setAddType(t.key)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                      addType === t.key
                        ? `${colorMap[t.color].badge} ${colorMap[t.color].border}`
                        : "bg-white text-stone-600 border-stone-300 hover:bg-stone-100"
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                <div>
                  <label className={`text-xs ${colors.text} font-medium block mb-1`}>Date</label>
                  <input
                    type="date"
                    value={addDate}
                    onChange={(e) => setAddDate(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-stone-300 text-sm bg-white text-stone-800"
                  />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className={`text-xs ${colors.text} font-medium block mb-1`}>Details</label>
                  <input
                    type="text"
                    value={addLabel}
                    onChange={(e) => setAddLabel(e.target.value)}
                    placeholder={addType === "vaccination" ? "e.g. DHPPiL booster" : "e.g. 1ml deworming"}
                    className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-sm bg-white text-stone-800"
                  />
                </div>
              </div>
              <div>
                <label className={`text-xs ${colors.text} font-medium block mb-1`}>Notes (optional)</label>
                <input
                  type="text"
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-sm bg-white text-stone-800"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addCompleted}
                  onChange={(e) => setAddCompleted(e.target.checked)}
                  id="add-completed"
                  className="rounded"
                />
                <label htmlFor="add-completed" className="text-sm text-stone-600">Already done</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddMedical}
                  disabled={!addDate || !addLabel}
                  className={`px-3 py-1.5 rounded-lg ${colors.text} bg-white border ${colors.border} text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-colors`}
                >
                  {selectedAddType.emoji} Add
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );

  function renderRecord(
    r: HealthRecord,
    isUpcoming: boolean,
    scheme: { bg: string; border: string; text: string; badge: string },
    emoji: string
  ) {
    return (
      <div
        key={r.id}
        className={`flex items-center gap-3 py-2 px-3 rounded-xl mb-1 ${
          isUpcoming ? `${scheme.bg} border ${scheme.border}` : "bg-stone-50 border border-stone-100"
        }`}
      >
        <span className="text-sm">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isUpcoming ? scheme.text : "text-stone-700"}`}>
              {r.label}
            </span>
            {isUpcoming && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                Scheduled
              </span>
            )}
          </div>
          <div className="text-xs text-stone-500">
            {formatDate(r.date)}
            {r.notes && <span className="ml-2 italic">{r.notes}</span>}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          {isUpcoming && r.type !== "weight" && (
            <button
              onClick={() => onUpdate(r.id, { completed: true })}
              className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 font-medium transition-colors"
            >
              ✓ Done
            </button>
          )}
          <button
            onClick={() => startEdit(r)}
            className="text-xs px-2 py-1 rounded-lg bg-stone-200 text-stone-600 hover:bg-stone-300 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(r.id)}
            className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  function renderEditForm(
    scheme: { bg: string; border: string; text: string; badge: string },
    emoji: string,
    forceCompleted: boolean
  ) {
    return (
      <div
        key={editingId}
        className={`p-3 rounded-xl ${scheme.bg} border ${scheme.border} space-y-2 mb-1`}
      >
        <div className="flex gap-2 flex-wrap">
          <div>
            <label className={`text-xs ${scheme.text} font-medium block mb-1`}>Date</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-stone-300 text-sm bg-white text-stone-800"
            />
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className={`text-xs ${scheme.text} font-medium block mb-1`}>Details</label>
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-sm bg-white text-stone-800"
            />
          </div>
        </div>
        <div>
          <label className={`text-xs ${scheme.text} font-medium block mb-1`}>Notes</label>
          <input
            type="text"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-stone-300 text-sm bg-white text-stone-800"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={forceCompleted ? true : editCompleted}
            onChange={(e) => setEditCompleted(e.target.checked)}
            id="edit-completed"
            className="rounded"
            disabled={forceCompleted}
          />
          <label htmlFor="edit-completed" className="text-sm text-stone-600">
            {forceCompleted ? "Completed (always)" : "Completed"}
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={saveEdit}
            disabled={!editDate || !editLabel}
            className={`px-3 py-1.5 rounded-lg ${scheme.text} bg-white border ${scheme.border} text-sm font-medium hover:opacity-80 disabled:opacity-40 transition-colors`}
          >
            {emoji} Save
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setEditingType(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
}
