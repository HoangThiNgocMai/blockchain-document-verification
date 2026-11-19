import { Link } from "react-router-dom";
import useAuth from "../context/useAuth.js";

function ComingSoon({ title }) {
  const { user } = useAuth();

  const dashboardPath =
    user?.role === "admin" ? "/admin" : "/issuer";

  return (
    <div>

      <h3 className="mb-4">{title}</h3>

      <div className="card">

        <div className="card-body text-center py-5">

          <i
            className="bi bi-tools text-primary"
            style={{ fontSize: "60px" }}
          ></i>

          <h4 className="mt-3">
            Chức năng đang được phát triển
          </h4>

          <p className="text-secondary">
            Chức năng này sẽ được hoàn thiện
            trong các bước tiếp theo.
          </p>

          <Link
            to={dashboardPath}
            className="btn btn-primary mt-2"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Quay về trang tổng quan
          </Link>

        </div>
      </div>
    </div>
  );
}

export default ComingSoon;