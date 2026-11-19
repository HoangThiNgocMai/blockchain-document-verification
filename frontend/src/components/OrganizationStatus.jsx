function OrganizationStatus({ authorized }) {

  if (authorized === true ||
      authorized === 1 ||
      authorized === "1") {
    return (
      <span className="badge bg-success">
        Đã cấp quyền
      </span>
    );
  }

  if (authorized === false ||
      authorized === 0 ||
      authorized === "0") {
    return (
      <span className="badge bg-secondary">
        Chưa cấp quyền
      </span>
    );
  }

  return (
    <span className="badge bg-warning text-dark">
      Chưa xác định
    </span>
  );
}

export default OrganizationStatus;