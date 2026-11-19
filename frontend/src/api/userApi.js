import axiosClient from "./axiosClient.js";

// ================================================
// API QUẢN LÝ TÀI KHOẢN CẤP PHÁT
// ================================================

const userApi = {

  // 1. Lấy danh sách tài khoản
  getAll() {
    return axiosClient.get("/users");
  },

  // 2. Lấy chi tiết tài khoản
  getById(id) {
    return axiosClient.get(`/users/${id}`);
  },

  // 3. Tạo tài khoản mới
  create(data) {
    return axiosClient.post("/users", data);
  },

  // 4. Cập nhật thông tin tài khoản
  update(id, data) {
    return axiosClient.put(`/users/${id}`, data);
  },

  // 5. Khóa hoặc mở khóa tài khoản
  updateStatus(id, isActive) {
    return axiosClient.patch(
      `/users/${id}/status`,
      { isActive }
    );
  },

};

export default userApi;