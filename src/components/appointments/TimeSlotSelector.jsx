import { Clock, CheckCircle2 } from "lucide-react";

export const DEFAULT_APPOINTMENT_SLOTS = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
];

export default function TimeSlotSelector({
  value = "",
  onChange,
  slots = DEFAULT_APPOINTMENT_SLOTS,
  disabled = false,
  unavailableSlots = [],
}) {
  const hasDate = Boolean(value || !disabled);

  return (
    <section className="time-slot-selector" aria-label="Choose appointment time">
      <div className="time-slot-heading">
        <div className="time-slot-heading-icon">
          <Clock size={18} />
        </div>
        <div>
          <strong>Available time slots</strong>
          <span>Select your preferred consultation time</span>
        </div>
      </div>

      {!hasDate ? (
        <div className="time-slot-empty">
          Select an appointment date to view time slots.
        </div>
      ) : (
        <div className="time-slot-grid">
          {slots.map((slot) => {
            const unavailable = unavailableSlots.includes(slot);
            const selected = value === slot;

            return (
              <button
                type="button"
                key={slot}
                className={[
                  "time-slot-option",
                  selected ? "is-selected" : "",
                ].filter(Boolean).join(" ")}
                onClick={() => onChange?.(slot)}
                disabled={disabled || unavailable}
                aria-pressed={selected}
              >
                <span>{slot}</span>
                {selected && <CheckCircle2 size={15} />}
                {unavailable && <small>Unavailable</small>}
              </button>
            );
          })}
        </div>
      )}

      <p className="time-slot-note">
        <span className="time-slot-dot" />
        Time slots shown are demonstration slots until live doctor schedules
        are connected.
      </p>
    </section>
  );
}
