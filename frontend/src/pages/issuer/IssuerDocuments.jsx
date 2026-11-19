import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import documentApi from "../../api/documentApi.js";
import dashboardApi from "../../api/dashboardApi.js";

import DocumentStatus from "../../components/DocumentStatus.jsx";
import Pagination from "../../components/Pagination.jsx";

import "../../styles/documents.css";
import "../../styles/issuer-documents.css";


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
// 2. TRANG QUẢN LÝ TÀI LIỆU
// ================================================

function IssuerDocuments() {

  const [documents, setDocuments] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statisticsLoading, setStatisticsLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [statisticsError, setStatisticsError] =
    useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedDocumentId, setSelectedDocumentId] =
    useState(null);

  const [selectedDocument, setSelectedDocument] =
    useState(null);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [detailError, setDetailError] = useState("");

  const [copyMessage, setCopyMessage] = useState("");

  const [pagination, setPagination] = useState({

    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,

  });


// ================================================
// 3. LẤY THỐNG KÊ TÀI LIỆU
// ================================================

  useEffect(() => {

    let cancelled = false;

    async function fetchStatistics() {

      try {

        const response =
          await dashboardApi.getIssuerDashboard();

        if (cancelled) return;

        if (!response.success ||
            !response.data?.documents) {

          setStatisticsError(
            "Dữ liệu thống kê không hợp lệ."
          );

          return;

        }

        setStatistics(response.data.documents);

      } catch {

        if (!cancelled) {

          setStatisticsError(
            "Không thể tải thống kê tài liệu."
          );

        }

      } finally {

        if (!cancelled) {

          setStatisticsLoading(false);

        }

      }

    }

    fetchStatistics();

    return () => {

      cancelled = true;

    };

  }, [refreshKey]);


// ================================================
// 4. LẤY DANH SÁCH TÀI LIỆU
// ================================================

  useEffect(() => {

    let cancelled = false;
    let changingPage = false;

    async function fetchDocuments() {

      try {

        const params = {

          search,
          status,
          page,
          limit,

        };

        const response =
          await documentApi.getAll(params);

        if (cancelled) return;

        if (

          !response.success ||
          !Array.isArray(response.data) ||
          !response.pagination

        ) {

          setError(
            "Dữ liệu danh sách tài liệu không hợp lệ."
          );

          return;

        }

        const paging = response.pagination;

        if (

          !Number.isSafeInteger(paging.totalPages) ||
          !Number.isSafeInteger(paging.total) ||
          paging.totalPages < 0 ||
          paging.total < 0 ||
          paging.page !== page ||
          paging.limit !== limit

        ) {

          setError("Thông tin phân trang không hợp lệ.");

          return;

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

        setDocuments(response.data);
        setPagination(paging);

      } catch (err) {

        if (cancelled) return;

        const responseStatus =
          err.response?.status;

        if (responseStatus === 401) {

          setError(
            "Phiên đăng nhập đã hết hạn."
          );

        } else if (responseStatus === 403) {

          setError(
            "Bạn không có quyền truy cập tài liệu."
          );

        } else if (responseStatus === 400) {

          setError(
            "Điều kiện tìm kiếm không hợp lệ."
          );

        } else if (!err.response) {

          setError(
            "Không thể kết nối đến máy chủ."
          );

        } else {

          setError(
            "Không thể tải danh sách tài liệu."
          );

        }

      } finally {

        if (!cancelled && !changingPage) {

          setLoading(false);

        }

      }

    }

    fetchDocuments();

    return () => {

      cancelled = true;

    };

  }, [search, status, page, limit, refreshKey]);


// ================================================
// 5. LẤY CHI TIẾT TÀI LIỆU
// ================================================

  useEffect(() => {

    if (selectedDocumentId === null) return;

    let cancelled = false;

    async function fetchDetail() {

      try {

        const response =
          await documentApi.getById(
            selectedDocumentId
          );

        if (cancelled) return;

        if (

          !response.success ||
          !response.data ||
          Number(response.data.id) !==
            Number(selectedDocumentId)

        ) {

          setDetailError(
            "Thông tin tài liệu không hợp lệ."
          );

          return;

        }

        setSelectedDocument(response.data);

      } catch (err) {

        if (cancelled) return;

        const responseStatus =
          err.response?.status;

        if (responseStatus === 401) {

          setDetailError(
            "Phiên đăng nhập đã hết hạn."
          );

        } else if (responseStatus === 403) {

          setDetailError(
            "Bạn không có quyền xem tài liệu này."
          );

        } else if (responseStatus === 404) {

          setDetailError(
            "Không tìm thấy tài liệu."
          );

        } else {

          setDetailError(
            "Không thể tải thông tin tài liệu."
          );

        }

      } finally {

        if (!cancelled) {

          setDetailLoading(false);

        }

      }

    }

    fetchDetail();

    return () => {

      cancelled = true;

    };

  }, [selectedDocumentId]);


// ================================================
// 6. CHUẨN BỊ TẢI DỮ LIỆU
// ================================================

  function prepareLoading() {

    setLoading(true);
    setError("");

  }


// ================================================
// 7. TÌM KIẾM
// ================================================

  function handleSearch(event) {

    event.preventDefault();

    const keyword = searchInput.trim();

    if (keyword === search && page === 1) {

      return;

    }

    prepareLoading();

    setSearch(keyword);
    setPage(1);

  }


// ================================================
// 8. LỌC TRẠNG THÁI
// ================================================

  function handleStatusChange(value) {

    if (value === status) return;

    prepareLoading();

    setStatus(value);
    setPage(1);

  }


// ================================================
// 9. PHÂN TRANG
// ================================================

  function handlePageChange(value) {

    if (

      value < 1 ||
      value > pagination.totalPages ||
      value === page ||
      loading

    ) return;

    prepareLoading();

    setPage(value);

  }


  function handleLimitChange(value) {

    const newLimit = Number(value);

    if (![10, 20, 50, 100].includes(newLimit)) {

      return;

    }

    if (newLimit === limit) return;

    prepareLoading();

    setLimit(newLimit);
    setPage(1);

  }


// ================================================
// 10. ĐẶT LẠI BỘ LỌC
// ================================================

  function handleReset() {

    setSearchInput("");

    if (

      search === "" &&
      status === "" &&
      page === 1

    ) return;

    prepareLoading();

    setSearch("");
    setStatus("");
    setPage(1);

  }


// ================================================
// 11. LÀM MỚI DỮ LIỆU
// ================================================

  function handleRefresh() {

    prepareLoading();

    setStatisticsLoading(true);
    setStatisticsError("");

    setRefreshKey(
      (previous) => previous + 1
    );

  }


// ================================================
// 12. XEM VÀ ĐÓNG CHI TIẾT
// ================================================

  function handleViewDetail(id) {

    setSelectedDocument(null);
    setDetailError("");
    setCopyMessage("");
    setDetailLoading(true);
    setSelectedDocumentId(id);

  }


  function handleCloseDetail() {

    setSelectedDocumentId(null);
    setSelectedDocument(null);
    setDetailError("");
    setCopyMessage("");

  }


// ================================================
// 13. SAO CHÉP THÔNG TIN
// ================================================

  async function handleCopy(value) {

    if (!value) return;

    try {

      await navigator.clipboard.writeText(value);

      setCopyMessage("Đã sao chép thông tin.");

    } catch {

      setCopyMessage(
        "Không thể sao chép thông tin."
      );

    }

  }


// ================================================
// 14. DANH SÁCH THẺ THỐNG KÊ
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
// 15. KIỂM TRA MÃ GIAO DỊCH
// ================================================

  const transactionHash =
    selectedDocument?.blockchain_tx;

  const explorerUrl =

    typeof transactionHash === "string" &&

    /^0x[a-fA-F0-9]{64}$/.test(transactionHash)

      ? `https://sepolia.etherscan.io/tx/${transactionHash}`

      : null;


// ================================================
// 16. GIAO DIỆN
// ================================================

  return (

    <div className="issuer-documents-page">

      <div inert={selectedDocumentId !== null}>

        {/* TIÊU ĐỀ */}

        <div className="issuer-documents-heading mb-4">

          <div>

            <h3>Quản lý tài liệu</h3>

            <p className="text-secondary mb-0">

              Quản lý các tài liệu thuộc tài khoản
              cấp phát của bạn.

            </p>

          </div>

          <div className="issuer-documents-actions">

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={handleRefresh}
              disabled={loading || statisticsLoading}
            >

              <i className="bi bi-arrow-clockwise me-2"></i>

              Làm mới

            </button>

            <Link
              to="/issuer/documents/issue"
              className="btn btn-primary"
            >

              <i className="bi bi-plus-circle me-2"></i>

              Cấp phát mới

            </Link>

          </div>

        </div>


        {/* LỖI THỐNG KÊ */}

        {statisticsError && (

          <div className="alert alert-warning">

            {statisticsError}

          </div>

        )}


        {/* THẺ THỐNG KÊ */}

        <div className="row g-3 mb-4">

          {statisticCards.map((item) => (

            <div
              className="col-6 col-md-4 col-xl"
              key={item.title}
            >

              <div className="card h-100">

                <div className="card-body">

                  <div
                    className={
                      `issuer-document-stat-icon
                       bg-${item.color}-subtle
                       text-${item.color}`
                    }
                  >

                    <i className={`bi ${item.icon}`}></i>

                  </div>

                  <p className="text-secondary mt-3 mb-2">

                    {item.title}

                  </p>

                  <h3 className={`text-${item.color}`}>

                    {statisticsLoading || statisticsError

                      ? "—"

                      : item.value ?? "—"}

                  </h3>

                </div>

              </div>

            </div>

          ))}

        </div>


        {/* DANH SÁCH TÀI LIỆU */}

        <div className="card">

          <div className="card-header bg-white">

            <h5>

              <i className="bi bi-folder2-open me-2"></i>

              Danh sách tài liệu

            </h5>

          </div>

          <div className="card-body">


            {/* BỘ LỌC */}

            <div className="row g-3 mb-4 align-items-end">

              <div className="col-lg-6">

                <form onSubmit={handleSearch}>

                  <label
                    htmlFor="issuer-search"
                    className="form-label"
                  >

                    Tìm kiếm tài liệu

                  </label>

                  <div className="input-group">

                    <input
                      id="issuer-search"
                      type="text"
                      className="form-control"
                      placeholder="Nhập mã hoặc tên tài liệu"
                      maxLength={255}
                      value={searchInput}
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

              </div>


              {/* TRẠNG THÁI */}

              <div className="col-lg-4">

                <label
                  htmlFor="issuer-status"
                  className="form-label"
                >

                  Trạng thái

                </label>

                <select
                  id="issuer-status"
                  className="form-select"
                  value={status}
                  disabled={loading}
                  onChange={(event) =>
                    handleStatusChange(event.target.value)
                  }
                >

                  <option value="">
                    Tất cả trạng thái
                  </option>

                  <option value="issued">
                    Đã cấp phát
                  </option>

                  <option value="revoked">
                    Đã thu hồi
                  </option>

                  <option value="pending">
                    Đang xử lý
                  </option>

                  <option value="failed">
                    Thất bại
                  </option>

                </select>

              </div>


              {/* ĐẶT LẠI */}

              <div className="col-lg-2">

                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={handleReset}
                  disabled={loading}
                >

                  <i className="bi bi-arrow-counterclockwise me-1"></i>

                  Đặt lại

                </button>

              </div>

            </div>


            {/* THÔNG BÁO LỖI */}

            {error && (

              <div className="alert alert-danger">

                {error}

              </div>

            )}


            {/* BẢNG TÀI LIỆU */}

            <div className="table-responsive">

              <table className="table table-bordered table-hover align-middle">

                <thead>

                  <tr>

                    <th>STT</th>
                    <th>Mã tài liệu</th>
                    <th>Tên tài liệu</th>
                    <th>Loại tài liệu</th>
                    <th>Trạng thái</th>
                    <th>Ngày cấp phát</th>
                    <th>Thao tác</th>

                  </tr>

                </thead>

                <tbody>

                  {loading ? (

                    <tr>

                      <td
                        colSpan={7}
                        className="text-center py-5"
                      >

                        <div
                          className="spinner-border text-primary"
                          role="status"
                          aria-label="Đang tải"
                        ></div>

                        <p className="mt-2 mb-0">

                          Đang tải tài liệu...

                        </p>

                      </td>

                    </tr>

                  ) : error ? (

                    <tr>

                      <td
                        colSpan={7}
                        className="text-center py-4"
                      >

                        Không thể hiển thị dữ liệu.

                      </td>

                    </tr>

                  ) : documents.length === 0 ? (

                    <tr>

                      <td
                        colSpan={7}
                        className="text-center py-5"
                      >

                        <i className="bi bi-folder2-open fs-1 text-secondary"></i>

                        <p className="mt-2 mb-0">

                          Không tìm thấy tài liệu.

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
                            className="issuer-list-code"
                            title={item.document_code}
                          >

                            {item.document_code}

                          </span>

                        </td>

                        <td className="issuer-list-title">

                          {item.title}

                        </td>

                        <td>

                          {item.document_type || "—"}

                        </td>

                        <td>

                          <DocumentStatus
                            status={item.status}
                          />

                        </td>

                        <td>

                          {formatDate(item.issued_at)}

                        </td>

                        <td>

                          <div className="issuer-row-actions">

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                handleViewDetail(item.id)
                              }
                              title="Xem chi tiết tài liệu"
                            >

                              <i className="bi bi-eye me-1"></i>

                              Chi tiết

                            </button>

                            {item.status === "issued" && (

                              <Link
                                to={
                                  "/issuer/documents/revoke?code=" +
                                  encodeURIComponent(
                                    item.document_code
                                  )
                                }
                                className="btn btn-sm btn-outline-danger"
                                title="Thu hồi tài liệu"
                              >

                                <i className="bi bi-file-earmark-x me-1"></i>

                                Thu hồi

                              </Link>

                            )}

                          </div>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>


            {/* PHÂN TRANG */}

            {!error && (

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

          </div>

        </div>

      </div>


      {/* ==========================================
          HỘP THOẠI CHI TIẾT TÀI LIỆU
      ========================================== */}

      {selectedDocumentId !== null && (

        <div className="issuer-detail-overlay">

          <div
            className="issuer-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="issuer-detail-title"
          >

            <div className="issuer-detail-header">

              <h5 id="issuer-detail-title">

                <i className="bi bi-file-earmark-text me-2"></i>

                Chi tiết tài liệu

              </h5>

              <button
                type="button"
                className="btn-close"
                onClick={handleCloseDetail}
                aria-label="Đóng"
              ></button>

            </div>


            <div className="issuer-detail-body">

              {detailLoading ? (

                <div className="text-center py-4">

                  <div
                    className="spinner-border text-primary"
                    role="status"
                    aria-label="Đang tải"
                  ></div>

                  <p className="mt-2">

                    Đang tải thông tin...

                  </p>

                </div>

              ) : detailError ? (

                <div className="alert alert-danger">

                  {detailError}

                </div>

              ) : selectedDocument && (

                <>

                  <table className="table issuer-detail-table">

                    <tbody>

                      <tr>

                        <th>Mã tài liệu</th>

                        <td>

                          <span className="issuer-full-code">

                            {selectedDocument.document_code}

                          </span>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary ms-2"
                            onClick={() =>
                              handleCopy(
                                selectedDocument.document_code
                              )
                            }
                            aria-label="Sao chép mã tài liệu"
                          >

                            <i className="bi bi-copy"></i>

                          </button>

                        </td>

                      </tr>

                      <tr>

                        <th>Tên tài liệu</th>

                        <td>{selectedDocument.title}</td>

                      </tr>

                      <tr>

                        <th>Loại tài liệu</th>

                        <td>

                          {selectedDocument.document_type || "—"}

                        </td>

                      </tr>

                      <tr>

                        <th>Đơn vị cấp phát</th>

                        <td>

                          {selectedDocument.organization_name || "—"}

                        </td>

                      </tr>

                      <tr>

                        <th>Người cấp phát</th>

                        <td>

                          {selectedDocument.issuer_name || "—"}

                        </td>

                      </tr>

                      <tr>

                        <th>Trạng thái</th>

                        <td>

                          <DocumentStatus
                            status={selectedDocument.status}
                          />

                        </td>

                      </tr>

                      <tr>

                        <th>Ngày cấp phát</th>

                        <td>

                          {formatDate(
                            selectedDocument.issued_at
                          )}

                        </td>

                      </tr>

                      <tr>

                        <th>Mã SHA-256</th>

                        <td>

                          <span className="issuer-full-code">

                            {selectedDocument.file_hash || "—"}

                          </span>

                          {selectedDocument.file_hash && (

                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary ms-2"
                              onClick={() =>
                                handleCopy(
                                  selectedDocument.file_hash
                                )
                              }
                              aria-label="Sao chép mã SHA-256"
                            >

                              <i className="bi bi-copy"></i>

                            </button>

                          )}

                        </td>

                      </tr>

                      <tr>

                        <th>Mã giao dịch cấp phát</th>

                        <td>

                          <span className="issuer-full-code">

                            {transactionHash || "—"}

                          </span>

                          {explorerUrl && (

                            <div className="mt-2">

                              <a
                                href={explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >

                                Xem trên Blockchain

                                <i className="bi bi-box-arrow-up-right ms-2"></i>

                              </a>

                            </div>

                          )}

                        </td>

                      </tr>

                      <tr>

                        <th>Mạng Blockchain</th>

                        <td>Ethereum Sepolia</td>

                      </tr>

                    </tbody>

                  </table>


                  {copyMessage && (

                    <p
                      className="small text-secondary"
                      role="status"
                    >

                      {copyMessage}

                    </p>

                  )}


                  <div className="alert alert-info mb-0">

                    <i className="bi bi-info-circle me-2"></i>

                    Thông tin trên được lấy từ cơ sở dữ liệu.

                    Để kiểm tra giao dịch thực tế, hãy truy cập

                    Blockchain thông qua liên kết giao dịch.

                  </div>

                </>

              )}

            </div>


            <div className="issuer-detail-footer">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCloseDetail}
              >

                Đóng

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}

export default IssuerDocuments;