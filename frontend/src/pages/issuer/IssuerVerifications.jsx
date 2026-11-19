import { useEffect, useState } from "react";

import issuerVerificationApi from "../../api/issuerVerificationApi.js";

import VerificationStatus from "../../components/VerificationStatus.jsx";
import DocumentStatus from "../../components/DocumentStatus.jsx";
import Pagination from "../../components/Pagination.jsx";

import "../../styles/documents.css";
import "../../styles/issuer-verifications.css";

// ============================================
// 1. ĐỊNH DẠNG THỜI GIAN
// ============================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

// ============================================
// 2. TRANG LỊCH SỬ XÁC THỰC
// ============================================

function IssuerVerifications() {

  const [verifications, setVerifications] =
    useState([]);

  const [statistics, setStatistics] =
    useState(null);

  const [loading, setLoading] = useState(true);

  const [statsLoading, setStatsLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [statsError, setStatsError] =
    useState("");

  const [filterError, setFilterError] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] = useState("");

  const [result, setResult] = useState("");

  // Khoảng thời gian nhập trên giao diện

  const [fromDateInput, setFromDateInput] =
    useState("");

  const [toDateInput, setToDateInput] =
    useState("");

  // Khoảng thời gian gửi đến Backend

  const [fromDate, setFromDate] = useState("");

  const [toDate, setToDate] = useState("");

  // Phân trang

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const [copyMessage, setCopyMessage] =
    useState("");

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });

  // ============================================
  // 3. LẤY THỐNG KÊ XÁC THỰC
  // ============================================

  useEffect(() => {

    let cancelled = false;

    async function fetchStatistics() {

      try {

        const response =
          await issuerVerificationApi.getStatistics();

        if (cancelled) return;

        if (!response.success || !response.data) {
          throw new Error(
            "Dữ liệu thống kê không hợp lệ."
          );
        }

        setStatistics(response.data);

      } catch {

        if (!cancelled) {

          setStatsError(
            "Không thể tải thống kê xác thực."
          );

        }

      } finally {

        if (!cancelled) {
          setStatsLoading(false);
        }

      }

    }

    fetchStatistics();

    return () => {
      cancelled = true;
    };

  }, [refreshKey]);

  // ============================================
  // 4. LẤY DANH SÁCH LỊCH SỬ XÁC THỰC
  // ============================================

  useEffect(() => {

    let cancelled = false;
    let changingPage = false;

    async function fetchVerifications() {

      try {

        const response =
          await issuerVerificationApi.getAll({
            search,
            result,
            fromDate,
            toDate,
            page,
            limit,
          });

        if (cancelled) return;

        if (
          !response.success ||
          !Array.isArray(response.data) ||
          !response.pagination
        ) {
          throw new Error(
            "Dữ liệu xác thực không hợp lệ."
          );
        }

        const paging = response.pagination;

        // Kiểm tra dữ liệu phân trang

        if (
          !Number.isSafeInteger(paging.total) ||
          !Number.isSafeInteger(paging.totalPages) ||
          paging.total < 0 ||
          paging.totalPages < 0 ||
          paging.page !== page ||
          paging.limit !== limit
        ) {
          throw new Error(
            "Thông tin phân trang không hợp lệ."
          );
        }

        const lastPage = Math.max(
          1,
          paging.totalPages
        );

        if (page > lastPage) {

          changingPage = true;

          setPage(lastPage);

          return;
        }

        setVerifications(response.data);

        setPagination(paging);

      } catch (err) {

        if (cancelled) return;

        const statusCode = err.response?.status;

        if (statusCode === 400) {

          setError(
            "Thông tin tìm kiếm không hợp lệ."
          );

        } else if (statusCode === 401) {

          setError(
            "Phiên đăng nhập đã hết hạn."
          );

        } else if (statusCode === 403) {

          setError(
            "Bạn không có quyền xem lịch sử xác thực."
          );

        } else if (
          err.request && !err.response
        ) {

          setError(
            "Không thể kết nối đến máy chủ."
          );

        } else {

          setError(
            "Không thể tải lịch sử xác thực."
          );

        }

      } finally {

        if (!cancelled && !changingPage) {

          setLoading(false);

        }

      }

    }

    fetchVerifications();

    return () => {
      cancelled = true;
    };

  }, [
    search,
    result,
    fromDate,
    toDate,
    page,
    limit,
    refreshKey,
  ]);

  // ============================================
  // 5. CHUẨN BỊ TẢI DỮ LIỆU
  // ============================================

  function prepareLoading() {

    setLoading(true);

    setError("");

    setCopyMessage("");

  }

  // ============================================
  // 6. TÌM KIẾM TÀI LIỆU
  // ============================================

  function handleSearch(event) {

    event.preventDefault();

    const keyword = searchInput.trim();

    if (
      keyword === search &&
      page === 1
    ) return;

    prepareLoading();

    setSearch(keyword);

    setPage(1);

  }

  // ============================================
  // 7. LỌC KẾT QUẢ XÁC THỰC
  // ============================================

  function handleResultChange(value) {

    if (value === result) return;

    prepareLoading();

    setResult(value);

    setPage(1);

  }

  // ============================================
  // 8. LỌC THEO KHOẢNG THỜI GIAN
  // ============================================

  function handleApplyDate() {

    setFilterError("");

    if (
      fromDateInput &&
      toDateInput &&
      fromDateInput > toDateInput
    ) {

      setFilterError(
        "Ngày bắt đầu không được lớn hơn ngày kết thúc."
      );

      return;
    }

    if (
      fromDateInput === fromDate &&
      toDateInput === toDate &&
      page === 1
    ) return;

    prepareLoading();

    setFromDate(fromDateInput);

    setToDate(toDateInput);

    setPage(1);

  }

  // ============================================
  // 9. PHÂN TRANG
  // ============================================

  function handlePageChange(value) {

    if (
      loading ||
      value === page ||
      value < 1 ||
      value > pagination.totalPages
    ) return;

    prepareLoading();

    setPage(value);

  }

  function handleLimitChange(value) {

    const newLimit = Number(value);

    if (
      ![10, 20, 50, 100].includes(newLimit) ||
      newLimit === limit
    ) return;

    prepareLoading();

    setLimit(newLimit);

    setPage(1);

  }

  // ============================================
  // 10. ĐẶT LẠI BỘ LỌC
  // ============================================

  function handleReset() {

    setSearchInput("");

    setFromDateInput("");

    setToDateInput("");

    setFilterError("");

    if (
      search === "" &&
      result === "" &&
      fromDate === "" &&
      toDate === "" &&
      page === 1
    ) return;

    prepareLoading();

    setSearch("");

    setResult("");

    setFromDate("");

    setToDate("");

    setPage(1);

  }

  // ============================================
  // 11. LÀM MỚI DỮ LIỆU
  // ============================================

  function handleRefresh() {

    prepareLoading();

    setStatsLoading(true);

    setStatsError("");

    setRefreshKey(previous => previous + 1);

  }

  // ============================================
  // 12. SAO CHÉP MÃ TÀI LIỆU
  // ============================================

  async function handleCopy(value) {

    try {

      await navigator.clipboard.writeText(value);

      setCopyMessage(
        "Đã sao chép mã tài liệu."
      );

    } catch {

      setCopyMessage(
        "Không thể sao chép mã tài liệu."
      );

    }

  }

  // ============================================
  // 13. THẺ THỐNG KÊ
  // ============================================

  const statisticCards = [

    {
      title: "Tổng lượt xác thực",
      value: statistics?.total,
      color: "primary",
      icon: "bi-clipboard-data",
    },

    {
      title: "Tài liệu hợp lệ",
      value: statistics?.valid,
      color: "success",
      icon: "bi-shield-check",
    },

    {
      title: "Không trùng khớp",
      value: statistics?.mismatch,
      color: "danger",
      icon: "bi-file-earmark-x",
    },

    {
      title: "Đã thu hồi",
      value: statistics?.revoked,
      color: "danger",
      icon: "bi-slash-circle",
    },

    {
      title: "Chỉ tra cứu",
      value: statistics?.lookupOnly,
      color: "info",
      icon: "bi-search",
    },

    {
      title: "Không tìm thấy",
      value: statistics?.notFound,
      color: "warning",
      icon: "bi-file-earmark-search",
    },

    {
      title: "Lỗi xác thực",
      value: statistics?.error,
      color: "secondary",
      icon: "bi-exclamation-triangle",
    },

  ];

  // ============================================
  // 14. GIAO DIỆN WEBSITE
  // ============================================

  return (

    <div className="issuer-verifications-page">

      {/* TIÊU ĐỀ */}

      <div className="issuer-verifications-heading mb-4">

        <div>

          <h3>Lịch sử xác thực tài liệu</h3>

          <p className="text-secondary mb-0">
            Theo dõi kết quả xác thực
            các tài liệu đã cấp phát.
          </p>

        </div>

        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={handleRefresh}
          disabled={loading || statsLoading}
        >

          <i className="bi bi-arrow-clockwise me-2"></i>

          Làm mới

        </button>

      </div>

      {/* THÔNG BÁO LỖI THỐNG KÊ */}

      {statsError && (

        <div className="alert alert-warning">

          {statsError}

        </div>

      )}

      {/* THẺ THỐNG KÊ */}

      <div className="row g-3 mb-4">

        {statisticCards.map(item => (

          <div
            className="col-6 col-md-4 col-xl-3"
            key={item.title}
          >

            <div className="card h-100">

              <div className="card-body">

                <div
                  className={`issuer-verification-icon
                    bg-${item.color}-subtle
                    text-${item.color}`}
                >

                  <i className={`bi ${item.icon}`}></i>

                </div>

                <p className="text-secondary mt-3 mb-2">

                  {item.title}

                </p>

                <h3 className={`text-${item.color}`}>

                  {statsLoading || statsError
                    ? "—"
                    : item.value ?? "—"}

                </h3>

              </div>

            </div>

          </div>

        ))}

      </div>

      {/* DANH SÁCH LỊCH SỬ XÁC THỰC */}

      <div className="card">

        <div className="card-header bg-white">

          <h5>

            <i className="bi bi-clock-history me-2"></i>

            Danh sách lịch sử xác thực

          </h5>

        </div>

        <div className="card-body">

          {/* TÌM KIẾM VÀ LỌC KẾT QUẢ */}

          <div className="row g-3 mb-3 align-items-end">

            <div className="col-lg-8">

              <form onSubmit={handleSearch}>

                <label
                  htmlFor="verification-search"
                  className="form-label"
                >

                  Tìm kiếm tài liệu

                </label>

                <div className="input-group">

                  <input
                    id="verification-search"
                    type="text"
                    className="form-control"
                    placeholder="Nhập mã hoặc tên tài liệu"
                    value={searchInput}
                    maxLength={255}
                    onChange={event =>
                      setSearchInput(event.target.value)
                    }
                  />

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >

                    <i className="bi bi-search me-2"></i>

                    Tìm kiếm

                  </button>

                </div>

              </form>

            </div>

            <div className="col-lg-4">

              <label
                htmlFor="verification-result"
                className="form-label"
              >

                Kết quả xác thực

              </label>

              <select
                id="verification-result"
                className="form-select"
                value={result}
                disabled={loading}
                onChange={event =>
                  handleResultChange(event.target.value)
                }
              >

                <option value="">Tất cả kết quả</option>

                <option value="valid">
                  Tài liệu hợp lệ
                </option>

                <option value="mismatch">
                  Không trùng khớp
                </option>

                <option value="revoked">
                  Đã thu hồi
                </option>

                <option value="not_found">
                  Không tìm thấy
                </option>

                <option value="lookup_only">
                  Chỉ tra cứu
                </option>

                <option value="error">
                  Lỗi xác thực
                </option>

              </select>

            </div>

          </div>

          {/* LỌC THEO NGÀY */}

          <div className="row g-3 mb-4 align-items-end">

            <div className="col-md-4">

              <label
                htmlFor="verification-from-date"
                className="form-label"
              >

                Từ ngày

              </label>

              <input
                id="verification-from-date"
                type="date"
                className="form-control"
                value={fromDateInput}
                onChange={event => {

                  setFromDateInput(event.target.value);

                  setFilterError("");

                }}
              />

            </div>

            <div className="col-md-4">

              <label
                htmlFor="verification-to-date"
                className="form-label"
              >

                Đến ngày

              </label>

              <input
                id="verification-to-date"
                type="date"
                className="form-control"
                value={toDateInput}
                onChange={event => {

                  setToDateInput(event.target.value);

                  setFilterError("");

                }}
              />

            </div>

            <div className="col-md-4">

              <div className="issuer-verification-filters">

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApplyDate}
                  disabled={loading}
                >

                  <i className="bi bi-funnel me-2"></i>

                  Áp dụng

                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleReset}
                  disabled={loading}
                >

                  <i className="bi bi-arrow-counterclockwise me-2"></i>

                  Đặt lại

                </button>

              </div>

            </div>

          </div>

          {/* THÔNG BÁO */}

          {filterError && (

            <div className="alert alert-warning">

              {filterError}

            </div>

          )}

          {error && (

            <div className="alert alert-danger">

              {error}

            </div>

          )}

          {copyMessage && (

            <div className="alert alert-info" role="status">

              {copyMessage}

            </div>

          )}

          {/* BẢNG LỊCH SỬ XÁC THỰC */}

          <div className="table-responsive">

            <table className="table table-bordered table-hover align-middle">

              <thead>

                <tr>

                  <th>STT</th>

                  <th>Mã tra cứu</th>

                  <th>Tên tài liệu</th>

                  <th>Loại tài liệu</th>

                  <th>Kết quả xác thực</th>

                  <th>Trạng thái hiện tại</th>

                  <th>Thời gian xác thực</th>

                  <th>Thao tác</th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="text-center py-5"
                    >

                      <div
                        className="spinner-border text-primary"
                        role="status"
                        aria-label="Đang tải"
                      ></div>

                      <p className="mt-2 mb-0">

                        Đang tải lịch sử xác thực...

                      </p>

                    </td>

                  </tr>

                ) : error ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="text-center py-4"
                    >

                      Không thể hiển thị dữ liệu.

                    </td>

                  </tr>

                ) : verifications.length === 0 ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="text-center py-5"
                    >

                      <i className="bi bi-clipboard-x fs-1 text-secondary"></i>

                      <p className="mt-2 mb-0">

                        Không tìm thấy lịch sử xác thực.

                      </p>

                    </td>

                  </tr>

                ) : (

                  verifications.map((item, index) => (

                    <tr key={item.id}>

                      <td>

                        {(page - 1) * limit + index + 1}

                      </td>

                      <td>

                        <span
                          className="issuer-verification-code"
                          title={
                            item.searched_code ||
                            item.document_code
                          }
                        >

                          {
                            item.searched_code ||
                            item.document_code ||
                            "—"
                          }

                        </span>

                      </td>

                      <td className="issuer-verification-title">

                        {item.document_title || "—"}

                      </td>

                      <td>

                        {item.document_type || "—"}

                      </td>

                      <td>

                        <VerificationStatus
                          result={item.result}
                        />

                      </td>

                      <td>

                        <DocumentStatus
                          status={item.document_status}
                        />

                      </td>

                      <td>

                        {formatDate(item.verified_at)}

                      </td>

                      <td>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          title="Sao chép mã tài liệu"
                          aria-label="Sao chép mã tài liệu"
                          disabled={!item.document_code}
                          onClick={() =>
                            handleCopy(item.document_code)
                          }
                        >

                          <i className="bi bi-copy"></i>

                        </button>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

          {/* PHÂN TRANG */}

          {!error && !loading && (

            <Pagination

              page={page}

              limit={limit}

              total={pagination.total}

              totalPages={pagination.totalPages}

              onPageChange={handlePageChange}

              onLimitChange={handleLimitChange}

              loading={loading}

            />

          )}

          {/* GHI CHÚ */}

          <div className="alert alert-info mt-4 mb-0">

            <i className="bi bi-info-circle me-2"></i>

            Kết quả xác thực được ghi nhận tại thời
            điểm người dùng thực hiện xác thực.
            Trạng thái hiện tại của tài liệu có thể
            thay đổi sau thời điểm đó.

          </div>

        </div>

      </div>

    </div>

  );

}

export default IssuerVerifications;