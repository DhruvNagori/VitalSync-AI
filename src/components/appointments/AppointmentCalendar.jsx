import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

const pad = (value) => String(value).padStart(2, "0");

function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function AppointmentCalendar({
  value = "",
  onChange,
  minDate = toDateKey(startOfDay(new Date())),
  maxDate = "",
  disabledDates = [],
  disabled = false,
}) {
  const selectedDate = parseDateKey(value);
  const minimumDate = parseDateKey(minDate);
  const maximumDate = parseDateKey(maxDate);

  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initial = selectedDate || minimumDate || new Date();
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });

  const monthLabel = visibleMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const days = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Convert Sunday-first JS index to Monday-first calendar index.
    const leadingDays = (firstDay.getDay() + 6) % 7;

    return [
      ...Array(leadingDays).fill(null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [visibleMonth]);

  const canGoPrevious = (() => {
    if (!minimumDate) return true;
    const firstOfVisibleMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1
    );
    const firstOfMinimumMonth = new Date(
      minimumDate.getFullYear(),
      minimumDate.getMonth(),
      1
    );
    return firstOfVisibleMonth > firstOfMinimumMonth;
  })();

  const canGoNext = (() => {
    if (!maximumDate) return true;
    const firstOfNextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      1
    );
    const firstOfMaximumMonth = new Date(
      maximumDate.getFullYear(),
      maximumDate.getMonth(),
      1
    );
    return firstOfNextMonth <= firstOfMaximumMonth;
  })();

  function isDateDisabled(day) {
    if (!day) return true;
    const date = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      day
    );
    const key = toDateKey(date);
    if (minimumDate && date < startOfDay(minimumDate)) return true;
    if (maximumDate && date > startOfDay(maximumDate)) return true;
    return disabledDates.includes(key);
  }

  function selectDay(day) {
    if (isDateDisabled(day) || disabled) return;
    const date = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      day
    );
    onChange?.(toDateKey(date));
  }

  function changeMonth(offset) {
    setVisibleMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1)
    );
  }

  return (
    <section className="appointment-calendar" aria-label="Choose appointment date">
      <div className="appointment-calendar-heading">
        <div className="appointment-calendar-title">
          <CalendarDays size={18} aria-hidden="true" />
          <div>
            <strong>Select appointment date</strong>
            <span>Choose a date that works for you</span>
          </div>
        </div>

        <div className="appointment-calendar-navigation">
          <button
            type="button"
            className="appointment-calendar-nav"
            onClick={() => changeMonth(-1)}
            disabled={disabled || !canGoPrevious}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <strong aria-live="polite">{monthLabel}</strong>
          <button
            type="button"
            className="appointment-calendar-nav"
            onClick={() => changeMonth(1)}
            disabled={disabled || !canGoNext}
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="appointment-calendar-grid appointment-calendar-weekdays">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="appointment-calendar-grid">
        {days.map((day, index) => {
          if (!day) {
            return <span className="appointment-calendar-empty" key={`empty-${index}`} />;
          }

          const date = new Date(
            visibleMonth.getFullYear(),
            visibleMonth.getMonth(),
            day
          );
          const key = toDateKey(date);
          const isSelected = value === key;
          const isToday = key === toDateKey(startOfDay(new Date()));
          const unavailable = isDateDisabled(day);

          return (
            <button
              key={key}
              type="button"
              className={[
                "appointment-calendar-day",
                isSelected ? "is-selected" : "",
                isToday ? "is-today" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => selectDay(day)}
              disabled={disabled || unavailable}
              aria-pressed={isSelected}
              aria-label={date.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="appointment-calendar-footer">
        <span><i className="appointment-calendar-legend-selected" /> Selected date</span>
        <span>Past dates are unavailable</span>
      </div>

      {value && (
        <p className="appointment-calendar-selection" aria-live="polite">
          Selected: {selectedDate?.toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
    </section>
  );
}
