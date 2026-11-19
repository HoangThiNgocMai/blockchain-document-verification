import axiosClient from "./axiosClient.js";

const organizationApi = {

  // 1. Lấy danh sách đơn vị
  getAll(params = {}) {
    return axiosClient.get("/organizations", {
      params,
    });
  },

  // 2. Lấy chi tiết đơn vị
  getById(id) {
    return axiosClient.get(`/organizations/${id}`);
  },

  // 3. Thêm đơn vị
  create(data) {
    return axiosClient.post("/organizations", data);
  },

  // 4. Cập nhật đơn vị
  update(id, data) {
    return axiosClient.put(
      `/organizations/${id}`,
      data
    );
  },

  // 5. Kiểm tra trạng thái Blockchain
  getBlockchainStatus(id) {
    return axiosClient.get(
      `/organizations/${id}/blockchain-status`
    );
  },

  // 6. Cấp quyền Blockchain
  authorize(id, data = {}) {
    return axiosClient.post(
      `/organizations/${id}/authorize`,
      data,
      {
        timeout: 180000,
      }
    );
  },

  // 7. Thu hồi quyền Blockchain
  deauthorize(id, data = {}) {
    return axiosClient.post(
      `/organizations/${id}/deauthorize`,
      data,
      {
        timeout: 180000,
      }
    );
  },

};

export default organizationApi;