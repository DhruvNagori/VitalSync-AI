import {
  Building2,
  MapPin,
  Navigation,
  Phone,
  ShieldAlert
} from "lucide-react";

const CATEGORY_LABELS = {
  hospital: "Hospital",
  clinic: "Clinic",
  doctor: "Doctor / Medical Practice",
  healthcare: "Healthcare Facility"
};

function HospitalCard({
  hospital,
  selected = false,
  onSelect,
  onDirections
}) {
  const categoryLabel =
    CATEGORY_LABELS[hospital.category] || "Healthcare Facility";

  const distance =
    Number.isFinite(hospital.distance)
      ? `${hospital.distance.toFixed(2)} km away`
      : "Distance unavailable";

  return (
    <article
      className={`hospital-result-card ${selected ? "hospital-result-active" : ""}`}
    >
      <button
        type="button"
        className="hospital-card-select"
        onClick={() => onSelect?.(hospital)}
        aria-pressed={selected}
        aria-label={`Select ${hospital.name}`}
      >
        <div className="hospital-card-top">
          <div className="hospital-card-icon">
            <Building2 size={22} />
          </div>

          <div className="hospital-card-info">
            <h3>{hospital.name}</h3>
            <span>{categoryLabel}</span>
          </div>
        </div>

        <div className="hospital-card-meta">
          <p>
            <MapPin size={14} />
            <span>{hospital.address || "Address not available"}</span>
          </p>

          <p>
            <Navigation size={14} />
            <span>{distance}</span>
          </p>

          <p>
            <Phone size={14} />
            <span>{hospital.phone || "Contact number not listed"}</span>
          </p>
        </div>

        {hospital.specialty && hospital.specialty !== "Not specified" && (
          <div className="hospital-specialty">{hospital.specialty}</div>
        )}

        {hospital.emergencyTagged && (
          <span className="hospital-emergency-badge">
            <ShieldAlert size={13} />
            Emergency tag in map data
          </span>
        )}
      </button>

      <button
        className="hospital-direction-button"
        type="button"
        onClick={() => onDirections?.(hospital)}
      >
        <Navigation size={15} />
        Get Directions
      </button>
    </article>
  );
}

export default HospitalCard;
