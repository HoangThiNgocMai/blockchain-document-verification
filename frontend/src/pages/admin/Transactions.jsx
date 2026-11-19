import { useState, useEffect } from "react";

import transactionApi from "../../api/transactionApi.js";
import organizationApi from "../../api/organizationApi.js";

import TransactionStatus from "../../components/TransactionStatus.jsx";
import TransactionAction from "../../components/TransactionAction.jsx";
import TransactionDetail from "../../components/TransactionDetail.jsx";
import Pagination from "../../components/Pagination.jsx";

import "../../styles/transactions.css";


// ================================================
// 1. ĐỊNH DẠNG THỜI GIAN
// ================================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("vi-VN");
}


// ================================================
// 2. LIÊN KẾT ETHERSCAN
// ================================================

function TransactionHash({ hash }) {

  if (!hash) return <span>—</span>;

  const validHash = /^0x[a-fA-F0-9]{64}$/.test(hash);

  return (
    <div className="transaction-hash-box">

      <span
        className="transaction-hash"
        title={hash}
      >
        {hash}
      </span>

      {validHash && (
        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="transaction-link"
        >
          Etherscan
          <i className="bi bi-box-arrow-up-right ms-1"></i>
        </a>
      )}

    </div>
  );
}


// ================================================
// 3. TRANG QUẢN LÝ GIAO DỊCH
// ================================================

function Transactions() {

  // State xem chi tiết giao dịch (thêm mới)
  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [transactions, setTransactions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [error, setError] = useState("");
  const [metadataError, setMetadataError] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [action, setAction] = useState("");
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


  // ==============================================
  // 4. LẤY THỐNG KÊ VÀ DANH SÁCH ĐƠN VỊ
  // ==============================================

  useEffect(() => {

    let cancelled = false;

    async function fetchMetadata() {

      try {

        const [statsResponse, orgResponse] =
          await Promise.all([

            transactionApi.getStatistics(),

            organizationApi.getAll(),

          ]);

        if (cancelled) return;

        if (
          !statsResponse.success ||
          !statsResponse.data ||
          !orgResponse.success ||
          !Array.isArray(orgResponse.data)
        ) {

          setMetadataError(
            "Dữ liệu thống kê hoặc đơn vị không hợp lệ."
          );

          return;
        }

        setStatistics(statsResponse.data);
        setOrganizations(orgResponse.data);

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


  // ==============================================
  // 5. LẤY DANH SÁCH GIAO DỊCH
  // ==============================================

  useEffect(() => {

    let cancelled = false;

    async function fetchTransactions() {

      let changingPage = false;

      try {

        const params = {

          search,
          action,
          status,
          page,
          limit,

        };

        if (organizationId) {

          params.organizationId = Number(organizationId);

        }

        const response = await transactionApi.getAll(params);

        if (cancelled) return;

        if (
          !response.success ||
          !Array.isArray(response.data) ||
          !response.pagination
        ) {

          setError("Dữ liệu giao dịch không hợp lệ.");

          return;
        }

        const result = response.pagination;

        if (
          !Number.isSafeInteger(result.total) ||
          result.total < 0 ||
          !Number.isSafeInteger(result.totalPages) ||
          result.totalPages < 0 ||
          result.page !== page ||
          result.limit !== limit
        ) {

          setError("Dữ liệu phân trang không hợp lệ.");

          return;
        }

        const lastPage = Math.max(1, result.totalPages);

        if (page > lastPage) {

          changingPage = true;

          setPage(lastPage);

          return;
        }

        setTransactions(response.data);
        setPagination(result);

      } catch (err) {

        if (cancelled) return;

        const code = err.response?.status;

        if (code === 400) {

          setError("Tham số tìm kiếm không hợp lệ.");

        } else if (code === 401) {

          setError("Phiên đăng nhập đã hết hạn.");

        } else if (code === 403) {

          setError("Bạn không có quyền truy cập.");

        } else if (!err.response) {

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

  }, [
    search,
    action,
    status,
    organizationId,
    page,
    limit,
    refreshKey,
  ]);


  // ==============================================
  // 6. CHUẨN BỊ TẢI DỮ LIỆU
  // ==============================================

  function prepareLoading() {

    setLoading(true);
    setError("");

  }


  // ==============================================
  // 7. TÌM KIẾM
  // ==============================================

  function handleSearch(event) {

    event.preventDefault();

    const keyword = searchInput.trim();

    if (keyword === search && page === 1) return;

    prepareLoading();

    setSearch(keyword);
    setPage(1);

  }


  // ==============================================
  // 8. LỌC LOẠI GIAO DỊCH
  // ==============================================

  function handleActionChange(value) {

    if (value === action) return;

    prepareLoading();

    setAction(value);
    setPage(1);

  }


  // ==============================================
  // 9. LỌC TRẠNG THÁI
  // ==============================================

  function handleStatusChange(value) {

    if (value === status) return;

    prepareLoading();

    setStatus(value);
    setPage(1);

  }


  // ==============================================
  // 10. LỌC ĐƠN VỊ
  // ==============================================

  function handleOrganizationChange(value) {

    if (value === organizationId) return;

    prepareLoading();

    setOrganizationId(value);
    setPage(1);

  }


  // ==============================================
  // 11. PHÂN TRANG
  // ==============================================

  function handlePageChange(value) {

    if (value === page) return;

    prepareLoading();

    setPage(value);

  }

  function handleLimitChange(value) {

    if (value === limit) return;

    prepareLoading();

    setLimit(value);
    setPage(1);

  }


  // ==============================================
  // 12. XÓA BỘ LỌC
  // ==============================================

  function handleReset() {

    setSearchInput("");

    if (
      !search &&
      !action &&
      !status &&
      !organizationId &&
      page === 1
    ) return;

    prepareLoading();

    setSearch("");
    setAction("");
    setStatus("");
    setOrganizationId("");
    setPage(1);

  }


  // ==============================================
  // 13. LÀM MỚI DỮ LIỆU
  // ==============================================

  function handleRefresh() {

  prepareLoading();

  setMetadataLoading(true);
  setMetadataError("");

  setRefreshKey((previous) => previous + 1);

}


// ================================================
// XEM CHI TIẾT GIAO DỊCH
// ================================================

function handleViewDetail(item) {

  setSelectedTransaction({
    type: item.transaction_type,
    id: item.id,
  });

}


// ================================================
// ĐÓNG CHI TIẾT GIAO DỊCH
// ================================================

function handleCloseDetail() {

  setSelectedTransaction(null);

}


  // ==============================================
  // 14. THẺ THỐNG KÊ
  // ==============================================

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

  ];


  // ==============================================
  // 15. THỐNG KÊ THEO LOẠI GIAO DỊCH
  // ==============================================

  const actionStatistics = [

    {
      label: "Cấp phát tài liệu",
      value: statistics?.issue ?? 0,
      color: "primary",
    },

    {
      label: "Thu hồi tài liệu",
      value: statistics?.revoke ?? 0,
      color: "danger",
    },

    {
      label: "Cấp quyền đơn vị",
      value: statistics?.authorize ?? 0,
      color: "success",
    },

    {
      label: "Thu hồi quyền đơn vị",
      value: statistics?.deauthorize ?? 0,
      color: "warning",
    },

  ];


  // ==============================================
  // 16. GIAO DIỆN
  // ==============================================

  return (

  <div className="transactions-page">

    {selectedTransaction !== null && (

      <TransactionDetail
        key={`${selectedTransaction.type}-${selectedTransaction.id}`}
        type={selectedTransaction.type}
        id={selectedTransaction.id}
        onClose={handleCloseDetail}
      />

    )}

    <div inert={selectedTransaction !== null}>

    {/* TIÊU ĐỀ */}

      <div className="transactions-heading mb-4">

        <div>

          <h3 className="fw-bold mb-2">
            Quản lý giao dịch Blockchain
          </h3>

          <p className="text-secondary mb-0">
            Theo dõi các giao dịch tài liệu và đơn vị
            cấp phát trong hệ thống.
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


      {/* THẺ THỐNG KÊ */}

      <div className="row g-3 mb-4">

        {statisticCards.map((item) => (

          <div
            className="col-12 col-sm-6 col-xl-3"
            key={item.title}
          >

            <div className="card h-100">

              <div className="card-body">

                <div
                  className={`transaction-stat-icon
                    bg-${item.color}-subtle
                    text-${item.color} mb-3`}
                >
                  <i className={`bi ${item.icon}`}></i>
                </div>

                <p className="text-secondary small mb-2">
                  {item.title}
                </p>

                <h3 className={`fw-bold text-${item.color}`}>
                  {metadataLoading || metadataError
                    ? "—"
                    : item.value ?? "—"}
                </h3>

              </div>

            </div>

          </div>

        ))}

      </div>


      {/* THÔNG BÁO LỖI */}

      {metadataError && (

        <div className="alert alert-warning">
          {metadataError}
        </div>

      )}

      {error && (

        <div className="alert alert-danger">
          {error}
        </div>

      )}

      {!metadataError &&
        !metadataLoading &&
        statistics?.unknown > 0 && (

        <div className="alert alert-warning">

          Có {statistics.unknown} giao dịch
          chưa xác định trạng thái.

        </div>

      )}


      {/* BIỂU ĐỒ THỐNG KÊ */}

      <div className="card mb-4">

        <div className="card-header bg-white py-3">

          <h5 className="mb-0">
            Thống kê theo loại giao dịch
          </h5>

        </div>

        <div className="card-body">

          {metadataLoading ? (

            <p className="text-secondary mb-0">
              Đang tải thống kê...
            </p>

          ) : metadataError ? (

            <p className="text-secondary mb-0">
              Không thể hiển thị thống kê.
            </p>

          ) : (

            actionStatistics.map((item) => {

              const percent = statistics?.total > 0

                ? Math.min(
                    100,
                    Math.max(
                      0,
                      item.value / statistics.total * 100
                    )
                  )

                : 0;

              return (

                <div
                  className="transaction-chart-row"
                  key={item.label}
                >

                  <span className="transaction-chart-label">
                    {item.label}
                  </span>

                  <div
                    className="progress flex-grow-1"
                    role="progressbar"
                    aria-label={item.label}
                    aria-valuenow={percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >

                    <div
                      className={`progress-bar bg-${item.color}`}
                      style={{ width: `${percent}%` }}
                    ></div>

                  </div>

                  <strong className="transaction-chart-value">
                    {item.value}
                  </strong>

                </div>

              );

            })

          )}

        </div>

      </div>


      {/* DANH SÁCH GIAO DỊCH */}

      <div className="card">

        <div className="card-header bg-white py-3">

          <h5 className="mb-0">
            Danh sách giao dịch
          </h5>

        </div>

        <div className="card-body">

          {/* TÌM KIẾM */}

          <form
            onSubmit={handleSearch}
            className="mb-3"
          >

            <label
              htmlFor="transaction-search"
              className="form-label"
            >
              Tìm kiếm giao dịch
            </label>

            <div className="input-group">

              <input
                id="transaction-search"
                type="text"
                className="form-control"
                placeholder="Nhập mã giao dịch, mã tài liệu hoặc tên đơn vị..."
                value={searchInput}
                maxLength={255}
                onChange={(event) =>
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


          {/* BỘ LỌC */}

          <div className="row g-3 mb-3">

            <div className="col-md-4">

              <label
                htmlFor="transaction-action"
                className="form-label"
              >
                Loại giao dịch
              </label>

              <select
                id="transaction-action"
                className="form-select"
                value={action}
                disabled={loading}
                onChange={(event) =>
                  handleActionChange(event.target.value)
                }
              >

                <option value="">Tất cả loại giao dịch</option>

                <option value="issue">Cấp phát tài liệu</option>

                <option value="revoke">Thu hồi tài liệu</option>

                <option value="authorize">Cấp quyền đơn vị</option>

                <option value="deauthorize">
                  Thu hồi quyền đơn vị
                </option>

              </select>

            </div>


            <div className="col-md-4">

              <label
                htmlFor="transaction-status"
                className="form-label"
              >
                Trạng thái
              </label>

              <select
                id="transaction-status"
                className="form-select"
                value={status}
                disabled={loading}
                onChange={(event) =>
                  handleStatusChange(event.target.value)
                }
              >

                <option value="">Tất cả trạng thái</option>

                <option value="confirmed">Đã xác nhận</option>

                <option value="pending">Đang xử lý</option>

                <option value="failed">Thất bại</option>

              </select>

            </div>


            <div className="col-md-4">

              <label
                htmlFor="transaction-organization"
                className="form-label"
              >
                Đơn vị cấp phát
              </label>

              <select
                id="transaction-organization"
                className="form-select"
                value={organizationId}
                disabled={loading || metadataLoading}
                onChange={(event) =>
                  handleOrganizationChange(event.target.value)
                }
              >

                <option value="">Tất cả đơn vị</option>

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

          </div>


          {/* XÓA BỘ LỌC */}

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary mb-3"
            onClick={handleReset}
            disabled={loading}
          >
            <i className="bi bi-x-circle me-2"></i>
            Xóa bộ lọc
          </button>


          {/* BẢNG GIAO DỊCH */}

          <div className="table-responsive">

            <table className="table table-bordered
                              table-hover align-middle
                              transactions-table">

              <thead className="table-light">

                <tr>

                  <th>STT</th>
                  <th>Loại giao dịch</th>
                  <th>Đơn vị</th>
                  <th>Tài liệu</th>
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

                    <td colSpan={9} className="text-center py-5">

                      <div
                        className="spinner-border text-primary"
                        role="status"
                        aria-label="Đang tải"
                      ></div>

                      <p className="text-secondary mt-3 mb-0">
                        Đang tải danh sách giao dịch...
                      </p>

                    </td>

                  </tr>

                ) : error ? (

                  <tr>

                    <td colSpan={9} className="text-center py-4">
                      Không thể hiển thị dữ liệu.
                    </td>

                  </tr>

                ) : transactions.length === 0 ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="text-center text-secondary py-5"
                    >

                      <i className="bi bi-inbox fs-2"></i>

                      <p className="mt-2 mb-0">
                        Không tìm thấy giao dịch phù hợp.
                      </p>

                    </td>

                  </tr>

                ) : (

                  transactions.map((item, index) => (

                    <tr key={`${item.transaction_type}-${item.id}`}>

                      <td>
                        {(page - 1) * limit + index + 1}
                      </td>

                      <td>

                        <TransactionAction action={item.action} />

                      </td>

                      <td className="transaction-organization">

                        {item.organization_name || "—"}

                      </td>

                      <td className="transaction-document">

                        {item.document_title || "—"}

                      </td>

                      <td>

                        <TransactionHash hash={item.tx_hash} />

                      </td>

                      <td>

                        {item.block_number ?? "—"}

                      </td>

                      <td>

                        <TransactionStatus status={item.status} />

                      </td>

                      <td>

                        {formatDate(item.created_at)}

                      </td>

                      <td>

                        <button
  type="button"
  className="btn btn-sm btn-outline-primary"
  title="Xem chi tiết giao dịch"
  onClick={() => handleViewDetail(item)}
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

      <p className="small text-secondary mt-3">

        <i className="bi bi-info-circle me-2"></i>

        Trạng thái giao dịch được lấy từ cơ sở dữ liệu
        của hệ thống.

            </p>

      </div>

    </div>

  );

}

export default Transactions;