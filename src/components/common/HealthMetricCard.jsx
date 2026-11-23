
function HealthMetricCard({
  icon: Icon,
  title,
  value,
  unit,
  description
}) {
  return (
    <div className="health-metric-card">

      <div className="health-metric-header">

        <div className="health-metric-icon">
          {Icon && <Icon size={22} />}
        </div>

        <span>{title}</span>

      </div>

      <div className="health-metric-value">
        <h2>{value}</h2>
        <span>{unit}</span>
      </div>

      {description && (
        <p className="health-metric-description">
          {description}
        </p>
      )}

    </div>
  );
}

export default HealthMetricCard;
