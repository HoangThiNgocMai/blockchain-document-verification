import { useEffect, useState } from "react";

import issuerTransactionApi from "../../api/issuerTransactionApi.js";

import TransactionStatus from "../../components/TransactionStatus.jsx";
import TransactionAction from "../../components/TransactionAction.jsx";
import Pagination from "../../components/Pagination.jsx";

import "../../styles/documents.css";
import "../../styles/issuer-transactions.css";

// ============================================
// 1. ĐỊNH DẠNG THỜI GIAN
// ============================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

// ============================================
// 2. TRANG LỊCH SỬ GIAO DỊCH
// ============================================

function IssuerTransactions() {

  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  const [error, setError] = useState("");
  const [statsError, setStatsError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [refreshKey, setRefreshKey] = useState(0);
  const [copyMessage, setCopyMessage] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // ============================================
  // 3. LẤY THỐNG KÊ GIAO DỊCH
  // ============================================

  useEffect(() => {
    let cancelled = false;

    async function fetchStatistics() {
      try {
        const response =
          await issuerTransactionApi.getStatistics();

        if (cancelled) return;

        if (!response.success || !response.data) {
          throw new Error("Dữ liệu không hợp lệ.");
        }

        setStatistics(response.data);

      } catch {
        if (!cancelled) {
          setStatsError(
            "Không thể tải thống kê giao dịch."
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
  // 4. LẤY DANH SÁCH GIAO DỊCH
  // ============================================

  useEffect(() => {
    let cancelled = false;
    let changingPage = false;

    async function fetchTransactions() {
      try {
        const response =
          await issuerTransactionApi.getAll({
            search,
            action,
            status,
            page,
            limit,
          });

        if (cancelled) return;

        if (
          !response.success ||
          !Array.isArray(response.data) ||
          !response.pagination
        ) {
          throw new Error("Dữ liệu không hợp lệ.");
        }

        const paging = response.pagination;

        if (
          !Number.isSafeInteger(paging.total) ||
          !Number.isSafeInteger(paging.totalPages) ||
          paging.total < 0 ||
          paging.totalPages < 0 ||
          paging.page !== page ||
          paging.limit !== limit
        ) {
          throw new Error("Phân trang không hợp lệ.");
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

        setTransactions(response.data);
        setPagination(paging);

      } catch (err) {
        if (cancelled) return;

        const code = err.response?.status;

        if (code === 401) {
          setError("Phiên đăng nhập đã hết hạn.");
        } else if (code === 403) {
          setError("Bạn không có quyền xem giao dịch.");
        } else if (err.request && !err.response) {
          setError("Không thể kết nối đến máy chủ.");
        } else {
          setError("Không thể tải danh sách giao dịch.");
        }

      } finally {
        if (!cancelled && !changingPage) {
          setLoading(false);
        }
      }
    }

    fetchTransactions();

    return () => {
      cancelled = true;
    };

  }, [search, action, status, page, limit, refreshKey]);

  // ============================================
  // 5. CHUẨN BỊ TẢI DỮ LIỆU
  // ============================================

  function prepareLoading() {
    setLoading(true);
    setError("");
    setCopyMessage("");
  }

  // ============================================
  // 6. TÌM KIẾM
  // ============================================

  function handleSearch(event) {
    event.preventDefault();

    const keyword = searchInput.trim();

    if (keyword === search && page === 1) return;

    prepareLoading();

    setSearch(keyword);
    setPage(1);
  }

  // ============================================
  // 7. LỌC GIAO DỊCH
  // ============================================

  function handleActionChange(value) {
    if (value === action) return;

    prepareLoading();

    setAction(value);
    setPage(1);
  }

  function handleStatusChange(value) {
    if (value === status) return;

    prepareLoading();

    setStatus(value);
    setPage(1);
  }

  // ============================================
  // 8. PHÂN TRANG
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
  // 9. ĐẶT LẠI BỘ LỌC
  // ============================================

  function handleReset() {
    setSearchInput("");

    if (
      search === "" &&
      action === "" &&
      status === "" &&
      page === 1
    ) return;

    prepareLoading();

    setSearch("");
    setAction("");
    setStatus("");
    setPage(1);
  }

  // ============================================
  // 10. LÀM MỚI DỮ LIỆU
  // ============================================

  function handleRefresh() {
    prepareLoading();

    setStatsLoading(true);
    setStatsError("");

    setRefreshKey(previous => previous + 1);
  }

  // ============================================
  // 11. SAO CHÉP MÃ GIAO DỊCH
  // ============================================

  async function handleCopy(value) {
    try {
      await navigator.clipboard.writeText(value);

      setCopyMessage(
        "Đã sao chép mã giao dịch."
      );

    } catch {
      setCopyMessage(
        "Không thể sao chép mã giao dịch."
      );
    }
  }

  // ============================================
  // 12. THẺ THỐNG KÊ
  // ============================================

  const statisticCards = [
    {
      title: "Tổng giao dịch",
      value: statistics?.total,
      color: "primary",
      icon: "bi-link-45deg",
    },
    {
      title: "Đã xác nhận",
      value: statistics?.confirmed,
      color: "success",
      icon: "bi-check-circle",
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
      color: "danger",
      icon: "bi-x-circle",
    },
    {
      title: "Cấp phát",
      value: statistics?.issue,
      color: "primary",
      icon: "bi-file-earmark-plus",
    },
    {
      title: "Thu hồi",
      value: statistics?.revoke,
      color: "danger",
      icon: "bi-file-earmark-x",
    },
  ];

  // ============================================
  // 13. GIAO DIỆN WEBSITE
  // ============================================

  return (
    <div className="issuer-transactions-page">

      {/* TIÊU ĐỀ */}

      <div className="issuer-transactions-heading mb-4">
        <div>
          <h3>Lịch sử giao dịch Blockchain</h3>

          <p className="text-secondary mb-0">
            Theo dõi các giao dịch cấp phát
            và thu hồi tài liệu.
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
            className="col-6 col-md-4 col-xl-2"
            key={item.title}
          >
            <div className="card h-100">
              <div className="card-body">

                <div
                  className={`issuer-transaction-icon
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

      {/* DANH SÁCH GIAO DỊCH */}

      <div className="card">

        <div className="card-header bg-white">
          <h5>
            <i className="bi bi-clock-history me-2"></i>
            Danh sách giao dịch
          </h5>
        </div>

        <div className="card-body">

          {/* BỘ LỌC */}

          <div className="row g-3 mb-4 align-items-end">

            <div className="col-lg-5">

              <form onSubmit={handleSearch}>

                <label
                  htmlFor="tx-search"
                  className="form-label"
                >
                  Tìm kiếm giao dịch
                </label>

                <div className="input-group">

                  <input
                    id="tx-search"
                    type="text"
                    className="form-control"
                    placeholder="Nhập mã giao dịch hoặc tài liệu"
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
                    <i className="bi bi-search me-1"></i>
                    Tìm kiếm
                  </button>

                </div>
              </form>
            </div>

            {/* LỌC LOẠI GIAO DỊCH */}

            <div className="col-lg-3">

              <label
                htmlFor="tx-action"
                className="form-label"
              >
                Loại giao dịch
              </label>

              <select
                id="tx-action"
                className="form-select"
                value={action}
                disabled={loading}
                onChange={event =>
                  handleActionChange(event.target.value)
                }
              >
                <option value="">Tất cả</option>
                <option value="issue">Cấp phát</option>
                <option value="revoke">Thu hồi</option>
              </select>

            </div>

            {/* LỌC TRẠNG THÁI */}

            <div className="col-lg-3">

              <label
                htmlFor="tx-status"
                className="form-label"
              >
                Trạng thái
              </label>

              <select
                id="tx-status"
                className="form-select"
                value={status}
                disabled={loading}
                onChange={event =>
                  handleStatusChange(event.target.value)
                }
              >
                <option value="">Tất cả</option>
                <option value="confirmed">
                  Đã xác nhận
                </option>
                <option value="pending">
                  Đang xử lý
                </option>
                <option value="failed">
                  Thất bại
                </option>
              </select>

            </div>

            {/* NÚT ĐẶT LẠI */}

            <div className="col-lg-1">

              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={handleReset}
                disabled={loading}
                title="Đặt lại bộ lọc"
                aria-label="Đặt lại bộ lọc"
              >
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>

            </div>

          </div>

          {/* THÔNG BÁO */}

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

          {/* BẢNG GIAO DỊCH */}

          <div className="table-responsive">

            <table className="table table-bordered table-hover align-middle">

              <thead>
                <tr>
                  <th>STT</th>
                  <th>Mã tài liệu</th>
                  <th>Tên tài liệu</th>
                  <th>Loại giao dịch</th>
                  <th>Mã giao dịch</th>
                  <th>Số khối</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
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
                        aria-label="Đang tải"
                      ></div>

                      <p className="mt-2">
                        Đang tải giao dịch...
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

                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-5"
                    >
                      <i className="bi bi-clock-history fs-1 text-secondary"></i>

                      <p className="mt-2">
                        Không tìm thấy giao dịch.
                      </p>
                    </td>
                  </tr>

                ) : (

                  transactions.map((item, index) => {

                    const validHash =
                      typeof item.tx_hash === "string" &&
                      /^0x[a-fA-F0-9]{64}$/.test(
                        item.tx_hash
                      );

                    return (

                      <tr key={item.id}>

                        <td>
                          {(page - 1) * limit + index + 1}
                        </td>

                        <td>
                          <span
                            className="issuer-transaction-code"
                            title={item.document_code}
                          >
                            {item.document_code || "—"}
                          </span>
                        </td>

                        <td className="issuer-transaction-title">
                          {item.document_title || "—"}
                        </td>

                        <td>
                          <TransactionAction
                            action={item.action}
                          />
                        </td>

                        <td>
                          <span
                            className="issuer-transaction-code"
                            title={item.tx_hash}
                          >
                            {item.tx_hash || "—"}
                          </span>
                        </td>

                        <td>
                          {item.block_number ?? "—"}
                        </td>

                        <td>
                          <TransactionStatus
                            status={item.status}
                          />
                        </td>

                        <td>
                          {formatDate(item.created_at)}
                        </td>

                        <td>

                          {validHash ? (
                            <div className="issuer-transaction-actions">

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  handleCopy(item.tx_hash)
                                }
                                title="Sao chép mã giao dịch"
                                aria-label="Sao chép mã giao dịch"
                              >
                                <i className="bi bi-copy"></i>
                              </button>

                              <a
                                href={`https://sepolia.etherscan.io/tx/${item.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary"
                                title="Xem trên Blockchain"
                                aria-label="Xem trên Blockchain"
                              >
                                <i className="bi bi-box-arrow-up-right"></i>
                              </a>

                            </div>

                          ) : (
                            <span className="text-secondary">
                              Chưa có mã
                            </span>
                          )}

                        </td>

                      </tr>

                    );

                  })

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

            Trạng thái giao dịch được lấy từ cơ sở
            dữ liệu. Bạn có thể kiểm tra giao dịch
            trên mạng Ethereum Sepolia bằng liên kết
            tương ứng.
          </div>

        </div>
      </div>

    </div>
  );
}

export default IssuerTransactions;