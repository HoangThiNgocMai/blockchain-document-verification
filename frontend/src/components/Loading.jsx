function Loading({
  message = "Đang tải dữ liệu...",
}) {
  return (
    <div
      className="min-vh-100 d-flex flex-column
                 justify-content-center
                 align-items-center"
      role="status"
    >
      <div
        className="spinner-border text-primary"
        aria-hidden="true"
      ></div>

      <p className="text-secondary mt-3 mb-0">
        {message}
      </p>
    </div>
  );
}

export default Loading;