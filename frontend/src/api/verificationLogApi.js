import axiosClient from "./axiosClient.js";

const verificationLogApi = {

  // ==============================================
  // 1. LẤY DANH SÁCH LỊCH SỬ XÁC THỰC
  // ==============================================

  getAll(params = {}) {

    return axiosClient.get("/verification-logs", {
      params,
    });

  },


  // ==============================================
  // 2. LẤY THỐNG KÊ XÁC THỰC
  // ==============================================

  getStatistics() {

    return axiosClient.get(
      "/verification-logs/statistics"
    );

  },


  // ==============================================
  // 3. LẤY CHI TIẾT LỊCH SỬ XÁC THỰC
  // ==============================================

  getById(id) {

    return axiosClient.get(
      `/verification-logs/${id}`
    );

  },

};

export default verificationLogApi;