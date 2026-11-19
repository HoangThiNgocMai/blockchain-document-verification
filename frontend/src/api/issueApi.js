import axiosClient from "./axiosClient.js";


// ================================================
// API CẤP PHÁT TÀI LIỆU
// ================================================

const issueApi = {

  issueDocument(formData) {

    return axiosClient.post(

      "/documents/issue",

      formData,

      {
        timeout: 180000,
      }

    );

  },

};

export default issueApi;