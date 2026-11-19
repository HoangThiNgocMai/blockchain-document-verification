import axiosClient from "./axiosClient";

const authApi = {
  // Đăng nhập
  login(data) {
    return axiosClient.post("/auth/login", data);
  },

  // Lấy thông tin tài khoản hiện tại
  getProfile() {
    return axiosClient.get("/auth/me");
  },

  // Xóa phiên đăng nhập trên trình duyệt
  logout() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("user");
  },
};

export default authApi;