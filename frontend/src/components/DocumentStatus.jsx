const statusConfig = {
  issued: {
    label: "Đã cấp phát",
    color: "success",
  },

  pending: {
    label: "Đang xử lý",
    color: "warning",
  },

  revoked: {
    label: "Đã thu hồi",
    color: "danger",
  },

  failed: {
    label: "Thất bại",
    color: "secondary",
  },
};

function DocumentStatus({ status }) {
  const config = statusConfig[status] || {
    label: "Không xác định",
    color: "secondary",
  };

  return (
    <span
      className={`badge
                  bg-${config.color}
                  ${status === "pending"
                    ? "text-dark"
                    : ""}`}
    >
      {config.label}
    </span>
  );
}

export default DocumentStatus;