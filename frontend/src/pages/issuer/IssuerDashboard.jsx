import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import useAuth from "../../context/useAuth.js";
import dashboardApi from "../../api/dashboardApi.js";
import DocumentStatus from "../../components/DocumentStatus.jsx";

import "../../styles/issuer-dashboard.css";


// ================================================
// 1. ĐỊNH DẠNG THỜI GIAN
// ================================================

function formatDate(value) {

  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });

}


// ================================================
// 2. TRANG TỔNG QUAN
// ================================================

function IssuerDashboard() {

  const { user } = useAuth();

  const [dashboard, setDashboard] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [updatedAt, setUpdatedAt] = useState(null);


  // ==============================================
  // 3. LẤY DỮ LIỆU TỪ BACKEND
  // ==============================================

  useEffect(() => {

    let cancelled = false;

    async function fetchDashboard() {

      try {

        const response =
          await dashboardApi.getIssuerDashboard();

        if (cancelled) return;

        if (

          !response.success ||

          !response.data ||

          !response.data.documents ||

          !response.data.transactions ||

          !response.data.verifications ||

          !Array.isArray(response.data.recentDocuments)

        ) {

          setError("Dữ liệu thống kê không hợp lệ.");

          return;

        }

        setDashboard(response.data);

        setUpdatedAt(new Date());

      } catch (err) {

        if (cancelled) return;

        const status = err.response?.status;

        if (status === 401) {

          setError("Phiên đăng nhập đã hết hạn.");

        } else if (status === 403) {

          setError("Bạn không có quyền truy cập.");

        } else if (!err.response) {

          setError("Không thể kết nối đến máy chủ.");

        } else {

          setError("Không thể tải dữ liệu thống kê.");

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }

    fetchDashboard();

    return () => {

      cancelled = true;

    };

  }, [refreshKey]);


  // ==============================================
  // 4. LÀM MỚI DỮ LIỆU
  // ==============================================

  function handleRefresh() {

    setLoading(true);

    setError("");

    setRefreshKey((previous) => previous + 1);

  }


  // ==============================================
  // 5. DỮ LIỆU THỐNG KÊ
  // ==============================================

  const documents = dashboard?.documents;

  const transactions = dashboard?.transactions;

  const verifications = dashboard?.verifications;

  const recentDocuments =
    dashboard?.recentDocuments || [];


  const statisticCards = [

    {
      title: "Tổng tài liệu",
      value: documents?.total,
      color: "primary",
      icon: "bi-files",
    },

    {
      title: "Đã cấp phát",
      value: documents?.issued,
      color: "success",
      icon: "bi-file-earmark-check",
    },

    {
      title: "Đã thu hồi",
      value: documents?.revoked,
      color: "danger",
      icon: "bi-file-earmark-x",
    },

    {
      title: "Đang xử lý",
      value: documents?.pending,
      color: "warning",
      icon: "bi-hourglass-split",
    },

    {
      title: "Cấp phát thất bại",
      value: documents?.failed,
      color: "secondary",
      icon: "bi-exclamation-circle",
    },

    {
      title: "Lượt xác thực",
      value: verifications?.total,
      color: "info",
      icon: "bi-shield-check",
    },

  ];


  // ==============================================
  // 6. THỐNG KÊ GIAO DỊCH
  // ==============================================

  const transactionItems = [

    {
      label: "Tổng giao dịch",
      value: transactions?.total,
    },

    {
      label: "Đã xác nhận",
      value: transactions?.confirmed,
    },

    {
      label: "Đang xử lý",
      value: transactions?.pending,
    },

    {
      label: "Thất bại",
      value: transactions?.failed,
    },

    {
      label: "Giao dịch cấp phát",
      value: transactions?.issue,
    },

    {
      label: "Giao dịch thu hồi",
      value: transactions?.revoke,
    },

  ];


  // ==============================================
  // 7. THỐNG KÊ XÁC THỰC
  // ==============================================

  const verificationItems = [

    {
      label: "Tài liệu hợp lệ",
      value: verifications?.valid,
    },

    {
      label: "Không trùng khớp",
      value: verifications?.mismatch,
    },

    {
      label: "Tài liệu đã thu hồi",
      value: verifications?.revoked,
    },

    {
      label: "Chỉ tra cứu",
      value: verifications?.lookupOnly,
    },

    {
      label: "Lỗi xác thực",
      value: verifications?.error,
    },

  ];


  function displayValue(value) {

    if (loading || error) return "—";

    return value ?? "—";

  }


  // ==============================================
  // 8. GIAO DIỆN
  // ==============================================

  return (

    <div className="issuer-dashboard">


      {/* TIÊU ĐỀ */}

      <div className="issuer-dashboard-heading mb-4">

        <div>

          <h3>Trang tổng quan</h3>

          <p className="text-secondary mb-0">

            Theo dõi hoạt động cấp phát và xác thực tài liệu.

          </p>

        </div>

        <button

          type="button"

          className="btn btn-outline-primary"

          onClick={handleRefresh}

          disabled={loading}

        >

          <i className="bi bi-arrow-clockwise me-2"></i>

          Làm mới

        </button>

      </div>


      {/* THÔNG TIN NGƯỜI CẤP PHÁT */}

      <div className="issuer-welcome mb-4">

        <div className="issuer-welcome-icon">

          <i className="bi bi-person-circle"></i>

        </div>

        <div>

          <h4>

            Xin chào, {user?.fullName || "người cấp phát"}!

          </h4>

          <p className="mb-2">

            Đơn vị: {user?.organizationName || "Chưa xác định"}

          </p>

          <span className="badge bg-primary">

            Người cấp phát

          </span>

        </div>

      </div>


      {/* THÔNG BÁO LỖI */}

      {error && (

        <div className="alert alert-danger">

          <i className="bi bi-exclamation-circle me-2"></i>

          {error}

        </div>

      )}


      {/* THẺ THỐNG KÊ */}

      <div className="row g-3 mb-4">

        {statisticCards.map((item) => (

          <div

            className="col-12 col-sm-6 col-lg-4"

            key={item.title}

          >

            <div className="card h-100">

              <div className="card-body">

                <div

                  className={`issuer-stat-icon
                    bg-${item.color}-subtle
                    text-${item.color}`}

                >

                  <i className={`bi ${item.icon}`}></i>

                </div>

                <p className="text-secondary mt-3 mb-2">

                  {item.title}

                </p>

                <h3 className={`fw-bold text-${item.color}`}>

                  {displayValue(item.value)}

                </h3>

              </div>

            </div>

          </div>

        ))}

      </div>


      {/* THAO TÁC NHANH */}

      <div className="card mb-4">

        <div className="card-header bg-white">

          <h5>Thao tác nhanh</h5>

        </div>

        <div className="card-body">

          <div className="issuer-quick-actions">

            <Link

              to="/issuer/documents/issue"

              className="btn btn-primary"

            >

              <i className="bi bi-file-earmark-plus me-2"></i>

              Cấp phát tài liệu

            </Link>


            <Link

              to="/issuer/documents"

              className="btn btn-outline-primary"

            >

              <i className="bi bi-files me-2"></i>

              Quản lý tài liệu

            </Link>


            <Link

              to="/issuer/documents/revoke"

              className="btn btn-outline-danger"

            >

              <i className="bi bi-file-earmark-x me-2"></i>

              Thu hồi tài liệu

            </Link>

          </div>

          <p className="small text-secondary mt-3 mb-0">

            Chức năng cấp phát và thu hồi yêu cầu tài khoản

            được phép sử dụng ví Blockchain của hệ thống.

          </p>

        </div>

      </div>


      {/* THỐNG KÊ GIAO DỊCH VÀ XÁC THỰC */}

      <div className="row g-3 mb-4">


        {/* GIAO DỊCH BLOCKCHAIN */}

        <div className="col-lg-6">

          <div className="card h-100">

            <div className="card-header bg-white">

              <h5>

                <i className="bi bi-boxes me-2"></i>

                Giao dịch Blockchain

              </h5>

            </div>

            <div className="card-body">

              {transactionItems.map((item) => (

                <div

                  className="issuer-stat-row"

                  key={item.label}

                >

                  <span>{item.label}</span>

                  <strong>

                    {displayValue(item.value)}

                  </strong>

                </div>

              ))}

              <Link

                to="/issuer/transactions"

                className="btn btn-outline-primary btn-sm mt-3"

              >

                Xem lịch sử giao dịch

              </Link>

            </div>

          </div>

        </div>


        {/* LỊCH SỬ XÁC THỰC */}

        <div className="col-lg-6">

          <div className="card h-100">

            <div className="card-header bg-white">

              <h5>

                <i className="bi bi-shield-check me-2"></i>

                Kết quả xác thực

              </h5>

            </div>

            <div className="card-body">

              {verificationItems.map((item) => (

                <div

                  className="issuer-stat-row"

                  key={item.label}

                >

                  <span>{item.label}</span>

                  <strong>

                    {displayValue(item.value)}

                  </strong>

                </div>

              ))}

              <Link

                to="/issuer/verifications"

                className="btn btn-outline-primary btn-sm mt-3"

              >

                Xem lịch sử xác thực

              </Link>

            </div>

          </div>

        </div>

      </div>


      {/* TÀI LIỆU GẦN ĐÂY */}

      <div className="card">

        <div className="card-header bg-white">

          <h5>

            <i className="bi bi-clock-history me-2"></i>

            Tài liệu gần đây

          </h5>

        </div>

        <div className="card-body">

          <div className="table-responsive">

            <table className="table table-bordered table-hover align-middle">

              <thead className="table-light">

                <tr>

                  <th>STT</th>

                  <th>Mã tài liệu</th>

                  <th>Tên tài liệu</th>

                  <th>Trạng thái</th>

                  <th>Ngày cấp phát</th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td colSpan={5} className="text-center py-4">

                      <div

                        className="spinner-border text-primary"

                        role="status"

                        aria-label="Đang tải"

                      ></div>

                      <p className="mt-2 mb-0">

                        Đang tải dữ liệu...

                      </p>

                    </td>

                  </tr>

                ) : error ? (

                  <tr>

                    <td colSpan={5} className="text-center py-4">

                      Không thể hiển thị dữ liệu.

                    </td>

                  </tr>

                ) : recentDocuments.length === 0 ? (

                  <tr>

                    <td colSpan={5} className="text-center py-4">

                      Chưa có tài liệu nào.

                    </td>

                  </tr>

                ) : (

                  recentDocuments.map((item, index) => (

                    <tr key={item.id}>

                      <td>{index + 1}</td>

                      <td>

                        <span

                          className="issuer-document-code"

                          title={item.document_code}

                        >

                          {item.document_code}

                        </span>

                      </td>

                      <td>{item.title}</td>

                      <td>

                        <DocumentStatus status={item.status} />

                      </td>

                      <td>

                        {formatDate(item.issued_at)}

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

          <Link

            to="/issuer/documents"

            className="btn btn-outline-primary btn-sm"

          >

            Xem tất cả tài liệu

          </Link>

        </div>

      </div>


      {/* THỜI GIAN CẬP NHẬT */}

      <p className="small text-secondary mt-3">

        <i className="bi bi-info-circle me-2"></i>

        Số liệu được lấy từ cơ sở dữ liệu theo tài khoản

        đang đăng nhập.

        {updatedAt && !loading && !error && (

          <> Cập nhật: {formatDate(updatedAt)}.</>

        )}

      </p>

    </div>

  );

}

export default IssuerDashboard;