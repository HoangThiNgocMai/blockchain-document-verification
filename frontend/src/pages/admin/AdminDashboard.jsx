import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

import useAuth from "../../context/useAuth.js";
import dashboardApi from "../../api/dashboardApi.js";

import StatCard from "../../components/StatCard.jsx";
import DocumentStatus from "../../components/DocumentStatus.jsx";

import "../../styles/dashboard.css";


// ==========================================
// 1. ĐỊNH DẠNG NGÀY THÁNG
// ==========================================

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("vi-VN");
}


// ==========================================
// 2. THANH THỐNG KÊ
// ==========================================

function StatisticRow({
  label,
  value,
  total,
  color,
}) {
  const percentage =
    total > 0
      ? Math.min(100, (value / total) * 100)
      : 0;

  return (
    <div className="mb-3">

      <div className="d-flex
                      justify-content-between
                      align-items-center mb-2">

        <span className="small">{label}</span>

        <strong>{value ?? "—"}</strong>

      </div>

      <div
        className="progress dashboard-progress"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >

        <div
          className={`progress-bar bg-${color}`}
          style={{ width: `${percentage}%` }}
        ></div>

      </div>

    </div>
  );
}


// ==========================================
// 3. TRANG TỔNG QUAN QUẢN TRỊ
// ==========================================

function AdminDashboard() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);


  // ========================================
  // 4. LẤY DỮ LIỆU TỪ BACKEND
  // ========================================

  // ========================================
// 4. LẤY DỮ LIỆU TỪ BACKEND
// ========================================

const [refreshKey, setRefreshKey] = useState(0);

// Xử lý khi người dùng nhấn làm mới
const loadDashboard = useCallback(() => {
  setLoading(true);
  setError("");
  setRefreshKey((previous) => previous + 1);
}, []);

// Tự động lấy dữ liệu khi mở trang
// hoặc khi người dùng nhấn làm mới
useEffect(() => {
  let cancelled = false;

  const fetchDashboard = async () => {
    try {
      const response =
        await dashboardApi.getAdminDashboard();

      if (cancelled) {
        return;
      }

      if (!response.success || !response.data) {
        setError(
          "Không nhận được dữ liệu thống kê hợp lệ."
        );

        return;
      }

      setData(response.data);
      setUpdatedAt(new Date());

    } catch (err) {
      if (cancelled) {
        return;
      }

      const status = err.response?.status;

      if (status === 401) {
        setError(
          "Phiên đăng nhập đã hết hạn."
        );

      } else if (status === 403) {
        setError(
          "Bạn không có quyền xem dữ liệu thống kê."
        );

      } else if (!err.response) {
        setError(
          "Không thể kết nối đến máy chủ."
        );

      } else {
        setError(
          "Không thể tải dữ liệu thống kê. Vui lòng thử lại."
        );
      }

    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  fetchDashboard();

  return () => {
    cancelled = true;
  };

}, [refreshKey]);


  // ========================================
  // 5. PHÂN LOẠI DỮ LIỆU
  // ========================================

  const documents = data?.documents || {};

  const organizations = data?.organizations || {};

  const issuers = data?.issuers || {};

  const transactions = data?.transactions || {};

  const verifications = data?.verifications || {};

  const recentDocuments =
    data?.recentDocuments || [];


  // ========================================
  // 6. DANH SÁCH Ô THỐNG KÊ
  // ========================================

  const statistics = [
    {
      title: "Tổng số tài liệu",
      value: documents.total,
      icon: "bi-file-earmark-text",
      color: "primary",
      path: "/admin/documents",
    },

    {
      title: "Đơn vị cấp phát",
      value: organizations.total,
      icon: "bi-buildings",
      color: "success",
      path: "/admin/organizations",
    },

    {
      title: "Tài khoản cấp phát",
      value: issuers.total,
      icon: "bi-people",
      color: "warning",
      path: "/admin/users",
    },

    {
      title: "Giao dịch Blockchain",
      value: transactions.total,
      icon: "bi-clock-history",
      color: "info",
      path: "/admin/transactions",
    },
  ];


  // ========================================
  // 7. GIAO DIỆN
  // ========================================

  return (
    <div className="dashboard-page">

      {/* Tiêu đề trang */}

      <div className="dashboard-heading mb-4">

        <div>

          <h3 className="fw-bold mb-2">
            Tổng quan hệ thống
          </h3>

          <p className="text-secondary mb-0">
            Xin chào {user?.fullName}.
            Chào mừng bạn đến trang quản trị.
          </p>

        </div>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={loadDashboard}
          disabled={loading}
        >

          <i className="bi bi-arrow-clockwise me-2"></i>

          {loading
            ? "Đang tải..."
            : "Làm mới dữ liệu"}

        </button>

      </div>


      {/* Thời gian cập nhật */}

      {updatedAt && (
        <p className="small text-secondary">

          <i className="bi bi-clock me-2"></i>

          Cập nhật lần cuối: {formatDate(updatedAt)}

        </p>
      )}


      {/* Thông báo lỗi */}

      {error && (

        <div className="alert alert-danger" role="alert">

          <i className="bi bi-exclamation-circle me-2"></i>

          {error}

          {data && (
            <div className="small mt-1">
              Đang hiển thị dữ liệu của lần tải trước.
            </div>
          )}

        </div>

      )}


      {/* Trạng thái tải dữ liệu */}

      {loading && !data ? (

        <div className="card">

          <div
            className="card-body text-center py-5"
            role="status"
          >

            <div
              className="spinner-border text-primary"
              aria-hidden="true"
            ></div>

            <p className="mt-3 text-secondary">
              Đang tải dữ liệu thống kê...
            </p>

          </div>

        </div>

      ) : !data ? (

        <div className="card">

          <div className="card-body text-center py-5">

            <p>Chưa có dữ liệu để hiển thị.</p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={loadDashboard}
            >
              Thử lại
            </button>

          </div>

        </div>

      ) : (

        <>

          {/* Các ô thống kê tổng quan */}

          <div className="row g-3 mb-4">

            {statistics.map((item) => (

              <div
                className="col-sm-6 col-xl-3"
                key={item.title}
              >

                <StatCard {...item} />

              </div>

            ))}

          </div>


          {/* Thống kê tài liệu và đơn vị */}

          <div className="row g-3 mb-4">

            <div className="col-lg-6">

              <div className="card h-100">

                <div className="card-header bg-white py-3">

                  <h5 className="mb-0">
                    Trạng thái tài liệu
                  </h5>

                </div>

                <div className="card-body">

                  <StatisticRow
                    label="Đã cấp phát"
                    value={documents.issued}
                    total={documents.total}
                    color="success"
                  />

                  <StatisticRow
                    label="Đang xử lý"
                    value={documents.pending}
                    total={documents.total}
                    color="warning"
                  />

                  <StatisticRow
                    label="Đã thu hồi"
                    value={documents.revoked}
                    total={documents.total}
                    color="danger"
                  />

                  <StatisticRow
                    label="Thất bại"
                    value={documents.failed}
                    total={documents.total}
                    color="secondary"
                  />

                </div>

              </div>

            </div>


            <div className="col-lg-6">

              <div className="card h-100">

                <div className="card-header bg-white py-3">

                  <h5 className="mb-0">
                    Đơn vị và tài khoản cấp phát
                  </h5>

                </div>

                <div className="card-body">

                  <StatisticRow
                    label="Đơn vị được cấp quyền"
                    value={organizations.authorized}
                    total={organizations.total}
                    color="success"
                  />

                  <StatisticRow
                    label="Đơn vị chưa được cấp quyền"
                    value={organizations.unauthorized}
                    total={organizations.total}
                    color="secondary"
                  />

                  <hr />

                  <StatisticRow
                    label="Tài khoản đang hoạt động"
                    value={issuers.active}
                    total={issuers.total}
                    color="primary"
                  />

                  <StatisticRow
                    label="Tài khoản bị khóa"
                    value={issuers.inactive}
                    total={issuers.total}
                    color="danger"
                  />

                </div>

              </div>

            </div>

          </div>


          {/* Thống kê giao dịch Blockchain */}

          <div className="row g-3 mb-4">

            <div className="col-lg-6">

              <div className="card h-100">

                <div className="card-header bg-white py-3">

                  <h5 className="mb-0">
                    Giao dịch Blockchain
                  </h5>

                </div>

                <div className="card-body">

                  <table className="table align-middle">

                    <tbody>

                      <tr>
                        <td>Giao dịch cấp phát</td>
                        <td className="text-end fw-bold">
                          {transactions.issue ?? "—"}
                        </td>
                      </tr>

                      <tr>
                        <td>Giao dịch thu hồi</td>
                        <td className="text-end fw-bold">
                          {transactions.revoke ?? "—"}
                        </td>
                      </tr>

                      <tr>
                        <td>Đã xác nhận</td>
                        <td className="text-end text-success fw-bold">
                          {transactions.confirmed ?? "—"}
                        </td>
                      </tr>

                      <tr>
                        <td>Đang chờ xác nhận</td>
                        <td className="text-end text-warning fw-bold">
                          {transactions.pending ?? "—"}
                        </td>
                      </tr>

                      <tr>
                        <td>Thất bại</td>
                        <td className="text-end text-danger fw-bold">
                          {transactions.failed ?? "—"}
                        </td>
                      </tr>

                    </tbody>

                  </table>

                  <Link to="/admin/transactions">
                    Xem lịch sử giao dịch
                  </Link>

                </div>

              </div>

            </div>


            {/* Thống kê xác thực */}

            <div className="col-lg-6">

              <div className="card h-100">

                <div className="card-header bg-white py-3">

                  <h5 className="mb-0">
                    Kết quả xác thực và tra cứu
                  </h5>

                </div>

                <div className="card-body">

                  <div className="verification-total mb-3">

                    <span>Tổng lượt thực hiện</span>

                    <h3 className="text-primary mb-0">

                      {verifications.total ?? "—"}

                    </h3>

                  </div>

                  <table className="table align-middle">

                    <tbody>

                      {[
                        ["Tài liệu hợp lệ",
                          verifications.valid,
                          "success"],

                        ["Tài liệu không khớp",
                          verifications.mismatch,
                          "danger"],

                        ["Tài liệu đã thu hồi",
                          verifications.revoked,
                          "danger"],

                        ["Không tìm thấy",
                          verifications.notFound,
                          "secondary"],

                        ["Chỉ tra cứu",
                          verifications.lookupOnly,
                          "primary"],

                        ["Đơn vị không có quyền",
                          verifications.unauthorizedIssuer,
                          "warning"],

                        ["Lỗi xác thực",
                          verifications.error,
                          "secondary"],
                      ].map(([label, value, color]) => (

                        <tr key={label}>

                          <td>{label}</td>

                          <td
                            className={`text-end
                                        fw-bold
                                        text-${color}`}
                          >
                            {value ?? "—"}
                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                  <Link to="/admin/verifications">
                    Xem lịch sử xác thực
                  </Link>

                </div>

              </div>

            </div>

          </div>


          {/* Danh sách tài liệu gần đây */}

          <div className="card mb-4">

            <div className="card-header bg-white py-3
                            d-flex flex-wrap gap-2
                            justify-content-between
                            align-items-center">

              <h5 className="mb-0">
                Tài liệu gần đây
              </h5>

              <Link
                to="/admin/documents"
                className="btn btn-outline-primary btn-sm"
              >
                Xem tất cả
              </Link>

            </div>

            <div className="card-body">

              <div className="table-responsive">

                <table className="table table-bordered
                                  table-hover align-middle
                                  dashboard-table">

                  <thead className="table-light">

                    <tr>
                      <th>STT</th>
                      <th>Mã tài liệu</th>
                      <th>Tên tài liệu</th>
                      <th>Đơn vị cấp phát</th>
                      <th>Trạng thái</th>
                      <th>Ngày cấp phát</th>
                    </tr>

                  </thead>

                  <tbody>

                    {recentDocuments.length > 0 ? (

                      recentDocuments.map((document, index) => (

                        <tr key={document.id}>

                          <td>{index + 1}</td>

                          <td>
                            <span
                              className="document-code"
                              title={document.document_code}
                            >
                              {document.document_code}
                            </span>
                          </td>

                          <td>{document.title}</td>

                          <td>
                            {document.organization_name || "—"}
                          </td>

                          <td>
                            <DocumentStatus
                              status={document.status}
                            />
                          </td>

                          <td>
                            {formatDate(document.issued_at)}
                          </td>

                        </tr>

                      ))

                    ) : (

                      <tr>

                        <td
                          colSpan={6}
                          className="text-center
                                     text-secondary py-4"
                        >
                          Chưa có tài liệu nào.
                        </td>

                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>


          {/* Thông tin hệ thống */}

          <div className="card">

            <div className="card-header bg-white py-3">

              <h5 className="mb-0">
                Thông tin hệ thống
              </h5>

            </div>

            <div className="card-body">

              <div className="row g-3">

                <div className="col-md-3 col-sm-6">
                  <small className="text-secondary">
                    Công nghệ
                  </small>
                  <p className="fw-bold mb-0">
                    Blockchain
                  </p>
                </div>

                <div className="col-md-3 col-sm-6">
                  <small className="text-secondary">
                    Mạng Blockchain
                  </small>
                  <p className="fw-bold mb-0">
                    Ethereum Sepolia
                  </p>
                </div>

                <div className="col-md-3 col-sm-6">
                  <small className="text-secondary">
                    Thuật toán băm
                  </small>
                  <p className="fw-bold mb-0">
                    SHA-256
                  </p>
                </div>

                <div className="col-md-3 col-sm-6">
                  <small className="text-secondary">
                    Cơ sở dữ liệu
                  </small>
                  <p className="fw-bold mb-0">
                    MySQL
                  </p>
                </div>

              </div>

            </div>

          </div>

        </>

      )}

    </div>
  );
}

export default AdminDashboard;