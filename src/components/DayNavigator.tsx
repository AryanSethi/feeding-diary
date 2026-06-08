"use client";

interface DayNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DayNavigator({ selectedDate, onDateChange }: DayNavigatorProps) {
  const isToday = new Date().toDateString() === selectedDate.toDateString();

  const goBack = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
  };

  const goForward = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next);
  };

  const goToday = () => onDateChange(new Date());

  const formatted = selectedDate.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={goBack}
        className="p-2 rounded-xl hover:bg-stone-100 active:bg-stone-200 transition-colors text-stone-600"
        aria-label="Previous day"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-stone-800">{formatted}</span>
        {!isToday && (
          <button
            onClick={goToday}
            className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors font-medium"
          >
            Today
          </button>
        )}
      </div>

      <button
        onClick={goForward}
        className="p-2 rounded-xl hover:bg-stone-100 active:bg-stone-200 transition-colors text-stone-600"
        aria-label="Next day"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}
