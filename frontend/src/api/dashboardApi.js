import axiosClient from "./axiosClient";

// API thống kê hệ thống
const dashboardApi = {
  // Thống kê quản trị viên
  getAdminDashboard() {
    return axiosClient.get("/dashboard/admin");
  },

  // Thống kê người cấp phát
  getIssuerDashboard() {
    return axiosClient.get("/dashboard/issuer");
  },
};

export default dashboardApi;