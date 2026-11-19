import { useState, useEffect } from "react";

import userApi from "../../api/userApi.js";

import organizationApi from "../../api/organizationApi.js";

import UserStatus from "../../components/UserStatus.jsx";

import UserForm from "../../components/UserForm.jsx";

import UserStatusConfirmation from
  "../../components/UserStatusConfirmation.jsx";

import "../../styles/users.css";


// ================================================
// TRANG QUẢN LÝ TÀI KHOẢN CẤP PHÁT
// ================================================

function Users() {

  const [users, setUsers] = useState([]);

  const [organizations, setOrganizations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("all");

  const [organizationFilter, setOrganizationFilter] =
    useState("all");

  const [refreshKey, setRefreshKey] = useState(0);

  const [successMessage, setSuccessMessage] = useState("");

  const [modal, setModal] = useState(null);


  // ================================================
  // 1. LẤY DỮ LIỆU
  // ================================================

  useEffect(() => {

    let cancelled = false;

    async function fetchData() {

      try {

        const [userResponse, organizationResponse] =
          await Promise.all([

            userApi.getAll(),

            organizationApi.getAll(),

          ]);

        if (cancelled) return;

        if (
          !userResponse.success ||
          !Array.isArray(userResponse.data) ||
          !organizationResponse.success ||
          !Array.isArray(organizationResponse.data)
        ) {

          setError(
            "Dữ liệu trả về từ máy chủ không hợp lệ."
          );

          return;

        }

        setUsers(userResponse.data);

        setOrganizations(organizationResponse.data);

      } catch (err) {

        if (cancelled) return;

        const statusCode = err.response?.status;

        if (statusCode === 401) {

          setError("Phiên đăng nhập đã hết hạn.");

        } else if (statusCode === 403) {

          setError(
            "Bạn không có quyền truy cập chức năng này."
          );

        } else if (!err.response) {

          setError("Không thể kết nối đến máy chủ.");

        } else {

          setError(
            "Không thể tải danh sách tài khoản cấp phát."
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }

    fetchData();

    return () => {

      cancelled = true;

    };

  }, [refreshKey]);


  // ================================================
  // 2. LÀM MỚI DANH SÁCH
  // ================================================

  function handleRefresh() {

    setLoading(true);

    setError("");

    setRefreshKey((previous) => previous + 1);

  }


  // ================================================
  // 3. THÊM TÀI KHOẢN
  // ================================================

  function handleAdd() {

    setSuccessMessage("");

    setModal({

      type: "form",

      user: null,

    });

  }


  // ================================================
  // 4. CHỈNH SỬA TÀI KHOẢN
  // ================================================

  function handleEdit(user) {

    setSuccessMessage("");

    setModal({

      type: "form",

      user,

    });

  }


  // ================================================
  // 5. KHÓA VÀ MỞ KHÓA
  // ================================================

  function handleChangeStatus(user) {

    setSuccessMessage("");

    setModal({

      type: "status",

      user,

    });

  }


  // ================================================
  // 6. ĐÓNG CỬA SỔ
  // ================================================

  function handleCloseModal() {

    setModal(null);

    handleRefresh();

  }


  // ================================================
  // 7. XỬ LÝ SAU KHI THÀNH CÔNG
  // ================================================

  function handleSuccess(message) {

    setSuccessMessage(message);

    handleCloseModal();

  }


  // ================================================
  // 8. THỐNG KÊ TÀI KHOẢN
  // ================================================

  const total = users.length;

  const activeCount = users.filter(
    (item) => [1, "1", true].includes(item.is_active)
  ).length;

  const inactiveCount = users.filter(
    (item) => [0, "0", false].includes(item.is_active)
  ).length;


  // ================================================
  // 9. TÌM KIẾM VÀ BỘ LỌC
  // ================================================

  const keyword = search.trim().toLowerCase();

  const filteredUsers = users.filter((item) => {

    const fullName =
      (item.full_name || "").toLowerCase();

    const email =
      (item.email || "").toLowerCase();

    const matchSearch =
      fullName.includes(keyword) ||
      email.includes(keyword);

    const isActive =
      [1, "1", true].includes(item.is_active);

    const isInactive =
      [0, "0", false].includes(item.is_active);

    const matchStatus =
      status === "all" ||
      (status === "active" && isActive) ||
      (status === "inactive" && isInactive);

    const matchOrganization =
      organizationFilter === "all" ||
      String(item.organization_id) === organizationFilter;

    return (
      matchSearch &&
      matchStatus &&
      matchOrganization
    );

  });


  // ================================================
  // 10. ĐỊNH DẠNG NGÀY TẠO
  // ================================================

  function formatDate(value) {

    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("vi-VN");

  }


  // ================================================
  // 11. GIAO DIỆN
  // ================================================

  return (

    <div className="users-page">

      {/* BIỂU MẪU THÊM VÀ CHỈNH SỬA */}

      {modal?.type === "form" && (

        <UserForm
          key={modal.user?.id ?? "new"}
          user={modal.user}
          organizations={organizations}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />

      )}


      {/* XÁC NHẬN KHÓA VÀ MỞ KHÓA */}

      {modal?.type === "status" && (

        <UserStatusConfirmation
          key={modal.user.id}
          user={modal.user}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />

      )}


      {/* NỘI DUNG TRANG */}

      <div inert={Boolean(modal)}>

        {/* TIÊU ĐỀ */}

        <div className="users-heading mb-4">

          <div>

            <h3 className="fw-bold mb-2">

              Quản lý tài khoản cấp phát

            </h3>

            <p className="text-secondary mb-0">

              Quản lý thông tin và trạng thái hoạt động
              của các tài khoản người cấp phát.

            </p>

          </div>

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleRefresh}
            disabled={loading || Boolean(modal)}
          >

            <i className="bi bi-arrow-clockwise me-2"></i>

            {loading ? "Đang tải..." : "Làm mới"}

          </button>

        </div>


        {/* THỐNG KÊ */}

        <div className="row g-3 mb-4">

          {[

            [
              "Tổng số tài khoản",
              total,
              "primary",
              "bi-people"
            ],

            [
              "Đang hoạt động",
              activeCount,
              "success",
              "bi-person-check"
            ],

            [
              "Đã khóa",
              inactiveCount,
              "danger",
              "bi-lock"
            ],

          ].map(([title, value, color, icon]) => (

            <div className="col-md-4" key={title}>

              <div className="card h-100">

                <div className="card-body d-flex
                                justify-content-between
                                align-items-center">

                  <div>

                    <p className="text-secondary mb-2">

                      {title}

                    </p>

                    <h2 className={`fw-bold text-${color} mb-0`}>

                      {loading || error ? "—" : value}

                    </h2>

                  </div>

                  <div className={`users-stat-icon
                                  text-${color}
                                  bg-${color}-subtle`}>

                    <i className={`bi ${icon}`}></i>

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>


        {/* THÔNG BÁO THÀNH CÔNG */}

        {successMessage && (

          <div
            className="alert alert-success alert-dismissible"
            role="status"
          >

            <i className="bi bi-check-circle me-2"></i>

            {successMessage}

            <button
              type="button"
              className="btn-close"
              aria-label="Đóng thông báo"
              onClick={() => setSuccessMessage("")}
            ></button>

          </div>

        )}


        {/* THÔNG BÁO LỖI */}

        {error && (

          <div className="alert alert-danger" role="alert">

            <i className="bi bi-exclamation-circle me-2"></i>

            {error}

          </div>

        )}


        {/* DANH SÁCH TÀI KHOẢN */}

        <div className="card">

          <div className="card-header bg-white py-3
                          d-flex flex-wrap gap-2
                          justify-content-between
                          align-items-center">

            <h5 className="mb-0">

              Danh sách tài khoản cấp phát

            </h5>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAdd}
              disabled={loading || Boolean(error) || Boolean(modal)}
            >

              <i className="bi bi-plus-lg me-2"></i>

              Thêm tài khoản

            </button>

          </div>


          <div className="card-body">

            {/* TÌM KIẾM VÀ BỘ LỌC */}

            <div className="row g-3 mb-4">

              <div className="col-lg-5">

                <label
                  htmlFor="user-search"
                  className="form-label"
                >

                  Tìm kiếm

                </label>

                <div className="input-group">

                  <span className="input-group-text bg-white">

                    <i className="bi bi-search"></i>

                  </span>

                  <input
                    id="user-search"
                    type="text"
                    className="form-control"
                    placeholder="Nhập họ tên hoặc email..."
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />

                </div>

              </div>


              {/* LỌC ĐƠN VỊ */}

              <div className="col-lg-4">

                <label
                  htmlFor="user-organization"
                  className="form-label"
                >

                  Đơn vị cấp phát

                </label>

                <select
                  id="user-organization"
                  className="form-select"
                  value={organizationFilter}
                  onChange={(event) =>
                    setOrganizationFilter(event.target.value)
                  }
                >

                  <option value="all">

                    Tất cả đơn vị

                  </option>

                  {organizations.map((item) => (

                    <option
                      key={item.id}
                      value={String(item.id)}
                    >

                      {item.name}

                    </option>

                  ))}

                </select>

              </div>


              {/* LỌC TRẠNG THÁI */}

              <div className="col-lg-3">

                <label
                  htmlFor="user-status"
                  className="form-label"
                >

                  Trạng thái

                </label>

                <select
                  id="user-status"
                  className="form-select"
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                >

                  <option value="all">

                    Tất cả trạng thái

                  </option>

                  <option value="active">

                    Đang hoạt động

                  </option>

                  <option value="inactive">

                    Đã khóa

                  </option>

                </select>

              </div>

            </div>


            {/* BẢNG DANH SÁCH */}

            <div className="table-responsive">

              <table className="table table-bordered
                                table-hover align-middle
                                users-table">

                <thead className="table-light">

                  <tr>

                    <th>STT</th>

                    <th>Họ và tên</th>

                    <th>Email</th>

                    <th>Đơn vị cấp phát</th>

                    <th>Trạng thái</th>

                    <th>Ngày tạo</th>

                    <th>Thao tác</th>

                  </tr>

                </thead>

                <tbody>

                  {loading ? (

                    <tr>

                      <td colSpan={7} className="text-center py-5">

                        <div
                          className="spinner-border text-primary"
                          role="status"
                          aria-label="Đang tải dữ liệu"
                        ></div>

                        <p className="text-secondary mt-3 mb-0">

                          Đang tải danh sách tài khoản...

                        </p>

                      </td>

                    </tr>

                  ) : error ? (

                    <tr>

                      <td colSpan={7} className="text-center py-4">

                        Không thể hiển thị dữ liệu.

                      </td>

                    </tr>

                  ) : filteredUsers.length === 0 ? (

                    <tr>

                      <td
                        colSpan={7}
                        className="text-center text-secondary py-4"
                      >

                        Không tìm thấy tài khoản phù hợp.

                      </td>

                    </tr>

                  ) : (

                    filteredUsers.map((item, index) => (

                      <tr key={item.id}>

                        <td>{index + 1}</td>

                        <td className="fw-medium">

                          {item.full_name}

                        </td>

                        <td>

                          <span className="user-email">

                            {item.email}

                          </span>

                        </td>

                        <td>

                          {item.organization_name || "—"}

                        </td>

                        <td>

                          <UserStatus isActive={item.is_active} />

                        </td>

                        <td>

                          {formatDate(item.created_at)}

                        </td>

                        <td>

                          <div className="user-actions">

                            {/* CHỈNH SỬA */}

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="Chỉnh sửa tài khoản"
                              onClick={() => handleEdit(item)}
                              disabled={Boolean(modal)}
                            >

                              <i className="bi bi-pencil-square me-1"></i>

                              Chỉnh sửa

                            </button>


                            {/* KHÓA TÀI KHOẢN */}

                            {[1, "1", true].includes(
                              item.is_active
                            ) ? (

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                title="Khóa tài khoản"
                                onClick={() =>
                                  handleChangeStatus(item)
                                }
                                disabled={Boolean(modal)}
                              >

                                <i className="bi bi-lock me-1"></i>

                                Khóa

                              </button>

                            ) : [0, "0", false].includes(
                              item.is_active
                            ) ? (

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                title="Mở khóa tài khoản"
                                onClick={() =>
                                  handleChangeStatus(item)
                                }
                                disabled={Boolean(modal)}
                              >

                                <i className="bi bi-unlock me-1"></i>

                                Mở khóa

                              </button>

                            ) : (

                              <span className="small text-secondary">

                                Chưa xác định

                              </span>

                            )}

                          </div>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>


            {/* SỐ LƯỢNG KẾT QUẢ */}

            {!loading && !error && (

              <p className="small text-secondary mb-0">

                Hiển thị {filteredUsers.length}/{total}
                {" "}tài khoản cấp phát.

              </p>

            )}

          </div>

        </div>

      </div>

    </div>

  );

}

export default Users;