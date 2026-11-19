import { useState } from "react";
import organizationApi from "../api/organizationApi.js";

function OrganizationForm({
  organization = null,
  onClose,
  onSuccess,
}) {
  const isEdit = Boolean(organization);

  const [name, setName] = useState(
    organization?.name || ""
  );

  const [walletAddress, setWalletAddress] = useState(
    organization?.wallet_address || ""
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  // Đơn vị đã được cấp quyền
  const isAuthorized =
    Number(organization?.is_authorized) === 1;


  // ========================================
  // 1. KIỂM TRA DỮ LIỆU
  // ========================================

  function validateForm() {

    const errors = {};

    if (!name.trim()) {
      errors.name = "Vui lòng nhập tên đơn vị.";
    }

    if (name.trim().length > 255) {
      errors.name =
        "Tên đơn vị không được vượt quá 255 ký tự.";
    }

    if (!walletAddress.trim()) {

      errors.walletAddress =
        "Vui lòng nhập địa chỉ ví Blockchain.";

    } else if (
      !/^0x[a-fA-F0-9]{40}$/.test(
        walletAddress.trim()
      )
    ) {

      errors.walletAddress =
        "Địa chỉ ví Ethereum không hợp lệ.";

    } else if (
      /^0x0{40}$/.test(walletAddress.trim())
    ) {

      errors.walletAddress =
        "Không được sử dụng địa chỉ ví rỗng.";

    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;

  }


  // ========================================
  // 2. LƯU THÔNG TIN ĐƠN VỊ
  // ========================================

  async function handleSubmit(event) {

    event.preventDefault();

    if (saving) return;

    setError("");

    if (!validateForm()) return;

    setSaving(true);

    try {

      const payload = {
        name: name.trim(),
        walletAddress: walletAddress.trim(),
      };

      let response;

      if (isEdit) {

        response = await organizationApi.update(
          organization.id,
          payload
        );

      } else {

        response = await organizationApi.create(
          payload
        );

      }

      if (!response.success) {

        setError(
          "Không thể lưu thông tin đơn vị."
        );

        return;

      }

      onSuccess(
        isEdit
          ? "Cập nhật đơn vị thành công."
          : "Thêm đơn vị cấp phát thành công."
      );

    } catch (err) {

      const status = err.response?.status;

      if (status === 400) {

        setError(
          "Thông tin đơn vị không hợp lệ. " +
          "Vui lòng kiểm tra lại."
        );

      } else if (status === 401) {

        setError("Phiên đăng nhập đã hết hạn.");

      } else if (status === 403) {

        setError(
          "Bạn không có quyền thực hiện thao tác này."
        );

      } else if (status === 404) {

        setError("Không tìm thấy đơn vị cấp phát.");

      } else if (status === 409) {

        setError(
          "Thông tin bị trùng hoặc xung đột " +
          "với dữ liệu hiện có."
        );

      } else if (!err.response) {

        setError(
          "Không thể xác nhận kết quả lưu. " +
          "Hãy kiểm tra lại danh sách trước khi thử lại."
        );

      } else {

        setError(
          "Không thể lưu thông tin đơn vị. " +
          "Vui lòng thử lại."
        );

      }

    } finally {

      setSaving(false);

    }

  }


  // ========================================
  // 3. GIAO DIỆN BIỂU MẪU
  // ========================================

  return (

    <div className="organization-form-overlay">

      <div
        className="organization-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="organization-form-title"
      >

        <form onSubmit={handleSubmit} noValidate>

          {/* Tiêu đề */}

          <div className="organization-form-header">

            <h5
              id="organization-form-title"
              className="mb-0 fw-bold"
            >

              {isEdit
                ? "Chỉnh sửa đơn vị cấp phát"
                : "Thêm đơn vị cấp phát"}

            </h5>

            <button
              type="button"
              className="btn-close"
              aria-label="Đóng biểu mẫu"
              onClick={onClose}
              disabled={saving}
            ></button>

          </div>


          {/* Nội dung */}

          <div className="organization-form-body">

            {error && (

              <div className="alert alert-danger" role="alert">

                <i className="bi bi-exclamation-circle me-2"></i>

                {error}

              </div>

            )}


            {/* Tên đơn vị */}

            <div className="mb-3">

              <label
                htmlFor="organization-name"
                className="form-label fw-medium"
              >

                Tên đơn vị

                <span className="text-danger ms-1">*</span>

              </label>

              <input
                id="organization-name"
                type="text"
                className={`form-control ${
                  fieldErrors.name ? "is-invalid" : ""
                }`}
                placeholder="Nhập tên đơn vị cấp phát"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                maxLength={255}
                disabled={saving}
                autoFocus
              />

              {fieldErrors.name && (

                <div className="invalid-feedback">
                  {fieldErrors.name}
                </div>

              )}

            </div>


            {/* Địa chỉ ví */}

            <div className="mb-3">

              <label
                htmlFor="organization-wallet-input"
                className="form-label fw-medium"
              >

                Địa chỉ ví Blockchain

                <span className="text-danger ms-1">*</span>

              </label>

              <input
                id="organization-wallet-input"
                type="text"
                className={`form-control ${
                  fieldErrors.walletAddress
                    ? "is-invalid"
                    : ""
                }`}
                placeholder="0x..."
                value={walletAddress}
                onChange={(event) =>
                  setWalletAddress(event.target.value)
                }
                maxLength={42}
                disabled={saving}
                readOnly={isAuthorized}
                autoComplete="off"
                spellCheck={false}
              />

              {fieldErrors.walletAddress && (

                <div className="invalid-feedback">
                  {fieldErrors.walletAddress}
                </div>

              )}

              <div className="form-text">

                Địa chỉ ví Ethereum gồm 42 ký tự,
                bắt đầu bằng 0x.

              </div>

            </div>


            {/* Cảnh báo khi sửa đơn vị đã cấp quyền */}

            {isAuthorized && (

              <div className="alert alert-warning small">

                <i className="bi bi-shield-lock me-2"></i>

                Đơn vị đã được cấp quyền.

                Để đảm bảo an toàn, không thể thay đổi
                địa chỉ ví tại biểu mẫu này.

              </div>

            )}


            {/* Thông tin khi tạo đơn vị */}

            {!isEdit && (

              <div className="alert alert-info small mb-0">

                <i className="bi bi-info-circle me-2"></i>

                Đơn vị mới có trạng thái chưa cấp quyền.
                Quản trị viên cần cấp quyền trên Blockchain
                trước khi đơn vị có thể cấp phát tài liệu.

              </div>

            )}

          </div>


          {/* Nút thao tác */}

          <div className="organization-form-footer">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >

              Hủy bỏ

            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >

              {saving ? (

                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>

                  Đang lưu...
                </>

              ) : (

                <>
                  <i className="bi bi-floppy me-2"></i>

                  Lưu thông tin
                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

export default OrganizationForm;