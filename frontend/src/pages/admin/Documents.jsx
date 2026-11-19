import DocumentDetail from "../../components/DocumentDetail.jsx";
import { useState, useEffect } from "react";

import documentApi from "../../api/documentApi.js";
import organizationApi from "../../api/organizationApi.js";
import dashboardApi from "../../api/dashboardApi.js";

import DocumentStatus from "../../components/DocumentStatus.jsx";
import Pagination from "../../components/Pagination.jsx";

import "../../styles/documents.css";


// ================================================
// TRANG QUẢN LÝ TÀI LIỆU
// ================================================

function Documents() {

  const [documents, setDocuments] = useState([]);

  const [selectedDocumentId, setSelectedDocumentId] =
  useState(null);

  const [organizations, setOrganizations] = useState([]);

  const [statistics, setStatistics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [metadataLoading, setMetadataLoading] = useState(true);

  const [error, setError] = useState("");

  const [metadataError, setMetadataError] = useState("");

  const [searchInput, setSearchInput] = useState("");

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [organizationId, setOrganizationId] = useState("");

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [refreshKey, setRefreshKey] = useState(0);

  const [pagination, setPagination] = useState({

    page: 1,

    limit: 10,

    total: 0,

    totalPages: 0,

  });


  // ================================================
  // 1. LẤY THỐNG KÊ VÀ DANH SÁCH ĐƠN VỊ
  // ================================================

  useEffect(() => {

    let cancelled = false;

    async function fetchMetadata() {

      try {

        const [organizationResponse, dashboardResponse] =
          await Promise.all([

            organizationApi.getAll(),

            dashboardApi.getAdminDashboard(),

          ]);

        if (cancelled) return;

        if (
          !organizationResponse.success ||
          !Array.isArray(organizationResponse.data) ||
          !dashboardResponse.success ||
          !dashboardResponse.data?.documents
        ) {

          setMetadataError(
            "Không thể đọc dữ liệu thống kê hoặc đơn vị."
          );

          return;

        }

        setOrganizations(organizationResponse.data);

        setStatistics(dashboardResponse.data.documents);

      } catch {

        if (!cancelled) {

          setMetadataError(
            "Không thể tải thống kê hoặc danh sách đơn vị."
          );

        }

      } finally {

        if (!cancelled) {

          setMetadataLoading(false);

        }

      }

    }

    fetchMetadata();

    return () => {

      cancelled = true;

    };

  }, [refreshKey]);


  // ================================================
  // 2. LẤY DANH SÁCH TÀI LIỆU
  // ================================================

  useEffect(() => {

    let cancelled = false;

    async function fetchDocuments() {

      try {

        const params = {

          search,

          status,

          page,

          limit,

        };


        // Chỉ gửi ID đơn vị khi đã chọn đơn vị

        if (organizationId) {

          params.organizationId = Number(organizationId);

        }

        const response =
          await documentApi.getAll(params);

        if (cancelled) return;

        if (
          !response.success ||
          !Array.isArray(response.data) ||
          !response.pagination
        ) {

          setError(
            "Dữ liệu tài liệu trả về không hợp lệ."
          );

          return;

        }

        const result = response.pagination;

        if (
          !Number.isSafeInteger(result.totalPages) ||
          result.totalPages < 0 ||
          !Number.isSafeInteger(result.total) ||
          result.total < 0 ||
          result.page !== page ||
          result.limit !== limit
        ) {

          setError("Dữ liệu phân trang không hợp lệ.");

          return;

        }


        // Xử lý khi trang hiện tại vượt quá số trang

        const lastPage = Math.max(1, result.totalPages);

        if (page > lastPage) {

  setDocuments([]);

  setPage(lastPage);

  return;

}

        setDocuments(response.data);

        setPagination(result);

      } catch (err) {

        if (cancelled) return;

        const statusCode = err.response?.status;

        if (statusCode === 400) {

          setError(
            "Tham số tìm kiếm hoặc phân trang không hợp lệ."
          );

        } else if (statusCode === 401) {

          setError("Phiên đăng nhập đã hết hạn.");

        } else if (statusCode === 403) {

          setError(
            "Bạn không có quyền truy cập chức năng này."
          );

        } else if (!err.response) {

          setError("Không thể kết nối đến máy chủ.");

        } else {

          setError("Không thể tải danh sách tài liệu.");

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }

    fetchDocuments();

    return () => {

      cancelled = true;

    };

  }, [search, status, organizationId, page, limit, refreshKey]);


  // ================================================
  // 3. CHUẨN BỊ TẢI DỮ LIỆU
  // ================================================

  function prepareLoading() {

    setLoading(true);

    setError("");

  }


  // ================================================
  // 4. TÌM KIẾM
  // ================================================

  function handleSearch(event) {

    event.preventDefault();

    const keyword = searchInput.trim();

    if (keyword === search && page === 1) return;

    prepareLoading();

    setSearch(keyword);

    setPage(1);

  }


  // ================================================
  // 5. LỌC TRẠNG THÁI
  // ================================================

  function handleStatusChange(value) {

    if (value === status) return;

    prepareLoading();

    setStatus(value);

    setPage(1);

  }


  // ================================================
  // 6. LỌC ĐƠN VỊ
  // ================================================

  function handleOrganizationChange(value) {

    if (value === organizationId) return;

    prepareLoading();

    setOrganizationId(value);

    setPage(1);

  }


  // ================================================
  // 7. CHUYỂN TRANG
  // ================================================

  function handlePageChange(value) {

    if (value === page) return;

    prepareLoading();

    setPage(value);

  }


  // ================================================
  // 8. THAY ĐỔI SỐ KẾT QUẢ MỖI TRANG
  // ================================================

  function handleLimitChange(value) {

    if (value === limit) return;

    prepareLoading();

    setLimit(value);

    setPage(1);

  }


  // ================================================
  // 9. XÓA BỘ LỌC
  // ================================================

  function handleReset() {

    setSearchInput("");

    if (
      !search &&
      !status &&
      !organizationId &&
      page === 1
    ) return;

    prepareLoading();

    setSearch("");

    setStatus("");

    setOrganizationId("");

    setPage(1);

  }


  // ================================================
  // 10. LÀM MỚI
  // ================================================

  function handleRefresh() {

    prepareLoading();

    setMetadataLoading(true);

    setMetadataError("");

    setRefreshKey((previous) => previous + 1);

  }

  // ================================================
// XEM CHI TIẾT TÀI LIỆU
// ================================================

function handleViewDetail(id) {

  setSelectedDocumentId(id);

}


// ================================================
// ĐÓNG CHI TIẾT TÀI LIỆU
// ================================================

function handleCloseDetail() {

  setSelectedDocumentId(null);

} 

  // ================================================
  // 11. ĐỊNH DẠNG NGÀY
  // ================================================

  function formatDate(value) {

    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("vi-VN");

  }


  // ================================================
  // 12. CÁC THẺ THỐNG KÊ
  // ================================================

  const statisticCards = [

    {
      title: "Tổng tài liệu",
      value: statistics?.total,
      color: "primary",
      icon: "bi-files",
    },

    {
      title: "Đã cấp phát",
      value: statistics?.issued,
      color: "success",
      icon: "bi-file-earmark-check",
    },

    {
      title: "Đã thu hồi",
      value: statistics?.revoked,
      color: "danger",
      icon: "bi-file-earmark-x",
    },

    {
      title: "Đang xử lý",
      value: statistics?.pending,
      color: "warning",
      icon: "bi-hourglass-split",
    },

    {
      title: "Thất bại",
      value: statistics?.failed,
      color: "secondary",
      icon: "bi-exclamation-circle",
    },

  ];


  // ================================================
  // 13. GIAO DIỆN
  // ================================================

  return (

  <div className="documents-page">

    {selectedDocumentId !== null && (

      <DocumentDetail
        key={selectedDocumentId}
        documentId={selectedDocumentId}
        onClose={handleCloseDetail}
      />

    )}

    <div inert={selectedDocumentId !== null}>

    {/* TIÊU ĐỀ */}

      <div className="documents-heading mb-4">

        <div>

          <h3 className="fw-bold mb-2">

            Quản lý tài liệu

          </h3>

          <p className="text-secondary mb-0">

            Quản lý và theo dõi toàn bộ tài liệu
            trong hệ thống.

          </p>

        </div>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handleRefresh}
          disabled={loading || metadataLoading}
        >

          <i className="bi bi-arrow-clockwise me-2"></i>

          Làm mới

        </button>

      </div>


      {/* THỐNG KÊ */}

      <div className="row row-cols-1 row-cols-sm-2
                      row-cols-lg-3 row-cols-xl-5
                      g-3 mb-4">

        {statisticCards.map((item) => (

          <div className="col" key={item.title}>

            <div className="card h-100">

              <div className="card-body">

                <div className={`document-stat-icon
                                 text-${item.color}
                                 bg-${item.color}-subtle mb-3`}>

                  <i className={`bi ${item.icon}`}></i>

                </div>

                <p className="text-secondary small mb-2">

                  {item.title}

                </p>

                <h3 className={`fw-bold mb-0
                                text-${item.color}`}>

                  {metadataLoading || metadataError

                    ? "—"

                    : item.value ?? "—"}

                </h3>

              </div>

            </div>

          </div>

        ))}

      </div>


      {/* THÔNG BÁO */}

      {metadataError && (

        <div className="alert alert-warning" role="alert">

          {metadataError}

        </div>

      )}

      {error && (

        <div className="alert alert-danger" role="alert">

          <i className="bi bi-exclamation-circle me-2"></i>

          {error}

        </div>

      )}


      {/* DANH SÁCH TÀI LIỆU */}

      <div className="card">

        <div className="card-header bg-white py-3">

          <h5 className="mb-0">

            Danh sách tài liệu

          </h5>

        </div>

        <div className="card-body">

          {/* TÌM KIẾM VÀ BỘ LỌC */}

          <div className="row g-3 mb-3">

            <div className="col-lg-5">

              <form onSubmit={handleSearch}>

                <label
                  htmlFor="document-search"
                  className="form-label"
                >

                  Tìm kiếm tài liệu

                </label>

                <div className="input-group">

                  <input
                    id="document-search"
                    type="text"
                    className="form-control"
                    placeholder="Nhập tên, mã hoặc loại tài liệu..."
                    value={searchInput}
                    maxLength={255}
                    onChange={(event) =>
                      setSearchInput(event.target.value)
                    }
                  />

                  <button
                    type="submit"
                    className="btn btn-primary"
                    aria-label="Tìm kiếm"
                    disabled={loading}
                  >

                    <i className="bi bi-search"></i>

                  </button>

                </div>

              </form>

            </div>


            {/* ĐƠN VỊ CẤP PHÁT */}

            <div className="col-lg-4">

              <label
                htmlFor="document-organization"
                className="form-label"
              >

                Đơn vị cấp phát

              </label>

              <select
                id="document-organization"
                className="form-select"
                value={organizationId}
                disabled={loading || metadataLoading}
                onChange={(event) =>
                  handleOrganizationChange(event.target.value)
                }
              >

                <option value="">

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


            {/* TRẠNG THÁI */}

            <div className="col-lg-3">

              <label
                htmlFor="document-status"
                className="form-label"
              >

                Trạng thái

              </label>

              <select
                id="document-status"
                className="form-select"
                value={status}
                disabled={loading}
                onChange={(event) =>
                  handleStatusChange(event.target.value)
                }
              >

                <option value="">Tất cả trạng thái</option>

                <option value="issued">Đã cấp phát</option>

                <option value="revoked">Đã thu hồi</option>

                <option value="pending">Đang xử lý</option>

                <option value="failed">Thất bại</option>

              </select>

            </div>

          </div>


          <div className="mb-4">

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleReset}
              disabled={loading}
            >

              <i className="bi bi-x-circle me-2"></i>

              Xóa bộ lọc

            </button>

          </div>


          {/* BẢNG TÀI LIỆU */}

          <div className="table-responsive">

            <table className="table table-bordered
                              table-hover align-middle
                              documents-table">

              <thead className="table-light">

                <tr>

                  <th>STT</th>

                  <th>Mã tài liệu</th>

                  <th>Tên tài liệu</th>

                  <th>Loại tài liệu</th>

                  <th>Đơn vị cấp phát</th>

                  <th>Người cấp phát</th>

                  <th>Trạng thái</th>

                  <th>Ngày cấp phát</th>

                  <th>Thao tác</th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="text-center py-5"
                    >

                      <div
                        className="spinner-border text-primary"
                        role="status"
                        aria-label="Đang tải dữ liệu"
                      ></div>

                      <p className="text-secondary mt-3 mb-0">

                        Đang tải danh sách tài liệu...

                      </p>

                    </td>

                  </tr>

                ) : error ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="text-center py-4"
                    >

                      Không thể hiển thị dữ liệu.

                    </td>

                  </tr>

                ) : documents.length === 0 ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="text-center text-secondary py-5"
                    >

                      <i className="bi bi-folder2-open fs-2"></i>

                      <p className="mt-2 mb-0">

                        Không tìm thấy tài liệu phù hợp.

                      </p>

                    </td>

                  </tr>

                ) : (

                  documents.map((item, index) => (

                    <tr key={item.id}>

                      <td>

                        {(page - 1) * limit + index + 1}

                      </td>

                      <td>

                        <span
                          className="document-code"
                          title={item.document_code}
                        >

                          {item.document_code}

                        </span>

                      </td>

                      <td className="document-title">

                        {item.title}

                      </td>

                      <td>

                        {item.document_type || "—"}

                      </td>

                      <td>

                        {item.organization_name || "—"}

                      </td>

                      <td>

                        {item.issuer_name || "—"}

                      </td>

                      <td>

                        <DocumentStatus status={item.status} />

                      </td>

                      <td>

                        {formatDate(item.issued_at)}

                      </td>

                      <td>

                        <button
  type="button"
  className="btn btn-sm btn-outline-primary"
  title="Xem chi tiết tài liệu"
  onClick={() => handleViewDetail(item.id)}
>

  <i className="bi bi-eye me-1"></i>

  Chi tiết

</button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>


          {/* PHÂN TRANG */}

          {!loading && !error && (

            <Pagination
              page={pagination.page}
              limit={pagination.limit}
              total={pagination.total}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
              loading={loading}
            />

          )}

                </div>

      </div>

      </div>

    </div>

  );

}

export default Documents;