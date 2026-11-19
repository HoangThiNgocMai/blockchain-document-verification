import { NavLink, Link, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth.js";

// Danh sách chức năng quản trị viên
const adminMenu = [
  {
    title: "Tổng quan",
    icon: "bi-speedometer2",
    path: "/admin",
  },
  {
    title: "Đơn vị cấp phát",
    icon: "bi-buildings",
    path: "/admin/organizations",
  },
  {
    title: "Quản lý tài khoản",
    icon: "bi-people",
    path: "/admin/users",
  },
  {
    title: "Quản lý tài liệu",
    icon: "bi-file-earmark-text",
    path: "/admin/documents",
  },
  {
    title: "Lịch sử giao dịch",
    icon: "bi-clock-history",
    path: "/admin/transactions",
  },
  {
    title: "Lịch sử xác thực",
    icon: "bi-shield-check",
    path: "/admin/verifications",
  },
];

// Danh sách chức năng người cấp phát
const issuerMenu = [
  {
    title: "Tổng quan",
    icon: "bi-speedometer2",
    path: "/issuer",
  },
  {
    title: "Cấp phát tài liệu",
    icon: "bi-file-earmark-plus",
    path: "/issuer/documents/issue",
  },
  {
    title: "Danh sách tài liệu",
    icon: "bi-folder2-open",
    path: "/issuer/documents",
  },
  {
    title: "Thu hồi tài liệu",
    icon: "bi-file-earmark-x",
    path: "/issuer/documents/revoke",
  },
  {
    title: "Lịch sử giao dịch",
    icon: "bi-clock-history",
    path: "/issuer/transactions",
  },
  {
    title: "Lịch sử xác thực",
    icon: "bi-shield-check",
    path: "/issuer/verifications",
  },
];

function Sidebar({ role, isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const menuItems =
    role === "admin" ? adminMenu : issuerMenu;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={`app-sidebar ${
        isOpen ? "sidebar-open" : ""
      }`}
    >
      {/* Tên hệ thống */}
      <div className="sidebar-brand">

        <i className="bi bi-shield-check"></i>

        <h5>XÁC THỰC TÀI LIỆU</h5>

        <small>Blockchain</small>

      </div>

      {/* Danh sách chức năng */}
      <div className="sidebar-menu">

        <div className="sidebar-label">
          CHỨC NĂNG
        </div>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            onClick={onClose}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <i className={`bi ${item.icon}`}></i>

            <span>{item.title}</span>

          </NavLink>
        ))}

        <div className="sidebar-divider"></div>

        <div className="sidebar-label">
          TÀI KHOẢN
        </div>

        <Link
          to="/"
          className="sidebar-link"
          onClick={onClose}
        >
          <i className="bi bi-house"></i>

          <span>Về trang chủ</span>

        </Link>

        <button
          type="button"
          className="sidebar-link sidebar-logout"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-right"></i>

          <span>Đăng xuất</span>

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;