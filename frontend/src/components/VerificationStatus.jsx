function VerificationStatus({ result }) {

  const statuses = {

    valid: {

      label: "Tài liệu hợp lệ",

      color: "success",

      icon: "bi-check-circle",

    },


    mismatch: {

      label: "Không trùng khớp",

      color: "danger",

      icon: "bi-x-circle",

    },


    revoked: {

      label: "Tài liệu đã thu hồi",

      color: "danger",

      icon: "bi-file-earmark-x",

    },


    not_found: {

      label: "Không tìm thấy",

      color: "warning",

      icon: "bi-search",

    },


    lookup_only: {

      label: "Chỉ tra cứu",

      color: "info",

      icon: "bi-eye",

    },


    error: {

      label: "Lỗi xác thực",

      color: "secondary",

      icon: "bi-exclamation-triangle",

    },

  };


  // ==============================================
  // XỬ LÝ TRẠNG THÁI KHÔNG XÁC ĐỊNH
  // ==============================================

  const item = Object.hasOwn(statuses, result)
    ? statuses[result]
    : {

        label: "Chưa xác định",

        color: "secondary",

        icon: "bi-question-circle",

      };


  // ==============================================
  // HIỂN THỊ KẾT QUẢ
  // ==============================================

  return (

    <span className={`badge text-bg-${item.color}`}>

      <i className={`bi ${item.icon} me-1`}></i>

      {item.label}

    </span>

  );

}

export default VerificationStatus;