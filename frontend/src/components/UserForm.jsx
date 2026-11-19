import { useState, useRef } from "react";

import userApi from "../api/userApi.js";


// ================================================
// BIỂU MẪU THÊM VÀ CHỈNH SỬA TÀI KHOẢN
// ================================================

function UserForm({
  user = null,
  organizations = [],
  onClose,
  onSuccess,
}) {

  const isEdit = Boolean(user);

  const [fullName, setFullName] = useState(
    user?.full_name || ""
  );

  const [email, setEmail] = useState(
    user?.email || ""
  );

  const [organizationId, setOrganizationId] = useState(
    String(user?.organization_id ?? "")
  );

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});

  const [uncertain, setUncertain] = useState(false);

  const requestLock = useRef(false);


  // ================================================
  // 1. LẤY THÔNG TIN ĐƠN VỊ ĐƯỢC CHỌN
  // ================================================

  const selectedOrganization = organizations.find(
    (item) => String(item.id) === organizationId
  );

  const organizationAuthorized =
    [1, "1", true].includes(
      selectedOrganization?.is_authorized
    );


  // ================================================
  // 2. KIỂM TRA DỮ LIỆU
  // ================================================

  function validateForm() {

    const errors = {};

    const cleanName = fullName.trim();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {

      errors.fullName = "Vui lòng nhập họ và tên.";

    } else if (cleanName.length > 150) {

      errors.fullName =
        "Họ và tên không được vượt quá 150 ký tự.";

    }

    if (!cleanEmail) {

      errors.email = "Vui lòng nhập email.";

    } else if (
      cleanEmail.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {

      errors.email = "Địa chỉ email không hợp lệ.";

    }


    // Chỉ kiểm tra các trường này khi tạo tài khoản

    if (!isEdit) {

      if (
        !Number.isSafeInteger(Number(organizationId)) ||
        Number(organizationId) <= 0 ||
        !selectedOrganization
      ) {

        errors.organizationId =
          "Vui lòng chọn đơn vị cấp phát.";

      }

      const passwordBytes =
        new TextEncoder().encode(password).length;

      if (!password) {

        errors.password = "Vui lòng nhập mật khẩu.";

      } else if (password.length < 12) {

        errors.password =
          "Mật khẩu phải có ít nhất 12 ký tự.";

      } else if (passwordBytes > 72) {

        errors.password =
          "Mật khẩu không được vượt quá 72 byte.";

      }

      if (!confirmPassword) {

        errors.confirmPassword =
          "Vui lòng xác nhận mật khẩu.";

      } else if (password !== confirmPassword) {

        errors.confirmPassword =
          "Mật khẩu xác nhận không trùng khớp.";

      }

    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;

  }


  // ================================================
  // 3. GỬI DỮ LIỆU LÊN BACKEND
  // ================================================

  async function handleSubmit(event) {

    event.preventDefault();

    if (requestLock.current || saving || uncertain) return;

    setError("");

    if (!validateForm()) return;

    requestLock.current = true;

    setSaving(true);

    try {

      let response;

      if (isEdit) {

        // Chỉ cập nhật họ tên và email

        response = await userApi.update(user.id, {

          fullName: fullName.trim(),

          email: email.trim().toLowerCase(),

        });

      } else {

        // Tạo tài khoản mới

        response = await userApi.create({

          fullName: fullName.trim(),

          email: email.trim().toLowerCase(),

          password,

          organizationId: Number(organizationId),

        });

      }

      if (!response.success) {

        setUncertain(true);

        setError(
          "Chưa thể xác nhận kết quả lưu. " +
          "Vui lòng đóng biểu mẫu và kiểm tra danh sách."
        );

        return;

      }

      setPassword("");

      setConfirmPassword("");

      onSuccess(
        isEdit
          ? "Cập nhật tài khoản thành công."
          : "Thêm tài khoản cấp phát thành công."
      );

    } catch (err) {

      const status = err.response?.status;

      if (status === 400) {

        setError(
          "Thông tin tài khoản không hợp lệ. " +
          "Vui lòng kiểm tra lại."
        );

      } else if (status === 401) {

        setError("Phiên đăng nhập đã hết hạn.");

      } else if (status === 403) {

        setError(
          "Bạn không có quyền thực hiện thao tác này."
        );

      } else if (status === 404) {

        setError(
          "Không tìm thấy tài khoản hoặc đơn vị cấp phát."
        );

      } else if (status === 409) {

        setError("Email đã được sử dụng.");

        setFieldErrors((previous) => ({

          ...previous,

          email: "Email này đã tồn tại trong hệ thống.",

        }));

      } else {

        setUncertain(true);

        setError(
          "Chưa thể xác nhận tài khoản đã được lưu hay chưa. " +
          "Vui lòng đóng biểu mẫu, làm mới danh sách " +
          "và kiểm tra trước khi thực hiện lại."
        );

      }

    } finally {

      requestLock.current = false;

      setSaving(false);

    }

  }


  // ================================================
  // 4. GIAO DIỆN BIỂU MẪU
  // ================================================

  return (

    <div className="user-form-overlay">

      <div
        className="user-form-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
      >

        {/* TIÊU ĐỀ */}

        <div className="user-form-header">

          <h5
            id="user-form-title"
            className="fw-bold mb-0"
          >

            <i
              className={`bi me-2 ${
                isEdit
                  ? "bi-pencil-square"
                  : "bi-person-plus"
              }`}
            ></i>

            {isEdit
              ? "Chỉnh sửa tài khoản"
              : "Thêm tài khoản cấp phát"}

          </h5>

          <button
            type="button"
            className="btn-close"
            aria-label="Đóng"
            onClick={onClose}
            disabled={saving}
          ></button>

        </div>


        <form onSubmit={handleSubmit} noValidate>

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


            {/* HỌ VÀ TÊN */}

            <div className="mb-3">

              <label
                htmlFor="form-full-name"
                className="form-label"
              >

                Họ và tên
                <span className="text-danger"> *</span>

              </label>

              <input
                id="form-full-name"
                type="text"
                className={`form-control ${
                  fieldErrors.fullName ? "is-invalid" : ""
                }`}
                placeholder="Nhập họ và tên"
                value={fullName}
                maxLength={150}
                disabled={saving}
                autoComplete="name"
                onChange={(event) =>
                  setFullName(event.target.value)
                }
              />

              {fieldErrors.fullName && (

                <div className="invalid-feedback">
                  {fieldErrors.fullName}
                </div>

              )}

            </div>


            {/* EMAIL */}

            <div className="mb-3">

              <label
                htmlFor="form-email"
                className="form-label"
              >

                Email
                <span className="text-danger"> *</span>

              </label>

              <input
                id="form-email"
                type="email"
                className={`form-control ${
                  fieldErrors.email ? "is-invalid" : ""
                }`}
                placeholder="Nhập địa chỉ email"
                value={email}
                maxLength={150}
                disabled={saving}
                autoComplete="off"
                onChange={(event) =>
                  setEmail(event.target.value)
                }
              />

              {fieldErrors.email && (

                <div className="invalid-feedback">
                  {fieldErrors.email}
                </div>

              )}

            </div>


            {/* ĐƠN VỊ CẤP PHÁT */}

            <div className="mb-3">

              <label
                htmlFor="form-organization"
                className="form-label"
              >

                Đơn vị cấp phát
                <span className="text-danger"> *</span>

              </label>

              {isEdit ? (

                <>

                  <input
                    id="form-organization"
                    type="text"
                    className="form-control"
                    value={
                      user.organization_name ||
                      selectedOrganization?.name ||
                      "Chưa xác định"
                    }
                    readOnly
                  />

                  <div className="form-text">

                    Không thay đổi đơn vị cấp phát
                    của tài khoản tại đây.

                  </div>

                </>

              ) : (

                <>

                  <select
                    id="form-organization"
                    className={`form-select ${
                      fieldErrors.organizationId
                        ? "is-invalid"
                        : ""
                    }`}
                    value={organizationId}
                    disabled={saving}
                    onChange={(event) =>
                      setOrganizationId(event.target.value)
                    }
                  >

                    <option value="">

                      -- Chọn đơn vị cấp phát --

                    </option>

                    {organizations.map((item) => (

                      <option
                        key={item.id}
                        value={String(item.id)}
                      >

                        {item.name}

                        {[1, "1", true].includes(
                          item.is_authorized
                        )
                          ? " - Đã cấp quyền"
                          : " - Chưa cấp quyền hoặc chưa xác định"}

                      </option>

                    ))}

                  </select>

                  {fieldErrors.organizationId && (

                    <div className="invalid-feedback">
                      {fieldErrors.organizationId}
                    </div>

                  )}

                  {organizations.length === 0 && (

                    <div className="form-text text-danger">

                      Chưa có đơn vị cấp phát.
                      Vui lòng tạo đơn vị trước.

                    </div>

                  )}

                </>

              )}

            </div>


            {/* CẢNH BÁO QUYỀN ĐƠN VỊ */}

            {!isEdit &&
              selectedOrganization &&
              !organizationAuthorized && (

              <div className="alert alert-warning small">

                <i className="bi bi-exclamation-triangle me-2"></i>

                Đơn vị này chưa được xác nhận có quyền
                Blockchain trong MySQL.
                Tài khoản có thể chưa đăng nhập hoặc
                cấp phát tài liệu được.

              </div>

            )}


            {/* MẬT KHẨU - CHỈ KHI TẠO MỚI */}

            {!isEdit && (

              <>

                <div className="mb-3">

                  <label
                    htmlFor="form-password"
                    className="form-label"
                  >

                    Mật khẩu
                    <span className="text-danger"> *</span>

                  </label>

                  <div className="input-group">

                    <input
                      id="form-password"
                      type={showPassword ? "text" : "password"}
                      className={`form-control ${
                        fieldErrors.password
                          ? "is-invalid"
                          : ""
                      }`}
                      placeholder="Nhập mật khẩu"
                      value={password}
                      disabled={saving}
                      autoComplete="new-password"
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      disabled={saving}
                      aria-label={
                        showPassword
                          ? "Ẩn mật khẩu"
                          : "Hiển thị mật khẩu"
                      }
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                    >

                      <i
                        className={`bi ${
                          showPassword
                            ? "bi-eye-slash"
                            : "bi-eye"
                        }`}
                      ></i>

                    </button>

                    {fieldErrors.password && (

                      <div className="invalid-feedback">
                        {fieldErrors.password}
                      </div>

                    )}

                  </div>

                  <div className="form-text">

                    Mật khẩu tối thiểu 12 ký tự
                    và không quá 72 byte.

                  </div>

                </div>


                {/* XÁC NHẬN MẬT KHẨU */}

                <div className="mb-3">

                  <label
                    htmlFor="form-confirm-password"
                    className="form-label"
                  >

                    Xác nhận mật khẩu
                    <span className="text-danger"> *</span>

                  </label>

                  <input
                    id="form-confirm-password"
                    type={showPassword ? "text" : "password"}
                    className={`form-control ${
                      fieldErrors.confirmPassword
                        ? "is-invalid"
                        : ""
                    }`}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    disabled={saving}
                    autoComplete="new-password"
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                  />

                  {fieldErrors.confirmPassword && (

                    <div className="invalid-feedback">
                      {fieldErrors.confirmPassword}
                    </div>

                  )}

                </div>

              </>

            )}


            {/* THÔNG TIN VAI TRÒ */}

            <div className="mb-3">

              <label className="form-label" htmlFor="form-role">

                Vai trò

              </label>

              <input
                id="form-role"
                type="text"
                className="form-control"
                value="Người cấp phát"
                readOnly
              />

            </div>


            {/* THÔNG TIN BỔ SUNG */}

            {!isEdit && (

              <div className="alert alert-info small mb-0">

                <i className="bi bi-info-circle me-2"></i>

                Tài khoản mới mặc định có trạng thái
                đang hoạt động. Quyền cấp phát tài liệu
                còn phụ thuộc vào quyền Blockchain
                và cấu hình ví cấp phát của hệ thống.

              </div>

            )}

          </div>


          {/* NÚT THAO TÁC */}

          <div className="user-form-footer">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={saving}
            >

              {uncertain ? "Đóng" : "Hủy bỏ"}

            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                saving ||
                uncertain ||
                (!isEdit && organizations.length === 0)
              }
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

                  <i className="bi bi-save me-2"></i>

                  {isEdit
                    ? "Lưu thay đổi"
                    : "Lưu tài khoản"}

                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}

export default UserForm;