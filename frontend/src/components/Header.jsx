import useAuth from "../context/useAuth.js";

function Header({ onToggleSidebar, isOpen }) {
  const { user } = useAuth();

  const roleName =
    user?.role === "admin"
      ? "Quản trị viên"
      : "Người cấp phát";

  return (
    <header className="app-header">

      {/* Bên trái */}
      <div className="header-left">

        <button
          type="button"
          className="header-toggle"
          onClick={onToggleSidebar}
          aria-label="Đóng hoặc mở thanh menu"
          aria-expanded={isOpen}
        >
          <i className="bi bi-list"></i>
        </button>

        <h5 className="header-title">
          {user?.role === "admin"
            ? "Hệ thống quản trị"
            : "Hệ thống cấp phát"}
        </h5>

      </div>

      {/* Thông tin người dùng */}
      <div className="header-user">

        <div className="header-avatar">
          <i className="bi bi-person-circle"></i>
        </div>

        <div className="header-user-info">

          <strong>
            {user?.fullName || "Người dùng"}
          </strong>

          <small>{roleName}</small>

        </div>

      </div>

    </header>
  );
}

export default Header;