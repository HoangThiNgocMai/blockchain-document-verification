function TransactionStatus({ status }) {

  const statuses = {

    confirmed: {
      label: "Đã xác nhận",
      color: "success",
      icon: "bi-check-circle",
    },

    pending: {
      label: "Đang xử lý",
      color: "warning",
      icon: "bi-hourglass-split",
    },

    failed: {
      label: "Thất bại",
      color: "danger",
      icon: "bi-x-circle",
    },

  };

  const item = statuses[status] || {
    label: "Chưa xác định",
    color: "secondary",
    icon: "bi-question-circle",
  };

  return (
    <span className={`badge text-bg-${item.color}`}>
      <i className={`bi ${item.icon} me-1`}></i>
      {item.label}
    </span>
  );

}

export default TransactionStatus;