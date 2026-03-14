"use client";

import { useState } from "react";

// ── Types ────────────────────────────────────────────────
interface BookingModalProps {
  jobTitle: string;
  companyName: string;
  onClose: () => void;
  onConfirmed: (booking: BookingResult) => void;
}

export interface BookingResult {
  date: string;         // "2026-03-12"
  timeSlot: string;     // "10:00"
  interviewType: "online" | "in-person";
  confirmedAt: string;  // ISO timestamp
}

// ── Calendar helpers ─────────────────────────────────────
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const TIME_SLOTS = ["09:00", "11:00", "14:00", "16:00"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// Available dates: weekdays, starting from 3 days after today
function getAvailableDates(): Set<string> {
  const available = new Set<string>();
  const start = new Date();
  start.setDate(start.getDate() + 3);

  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const day = d.getDay();
    if (day !== 0 && day !== 6) { // Exclude weekends
      available.add(d.toISOString().slice(0, 10));
    }
  }
  return available;
}

// ── Component ────────────────────────────────────────────
export default function BookingModal({ jobTitle, companyName, onClose, onConfirmed }: BookingModalProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [interviewType, setInterviewType] = useState<"online" | "in-person">("online");
  const [step, setStep] = useState<"pick" | "confirm" | "done">("pick");
  const [loading, setLoading] = useState(false);

  const availableDates = getAvailableDates();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDate(null);
    setSelectedTime(null);
  }

  function formatDateLabel(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);

    try {
      await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: jobTitle,
          company_name: companyName,
          date: selectedDate,
          time_slot: selectedTime,
          interview_type: interviewType,
        }),
      });
    } catch {
      // Proceed even if API fails — demo mode
    }

    // Simulate processing
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setStep("done");

    onConfirmed({
      date: selectedDate,
      timeSlot: selectedTime,
      interviewType,
      confirmedAt: new Date().toISOString(),
    });
  }

  // ── Done Screen ─────────────────────────────────────
  if (step === "done") {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-xl font-black text-slate-900 mb-1">Interview Booked!</h3>
          <p className="text-slate-500 text-sm mb-5">
            Your interview has been scheduled and added to Google Calendar.
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left space-y-2 mb-6">
            <DetailRow icon="📋" label="Job" value={jobTitle} />
            <DetailRow icon="🏢" label="Company" value={companyName} />
            <DetailRow icon="📅" label="Date" value={selectedDate ? formatDateLabel(selectedDate) : ""} />
            <DetailRow icon="⏰" label="Time" value={selectedTime ?? ""} />
            <DetailRow icon={interviewType === "online" ? "💻" : "📍"} label="Type"
              value={interviewType === "online" ? "Online (Google Meet)" : "In-Person"} />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 justify-center mb-5">
            <span className="text-emerald-500">✓</span>
            Added to Google Calendar
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1e3a5f] text-white font-bold rounded-xl text-sm"
          >
            Done →
          </button>
        </div>
      </ModalShell>
    );
  }

  // ── Confirm Screen ──────────────────────────────────
  if (step === "confirm") {
    return (
      <ModalShell onClose={onClose}>
        <div className="p-5">
          <h3 className="text-lg font-black text-slate-900 mb-1">Confirm Interview</h3>
          <p className="text-slate-500 text-sm mb-5">Please review your booking details.</p>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-5 text-sm">
            <DetailRow icon="📋" label="Job" value={jobTitle} />
            <DetailRow icon="🏢" label="Company" value={companyName} />
            <DetailRow icon="📅" label="Date" value={selectedDate ? formatDateLabel(selectedDate) : ""} />
            <DetailRow icon="⏰" label="Time" value={selectedTime ?? ""} />
            <DetailRow icon={interviewType === "online" ? "💻" : "📍"} label="Type"
              value={interviewType === "online" ? "Online (Google Meet)" : "In-Person"} />
          </div>

          <p className="text-xs text-slate-400 mb-5 text-center">
            A confirmation will be sent via the KUMIKOJEM app.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("pick")}
              className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl text-sm"
            >
              ← Edit
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors disabled:bg-slate-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Booking...
                </>
              ) : "✅ Confirm Booking"}
            </button>
          </div>
        </div>
      </ModalShell>
    );
  }

  // ── Pick Screen (Calendar) ──────────────────────────
  const canProceed = selectedDate && selectedTime;

  return (
    <ModalShell onClose={onClose}>
      <div className="p-4">
        {/* Header */}
        <h3 className="text-lg font-black text-slate-900 mb-0.5">Book an Interview</h3>
        <p className="text-slate-500 text-xs mb-4">{jobTitle} · {companyName}</p>

        {/* Interview Type Toggle */}
        <div className="flex gap-2 mb-4">
          {(["online", "in-person"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setInterviewType(type)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                interviewType === type
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {type === "online" ? "💻 Online" : "📍 In-Person"}
            </button>
          ))}
        </div>

        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
            ‹
          </button>
          <span className="font-bold text-slate-800 text-sm">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600">
            ›
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 mb-4">
          {/* Empty cells for alignment */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isAvailable = availableDates.has(dateStr);
            const isSelected = selectedDate === dateStr;
            const isPast = new Date(dateStr) < new Date(today.toISOString().slice(0, 10));

            return (
              <button
                key={day}
                disabled={!isAvailable || isPast}
                onClick={() => { setSelectedDate(dateStr); setSelectedTime(null); }}
                className={`aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                  isSelected
                    ? "bg-[#1e3a5f] text-white font-bold shadow"
                    : isAvailable
                    ? "hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                    : isPast
                    ? "text-slate-300 cursor-not-allowed"
                    : "text-slate-300 cursor-not-allowed"
                }`}
              >
                {day}
                {isAvailable && !isPast && !isSelected && (
                  <span className="sr-only">(available)</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Time Slots */}
        {selectedDate && (
          <>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              Select Time — <span className="font-normal text-slate-400">{formatDateLabel(selectedDate)}</span>
            </p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    selectedTime === slot
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-700 hover:border-blue-400"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Proceed button */}
        <button
          disabled={!canProceed}
          onClick={() => setStep("confirm")}
          className="w-full py-3 bg-[#1e3a5f] disabled:bg-slate-200 text-white font-bold rounded-xl text-sm transition-all"
        >
          {canProceed ? "Next: Confirm →" : "Select a date and time"}
        </button>
      </div>
    </ModalShell>
  );
}

// ── Shared UI helpers ────────────────────────────────────
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>
        {children}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base leading-none mt-0.5">{icon}</span>
      <span className="text-slate-500 w-16 flex-shrink-0">{label}</span>
      <span className="font-semibold text-slate-800 flex-1">{value}</span>
    </div>
  );
}
