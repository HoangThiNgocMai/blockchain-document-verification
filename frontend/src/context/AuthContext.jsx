import {
  useState,
  useEffect,
  useCallback,
} from "react";

import AuthContext from "./authContext";
import authApi from "../api/authApi";

function AuthProvider({ children }) {
  // Thông tin tài khoản
  const [user, setUser] = useState(null);

  // Trạng thái kiểm tra phiên đăng nhập
  const [loading, setLoading] = useState(true);

  // Xóa phiên đăng nhập
  const clearAuth = useCallback(() => {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");

    setUser(null);
  }, []);

  // Kiểm tra phiên đăng nhập khi mở website
  useEffect(() => {
    let cancelled = false;

    const handleExpired = () => {
      setUser(null);
    };

    window.addEventListener(
      "auth:expired",
      handleExpired
    );

    const initializeAuth = async () => {
      const token =
        sessionStorage.getItem("accessToken");

      try {
        if (!token) {
          if (!cancelled) {
            clearAuth();
          }

          return;
        }

        // Kiểm tra JWT với Backend
        const response = await authApi.getProfile();

        const profile = response.data;

        if (cancelled) {
          return;
        }

        if (
          !response.success ||
          !profile ||
          !["admin", "issuer"].includes(profile.role)
        ) {
          clearAuth();
          return;
        }

        // Cập nhật thông tin tài khoản
        sessionStorage.setItem(
          "user",
          JSON.stringify(profile)
        );

        setUser(profile);

      } catch {
        if (!cancelled) {
          clearAuth();
        }

      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;

      window.removeEventListener(
        "auth:expired",
        handleExpired
      );
    };

  }, [clearAuth]);

  // ==========================================
  // ĐĂNG NHẬP
  // ==========================================
  const login = async (email, password) => {
    const response = await authApi.login({
      email: email.trim().toLowerCase(),
      password,
    });

    const accessToken =
      response.data?.accessToken;

    const account =
      response.data?.user;

    if (
      !response.success ||
      !accessToken ||
      !account
    ) {
      throw new Error(
        "Không nhận được thông tin đăng nhập hợp lệ."
      );
    }

    // Kiểm tra vai trò tài khoản
    if (!["admin", "issuer"].includes(account.role)) {
      throw new Error(
        "Tài khoản không có quyền sử dụng hệ thống."
      );
    }

    // Lưu JWT
    sessionStorage.setItem(
      "accessToken",
      accessToken
    );

    // Lưu thông tin tài khoản
    sessionStorage.setItem(
      "user",
      JSON.stringify(account)
    );

    // Cập nhật trạng thái đăng nhập
    setUser(account);

    return account;
  };

  // ==========================================
  // ĐĂNG XUẤT
  // ==========================================
  const logout = () => {
    clearAuth();
  };

  // Chia sẻ thông tin đăng nhập toàn hệ thống
  const value = {
    user,
    loading,
    login,
    logout,

    isAuthenticated: Boolean(user),

    isAdmin: user?.role === "admin",

    isIssuer: user?.role === "issuer",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;