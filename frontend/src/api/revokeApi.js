import axiosClient from "./axiosClient.js";

// API thu hồi tài liệu
const revokeApi = {

  revokeDocument(documentCode) {

    return axiosClient.post(
      "/revocation/revoke",
      {
        documentCode,
      },
      {
        timeout: 180000,
      }
    );

  },

};

export default revokeApi;