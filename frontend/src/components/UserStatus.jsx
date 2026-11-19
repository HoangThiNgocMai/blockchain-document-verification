// ================================================
// HIỂN THỊ TRẠNG THÁI TÀI KHOẢN
// ================================================

function UserStatus({ isActive }) {

  if ([1, "1", true].includes(isActive)) {

    return (
      <span className="badge bg-success">

        <i className="bi bi-check-circle me-1"></i>

        Đang hoạt động

      </span>
    );

  }

  if ([0, "0", false].includes(isActive)) {

    return (
      <span className="badge bg-danger">

        <i className="bi bi-lock me-1"></i>

        Đã khóa

      </span>
    );

  }

  return (
    <span className="badge bg-warning text-dark">
      Chưa xác định
    </span>
  );

}

export default UserStatus;