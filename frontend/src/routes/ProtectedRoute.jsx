import { Navigate, Outlet } from "react-router-dom";

import useAuth from "../context/useAuth";
import Loading from "../components/Loading";

function ProtectedRoute({
  allowedRoles = [],
  children,
}) {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  // Kiểm tra phiên đăng nhập
  if (loading) {
    return (
      <Loading
        message="Đang kiểm tra quyền truy cập..."
      />
    );
  }

  // Chưa đăng nhập
  if (!isAuthenticated || !user) {
    return (
      <Navigate to="/login" replace />
    );
  }

  // Không đúng vai trò
  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <Navigate to="/403" replace />
    );
  }

  // Cho phép truy cập
  return children ?? <Outlet />;
}

export default ProtectedRoute;