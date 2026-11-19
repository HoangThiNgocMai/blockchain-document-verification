import { Link } from "react-router-dom";
import useAuth from "../../context/useAuth";

function Forbidden() {
  const { user } = useAuth();

  const returnPath =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "issuer"
        ? "/issuer"
        : "/";

  return (
    <div className="container text-center py-5">

      <i
        className="bi bi-shield-lock text-danger"
        style={{ fontSize: "70px" }}
      ></i>

      <h1 className="text-danger mt-3">
        403
      </h1>

      <h3>
        Không có quyền truy cập
      </h3>

      <p className="text-secondary mt-3">
        Tài khoản của bạn không có quyền
        truy cập vào khu vực này.
      </p>

      <Link
        to={returnPath}
        className="btn btn-primary mt-2"
      >
        <i className="bi bi-arrow-left me-2"></i>
        Quay về khu vực của bạn
      </Link>

    </div>
  );
}

export default Forbidden;