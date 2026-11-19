import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import useAuth from "../../context/useAuth";
import "../../styles/login.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // XỬ LÝ ĐĂNG NHẬP
  // ==========================================
  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    // Kiểm tra dữ liệu nhập
    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setLoading(true);

      // Đăng nhập thông qua AuthContext
      const account = await login(email, password);

      // Xóa mật khẩu sau khi đăng nhập
      setPassword("");

      // Điều hướng theo vai trò tài khoản
      if (account.role === "admin") {

        navigate("/admin", { replace: true });

      } else if (account.role === "issuer") {

        navigate("/issuer", { replace: true });

      } else {

        navigate("/403", { replace: true });

      }

    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        setError(
          "Email hoặc mật khẩu không chính xác."
        );

      } else if (status === 403) {
        setError(
          "Tài khoản đã bị khóa hoặc chưa được cấp quyền truy cập."
        );

      } else if (status === 400) {
        setError(
          "Thông tin đăng nhập không hợp lệ."
        );

      } else if (status === 429) {
        setError(
          "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau."
        );

      } else if (err.isAxiosError && !err.response) {
        setError(
          "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối."
        );

      } else {
        setError(
          "Không thể đăng nhập. Vui lòng thử lại sau."
        );
      }

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GIAO DIỆN ĐĂNG NHẬP
  // ==========================================
  return (
    <div className="login-page">

      {/* Thanh tiêu đề */}
      <header className="login-header">
        <div className="container">
          <Link to="/" className="login-brand">

            <i className="bi bi-shield-check"></i>

            <span>
              HỆ THỐNG XÁC THỰC TÀI LIỆU BLOCKCHAIN
            </span>

          </Link>
        </div>
      </header>

      {/* Nội dung đăng nhập */}
      <main className="login-main">
        <div className="login-card">

          {/* Tiêu đề */}
          <div className="login-heading">

            <div className="login-icon">
              <i className="bi bi-shield-lock"></i>
            </div>

            <h1>ĐĂNG NHẬP</h1>

            <p>Đăng nhập để sử dụng hệ thống</p>

          </div>

          {/* Thông báo lỗi */}
          {error && (
            <div className="alert alert-danger" role="alert">

              <i className="bi bi-exclamation-circle me-2"></i>

              {error}

            </div>
          )}

          {/* Biểu mẫu đăng nhập */}
          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="mb-3">

              <label
                htmlFor="email"
                className="form-label"
              >
                Địa chỉ email
              </label>

              <div className="input-group">

                <span className="input-group-text">
                  <i className="bi bi-envelope"></i>
                </span>

                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="Nhập địa chỉ email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="username"
                  maxLength={150}
                  disabled={loading}
                  required
                />

              </div>
            </div>

            {/* Mật khẩu */}
            <div className="mb-4">

              <label
                htmlFor="password"
                className="form-label"
              >
                Mật khẩu
              </label>

              <div className="input-group">

                <span className="input-group-text">
                  <i className="bi bi-lock"></i>
                </span>

                <input
                  id="password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  className="form-control"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />

                {/* Nút ẩn hiện mật khẩu */}
                <button
                  type="button"
                  className="btn password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Ẩn mật khẩu"
                      : "Hiện mật khẩu"
                  }
                  disabled={loading}
                >
                  <i
                    className={
                      showPassword
                        ? "bi bi-eye-slash"
                        : "bi bi-eye"
                    }
                  ></i>
                </button>

              </div>
            </div>

            {/* Nút đăng nhập */}
            <button
              type="submit"
              className="btn btn-primary w-100 login-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>

                  Đang đăng nhập...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-right me-2"></i>

                  Đăng nhập
                </>
              )}
            </button>

          </form>

          {/* Quay về trang chủ */}
          <div className="login-back">

            <Link to="/">
              <i className="bi bi-arrow-left me-2"></i>

              Quay về trang chủ
            </Link>

          </div>

          <hr />

          <p className="login-note">
            Dành cho quản trị viên và người cấp phát tài liệu
          </p>

        </div>
      </main>

      {/* Chân trang */}
      <footer className="login-footer">
        Hệ thống xác thực tài liệu bằng công nghệ Blockchain
      </footer>

    </div>
  );
}

export default Login;