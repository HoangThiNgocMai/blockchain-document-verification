import { Link } from "react-router-dom";

function StatCard({
  title,
  value,
  icon,
  color = "primary",
  path,
}) {
  return (
    <div className="card stat-card h-100">
      <div className="card-body">

        <div className="d-flex
                        justify-content-between
                        align-items-start gap-2">

          <div>
            <p className="stat-title">
              {title}
            </p>

            <h2 className={`stat-value text-${color}`}>
              {value ?? "—"}
            </h2>
          </div>

          <div
            className={`stat-icon
                        text-${color}
                        bg-${color}-subtle`}
          >
            <i className={`bi ${icon}`}></i>
          </div>

        </div>

        {path && (
          <Link
            to={path}
            className="stat-link"
          >
            Xem chi tiết

            <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        )}

      </div>
    </div>
  );
}

export default StatCard;