import axiosClient from "./axiosClient.js";

// ================================================
// API QUẢN LÝ TÀI LIỆU
// ================================================

const documentApi = {

  // 1. Lấy danh sách tài liệu
  getAll(params = {}) {

    return axiosClient.get("/documents", {
      params,
    });

  },

  // 2. Lấy chi tiết tài liệu
  getById(id) {

    return axiosClient.get(`/documents/${id}`);

  },

  // 3. Lấy lịch sử giao dịch Blockchain
  getTransactions(id) {

    return axiosClient.get(
      `/documents/${id}/transactions`
    );

  },

  // 4. Lấy lịch sử xác thực
  getVerifications(id, params = {}) {

    return axiosClient.get(
      `/documents/${id}/verifications`,
      { params }
    );

  },

};

export default documentApi;