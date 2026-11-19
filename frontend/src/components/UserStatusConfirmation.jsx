import { useState, useRef } from "react";

import userApi from "../api/userApi.js";

import UserStatus from "./UserStatus.jsx";


// ================================================
// XÁC NHẬN KHÓA VÀ MỞ KHÓA TÀI KHOẢN
// ================================================

function UserStatusConfirmation({
  user,
  onClose,
  onSuccess,
}) {

  const isCurrentlyActive =
    [1, "1", true].includes(user.is_active);

  const isCurrentlyInactive =
    [0, "0", false].includes(user.is_active);

  const validStatus =
    isCurrentlyActive || isCurrentlyInactive;

  const newStatus = !isCurrentlyActive;

  const actionName =
    newStatus ? "Mở khóa" : "Khóa";

  const [processing, setProcessing] = useState(false);

  const [confirmed, setConfirmed] = useState(false);

  const [error, setError] = useState("");

  const [uncertain, setUncertain] = useState(false);

  const requestLock = useRef(false);


  // ================================================
  // 1. XỬ LÝ THAY ĐỔI TRẠNG THÁI
  // ================================================

  async function handleSubmit(event) {

    event.preventDefault();

    if (
      processing ||
      requestLock.current ||
      !confirmed ||
      !validStatus ||
      uncertain
    ) return;

    requestLock.current = true;

    setProcessing(true);

    setError("");

    try {

      const response = await userApi.updateStatus(
        user.id,
        newStatus
      );

      const returnedStatus =
        response?.data?.is_active;

      const statusMatches = newStatus

        ? [1, "1", true].includes(returnedStatus)

        : [0, "0", false].includes(returnedStatus);

      if (
        !response.success ||
        !statusMatches ||
        String(response.data?.id) !== String(user.id)
      ) {

        setUncertain(true);

        setError(
          "Chưa thể xác nhận trạng thái tài khoản. " +
          "Vui lòng đóng cửa sổ và kiểm tra lại danh sách."
        );

        return;

      }

      onSuccess(
        newStatus
          ? "Mở khóa tài khoản thành công."
          : "Khóa tài khoản thành công."
      );

    } catch (err) {

      const statusCode = err.response?.status;

      if (statusCode === 400) {

        setError(
          "Thông tin tài khoản hoặc trạng thái không hợp lệ."
        );

      } else if (statusCode === 401) {

        setError("Phiên đăng nhập đã hết hạn.");

      } else if (statusCode === 403) {

        setError(
          "Bạn không có quyền thực hiện thao tác này."
        );

      } else if (statusCode === 404) {

        setUncertain(true);

        setError("Tài khoản không còn tồn tại.");

      } else if (statusCode === 409) {

        setUncertain(true);

        setError(
          "Tài khoản có thể đã ở trạng thái yêu cầu. " +
          "Vui lòng đóng cửa sổ và làm mới danh sách."
        );

      } else {

        setUncertain(true);

        setError(
          "Chưa thể xác nhận kết quả thao tác. " +
          "Vui lòng kiểm tra lại trạng thái tài khoản " +
          "trước khi thực hiện lần nữa."
        );

      }

    } finally {

      requestLock.current = false;

      setProcessing(false);

    }

  }


  // ================================================
  // 2. GIAO DIỆN
  // ================================================

  return (

    <div className="user-form-overlay">

      <div
        className="user-form-dialog user-status-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-status-title"
      >

        {/* TIÊU ĐỀ */}

        <div className="user-form-header">

          <h5
            id="user-status-title"
            className={`fw-bold mb-0 ${
              newStatus ? "text-success" : "text-danger"
            }`}
          >

            <i
              className={`bi me-2 ${
                newStatus ? "bi-unlock" : "bi-lock"
              }`}
            ></i>

            {actionName} tài khoản

          </h5>

          <button
            type="button"
            className="btn-close"
            aria-label="Đóng"
            onClick={onClose}
            disabled={processing}
          ></button>

        </div>


        <form onSubmit={handleSubmit}>

          <div className="user-form-body">

            {/* THÔNG BÁO LỖI */}

            {error && (

              <div
                className="alert alert-danger"
                role="alert"
              >

                <i className="bi bi-exclamation-circle me-2"></i>

                {error}

              </div>

            )}


            {/* THÔNG TIN TÀI KHOẢN */}

            <div className="user-confirmation-info">

              <div className="user-confirmation-row">

                <span>Họ và tên</span>

                <strong>{user.full_name}</strong>

              </div>

              <div className="user-confirmation-row">

                <span>Email</span>

                <strong>{user.email}</strong>

              </div>

              <div className="user-confirmation-row">

                <span>Đơn vị cấp phát</span>

                <strong>

                  {user.organization_name || "Chưa xác định"}

                </strong>

              </div>

            </div>


            {/* TRẠNG THÁI HIỆN TẠI */}

            <div className="user-status-row">

              <span>Trạng thái hiện tại</span>

              <UserStatus isActive={user.is_active} />

            </div>


            {/* TRẠNG THÁI SAU KHI THAY ĐỔI */}

            {validStatus && (

              <div className="user-status-row mb-3">

                <span>Trạng thái sau khi cập nhật</span>

                <UserStatus isActive={newStatus} />

              </div>

            )}


            {/* CẢNH BÁO */}

            {!validStatus ? (

              <div className="alert alert-danger">

                Không xác định được trạng thái tài khoản.

              </div>

            ) : newStatus ? (

              <div className="alert alert-info">

                <i className="bi bi-info-circle me-2"></i>

                Tài khoản sẽ được phép hoạt động trở lại.
                Tuy nhiên, quyền đăng nhập và cấp phát
                tài liệu còn phụ thuộc vào các điều kiện
                phân quyền của hệ thống.

              </div>

            ) : (

              <div className="alert alert-warning">

                <i className="bi bi-exclamation-triangle me-2"></i>

                Sau khi khóa, tài khoản sẽ không được phép
                truy cập các chức năng yêu cầu xác thực.

                Các tài liệu đã cấp phát trước đó không
                tự động bị thu hồi.

              </div>

            )}


            {/* XÁC NHẬN THAO TÁC */}

            <div className="form-check mt-3">

              <input
                id="confirm-user-status"
                type="checkbox"
                className="form-check-input"
                checked={confirmed}
                disabled={
                  processing || uncertain || !validStatus
                }
                onChange={(event) =>
                  setConfirmed(event.target.checked)
                }
              />

              <label
                className="form-check-label"
                htmlFor="confirm-user-status"
              >

                Tôi xác nhận muốn {actionName.toLowerCase()}
                {" "}tài khoản này.

              </label>

            </div>

          </div>


          {/* NÚT THAO TÁC */}

          <div className="user-form-footer">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={processing}
            >

              {uncertain ? "Đóng" : "Hủy bỏ"}

            </button>

            <button
              type="submit"
              className={`btn ${
                newStatus ? "btn-success" : "btn-danger"
              }`}
              disabled={
                !confirmed ||
                processing ||
                uncertain ||
                !validStatus
              }
            >

              {processing ? (

                <>

                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>

                  Đang xử lý...

                </>

              ) : (

                <>

                  <i
                    className={`bi me-2 ${
                      newStatus ? "bi-unlock" : "bi-lock"
                    }`}
                  ></i>

                  Xác nhận {actionName.toLowerCase()}

                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

export default UserStatusConfirmation;