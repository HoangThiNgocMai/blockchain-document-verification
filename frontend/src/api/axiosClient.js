import axios from "axios";

const axiosClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:3000/api",

  timeout: 30000,

  headers: {
    Accept: "application/json",
  },
});

// Gửi JWT kèm theo yêu cầu API
axiosClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken");

    if (token && config.url !== "/auth/login") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý phản hồi từ Backend
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },

  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url;

    const currentToken =
      sessionStorage.getItem("accessToken");

    const requestToken =
      error.config?.headers?.Authorization;

    // Xử lý khi phiên đăng nhập không hợp lệ
    if (
      status === 401 &&
      requestUrl !== "/auth/login" &&
      currentToken &&
      requestToken === `Bearer ${currentToken}`
    ) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("user");

      // Thông báo cho AuthContext
      window.dispatchEvent(
        new Event("auth:expired")
      );
    }

    return Promise.reject(error);
  }
);

export default axiosClient;