function TransactionAction({ action }) {

  const actions = {

    issue: {
      label: "Cấp phát tài liệu",
      color: "primary",
      icon: "bi-file-earmark-plus",
    },

    revoke: {
      label: "Thu hồi tài liệu",
      color: "danger",
      icon: "bi-file-earmark-x",
    },

    authorize: {
      label: "Cấp quyền đơn vị",
      color: "success",
      icon: "bi-shield-check",
    },

    deauthorize: {
      label: "Thu hồi quyền đơn vị",
      color: "warning",
      icon: "bi-shield-x",
    },

  };

  const item = actions[action] || {
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

export default TransactionAction;