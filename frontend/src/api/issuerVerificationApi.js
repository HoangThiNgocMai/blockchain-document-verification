import axiosClient from "./axiosClient.js";

const issuerVerificationApi = {

  // Lấy danh sách lịch sử xác thực
  getAll(params = {}) {
    return axiosClient.get(
      "/issuer-verifications",
      { params }
    );
  },

  // Lấy thống kê xác thực
  getStatistics() {
    return axiosClient.get(
      "/issuer-verifications/statistics"
    );
  },

};

export default issuerVerificationApi;