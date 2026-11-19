import axiosClient from "./axiosClient.js";

const transactionApi = {

  getAll(params = {}) {
    return axiosClient.get("/transactions", {
      params,
    });
  },

  getStatistics() {
    return axiosClient.get("/transactions/statistics");
  },

  getById(type, id) {
    return axiosClient.get(`/transactions/${type}/${id}`);
  },

};

export default transactionApi;