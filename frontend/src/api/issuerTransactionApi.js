import axiosClient from "./axiosClient.js";

const issuerTransactionApi = {

  // Lấy danh sách giao dịch
  getAll(params = {}) {
    return axiosClient.get(
      "/issuer-transactions",
      { params }
    );
  },

  // Lấy thống kê giao dịch
  getStatistics() {
    return axiosClient.get(
      "/issuer-transactions/statistics"
    );
  },

};

export default issuerTransactionApi;