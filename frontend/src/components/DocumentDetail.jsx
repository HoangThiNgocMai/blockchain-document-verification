import { useState, useEffect } from "react";

import documentApi from "../api/documentApi.js";

import DocumentStatus from "./DocumentStatus.jsx";

import Pagination from "./Pagination.jsx";


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
// 2. XỬ LÝ THÔNG BÁO LỖI
// ================================================

function getErrorMessage(error) {

  const status = error.response?.status;

  if (status === 401) {
    return "Phiên đăng nhập đã hết hạn.";
  }

  if (status === 403) {
    return "Bạn không có quyền truy cập tài liệu.";
  }

  if (status === 404) {
    return "Không tìm thấy tài liệu.";
  }

  if (!error.response) {
    return "Không thể kết nối đến máy chủ.";
  }

  return "Không thể tải thông tin tài liệu.";

}


// ================================================
// 3. HIỂN THỊ TRẠNG THÁI GIAO DỊCH
// ================================================

function TransactionStatus({ status }) {

  const statuses = {

    confirmed: {
      label: "Đã xác nhận",
      color: "success",
    },

    pending: {
      label: "Đang xử lý",
      color: "warning",
    },

    failed: {
      label: "Thất bại",
      color: "danger",
    },

  };

  const item = statuses[status] || {
    label: "Chưa xác định",
    color: "secondary",
  };

  return (

    <span className={`badge text-bg-${item.color}`}>

      {item.label}

    </span>

  );

}


// ================================================
// 4. HIỂN THỊ KẾT QUẢ XÁC THỰC
// ================================================

function VerificationStatus({ result }) {

  const statuses = {

    valid: {
      label: "Hợp lệ",
      color: "success",
    },

    mismatch: {
      label: "Không khớp",
      color: "danger",
    },

    revoked: {
      label: "Đã thu hồi",
      color: "danger",
    },

    not_found: {
      label: "Không tìm thấy",
      color: "secondary",
    },

    lookup_only: {
      label: "Chỉ tra cứu",
      color: "info",
    },

    unauthorized_issuer: {
      label: "Đơn vị không được cấp quyền",
      color: "warning",
    },

    error: {
      label: "Lỗi xác thực",
      color: "danger",
    },

  };

  const item = statuses[result] || {
    label: "Chưa xác định",
    color: "secondary",
  };

  return (

    <span className={`badge text-bg-${item.color}`}>

      {item.label}

    </span>

  );

}


// ================================================
// 5. LIÊN KẾT ETHERSCAN
// ================================================

function TransactionLink({ hash }) {

  if (!hash) {

    return <span className="text-secondary">Chưa có</span>;

  }

  const validHash =
    /^0x[a-fA-F0-9]{64}$/.test(hash);

  return (

    <div className="document-hash">

      <div className="document-hash-value">

        {hash}

      </div>

      {validHash && (

        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="small text-decoration-none"
        >

          Xem trên Etherscan

          <i className="bi bi-box-arrow-up-right ms-2"></i>

        </a>

      )}

    </div>

  );

}


// ================================================
// 6. HIỂN THỊ MÃ VÀ NÚT SAO CHÉP
// ================================================

function CopyValue({ value }) {

  const [message, setMessage] = useState("");

  async function handleCopy() {

    try {

      await navigator.clipboard.writeText(value);

      setMessage("Đã sao chép");

    } catch {

      setMessage("Không thể sao chép tự động.");

    }

  }

  if (!value) return <span>—</span>;

  return (

    <div>

      <div className="document-copy-value">

        <span className="document-hash-value">

          {value}

        </span>

        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={handleCopy}
          aria-label="Sao chép nội dung"
        >

          <i className="bi bi-copy me-1"></i>

          Sao chép

        </button>

      </div>

      {message && (

        <small
          className="text-secondary"
          role="status"
        >

          {message}

        </small>

      )}

    </div>

  );

}


// ================================================
// 7. THÔNG TIN CHI TIẾT TÀI LIỆU
// ================================================

function DocumentInformation({ document }) {

  const information = [

    ["Tên tài liệu", document.title],

    ["Loại tài liệu", document.document_type],

    ["Đơn vị cấp phát", document.organization_name],

    ["Người cấp phát", document.issuer_name],

    ["Ngày tạo", formatDate(document.created_at)],

    ["Ngày cấp phát", formatDate(document.issued_at)],

  ];

  return (

    <>

      <h6 className="fw-bold text-primary mb-3">

        Thông tin tài liệu

      </h6>

      <div className="document-information">

        {information.map(([label, value]) => (

          <div
            className="document-information-row"
            key={label}
          >

            <span>{label}</span>

            <strong>{value || "—"}</strong>

          </div>

        ))}

        <div className="document-information-row">

          <span>Trạng thái</span>

          <DocumentStatus status={document.status} />

        </div>

      </div>


      {/* THÔNG TIN BLOCKCHAIN */}

      <h6 className="fw-bold text-primary mt-4 mb-3">

        <i className="bi bi-link-45deg me-2"></i>

        Thông tin Blockchain

      </h6>

      <div className="document-blockchain-info">

        <div className="mb-3">

          <label className="fw-medium mb-2">

            Mã tài liệu

          </label>

          <CopyValue value={document.document_code} />

        </div>

        <hr />

        <div className="mb-3">

          <label className="fw-medium mb-2">

            Mã băm SHA-256

          </label>

          <CopyValue value={document.file_hash} />

        </div>

        <hr />

        <div className="mb-3">

          <label className="fw-medium mb-2">

            Địa chỉ ví hiện tại của đơn vị

          </label>

          <CopyValue value={document.wallet_address} />

        </div>

        <hr />

        <div className="mb-3">

          <label className="fw-medium mb-2">

            Mã giao dịch cấp phát

          </label>

          <TransactionLink
            hash={document.blockchain_tx}
          />

        </div>

        <div className="document-information-row">

          <span>Mạng Blockchain của hệ thống</span>

          <strong>Ethereum Sepolia</strong>

        </div>

      </div>

      <div className="alert alert-info small mt-3 mb-0">

        <i className="bi bi-info-circle me-2"></i>

        Thông tin trên được truy vấn từ cơ sở dữ liệu.
        Đây không phải kết quả xác thực trực tiếp
        trên Blockchain.

      </div>

    </>

  );

}


// ================================================
// 8. LỊCH SỬ GIAO DỊCH
// ================================================

function DocumentTransactions({ documentId }) {

  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {

    let cancelled = false;

    async function fetchTransactions() {

      try {

        const response =
          await documentApi.getTransactions(documentId);

        if (cancelled) return;

        if (
          !response.success ||
          !Array.isArray(response.data)
        ) {

          setError("Dữ liệu giao dịch không hợp lệ.");

          return;

        }

        setTransactions(response.data);

      } catch (err) {

        if (!cancelled) {

          setError(getErrorMessage(err));

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }

    fetchTransactions();

    return () => {

      cancelled = true;

    };

  }, [documentId]);


  if (loading) {

    return (

      <p className="text-center py-4 text-secondary">

        Đang tải lịch sử giao dịch...

      </p>

    );

  }

  if (error) {

    return <div className="alert alert-danger">{error}</div>;

  }

  if (transactions.length === 0) {

    return (

      <p className="text-center py-4 text-secondary">

        Chưa có giao dịch Blockchain.

      </p>

    );

  }

  return (

    <div>

      <h6 className="fw-bold text-primary mb-3">

        Lịch sử giao dịch Blockchain

      </h6>

      <div className="table-responsive">

        <table className="table table-bordered
                          align-middle document-history-table">

          <thead className="table-light">

            <tr>

              <th>STT</th>

              <th>Thao tác</th>

              <th>Mã giao dịch</th>

              <th>Số khối</th>

              <th>Trạng thái</th>

              <th>Thời gian</th>

            </tr>

          </thead>

          <tbody>

            {transactions.map((item, index) => (

              <tr key={item.id}>

                <td>{index + 1}</td>

                <td>

                  {item.action === "issue"
                    ? "Cấp phát"
                    : item.action === "revoke"
                    ? "Thu hồi"
                    : "Chưa xác định"}

                </td>

                <td>

                  <TransactionLink hash={item.tx_hash} />

                </td>

                <td>{item.block_number ?? "—"}</td>

                <td>

                  <TransactionStatus status={item.status} />

                </td>

                <td>{formatDate(item.created_at)}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <p className="small text-secondary mb-0">

        Tổng số giao dịch: {transactions.length}

      </p>

    </div>

  );

}


// ================================================
// 9. LỊCH SỬ XÁC THỰC
// ================================================

function DocumentVerifications({ documentId }) {

  const [verifications, setVerifications] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [page, setPage] = useState(1);

  const [limit, setLimit] = useState(10);

  const [pagination, setPagination] = useState({

    page: 1,

    limit: 10,

    total: 0,

    totalPages: 0,

  });


  useEffect(() => {

    let cancelled = false;

    async function fetchVerifications() {

      let changingPage = false;

      try {

        const response =
          await documentApi.getVerifications(
            documentId,
            { page, limit }
          );

        if (cancelled) return;

        if (
          !response.success ||
          !Array.isArray(response.data) ||
          !Number.isSafeInteger(response.pagination?.total) ||
          response.pagination.total < 0 ||
          !Number.isSafeInteger(response.pagination?.totalPages) ||
          response.pagination.totalPages < 0 ||
          response.pagination.page !== page ||
          response.pagination.limit !== limit
        ) {

          setError("Dữ liệu xác thực không hợp lệ.");

          return;

        }

        const lastPage = Math.max(
          1,
          response.pagination.totalPages
        );

        if (page > lastPage) {

          changingPage = true;

          setPage(lastPage);

          return;

        }

        setVerifications(response.data);

        setPagination(response.pagination);

      } catch (err) {

        if (!cancelled) {

          setError(getErrorMessage(err));

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

  }, [documentId, page, limit]);


  function handlePageChange(value) {

    if (value === page) return;

    setLoading(true);

    setError("");

    setPage(value);

  }


  function handleLimitChange(value) {

    if (value === limit) return;

    setLoading(true);

    setError("");

    setLimit(value);

    setPage(1);

  }


  if (loading) {

    return (

      <p className="text-center py-4 text-secondary">

        Đang tải lịch sử xác thực...

      </p>

    );

  }

  if (error) {

    return <div className="alert alert-danger">{error}</div>;

  }

  return (

    <div>

      <h6 className="fw-bold text-primary mb-3">

        Lịch sử xác thực tài liệu

      </h6>

      <div className="table-responsive">

        <table className="table table-bordered
                          align-middle document-history-table">

          <thead className="table-light">

            <tr>

              <th>STT</th>

              <th>Mã tài liệu tra cứu</th>

              <th>Kết quả</th>

              <th>Thời gian</th>

            </tr>

          </thead>

          <tbody>

            {verifications.length === 0 ? (

              <tr>

                <td
                  colSpan={4}
                  className="text-center py-4 text-secondary"
                >

                  Chưa có lịch sử xác thực.

                </td>

              </tr>

            ) : (

              verifications.map((item, index) => (

                <tr key={item.id}>

                  <td>

                    {(page - 1) * limit + index + 1}

                  </td>

                  <td className="document-hash-value">

                    {item.searched_code || "—"}

                  </td>

                  <td>

                    <VerificationStatus result={item.result} />

                  </td>

                  <td>

                    {formatDate(item.verified_at)}

                  </td>

                </tr>

              ))

            )}

          </tbody>

        </table>

      </div>

      <Pagination
        page={pagination.page}
        limit={pagination.limit}
        total={pagination.total}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        loading={loading}
      />

    </div>

  );

}


// ================================================
// 10. COMPONENT CHI TIẾT TÀI LIỆU
// ================================================

function DocumentDetail({ documentId, onClose }) {

  const [document, setDocument] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("information");


  useEffect(() => {

    let cancelled = false;

    async function fetchDocument() {

      try {

        const response =
          await documentApi.getById(documentId);

        if (cancelled) return;

        if (
          !response.success ||
          !response.data ||
          String(response.data.id) !== String(documentId)
        ) {

          setError("Dữ liệu tài liệu không hợp lệ.");

          return;

        }

        setDocument(response.data);

      } catch (err) {

        if (!cancelled) {

          setError(getErrorMessage(err));

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }

    fetchDocument();

    return () => {

      cancelled = true;

    };

  }, [documentId]);


  const tabs = [

    {
      id: "information",
      label: "Thông tin tài liệu",
      icon: "bi-file-earmark-text",
    },

    {
      id: "transactions",
      label: "Lịch sử giao dịch",
      icon: "bi-link-45deg",
    },

    {
      id: "verifications",
      label: "Lịch sử xác thực",
      icon: "bi-shield-check",
    },

  ];


  return (

    <div className="document-detail-overlay">

      <div
        className="document-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-detail-title"
      >

        {/* TIÊU ĐỀ */}

        <div className="document-detail-header">

          <h5
            id="document-detail-title"
            className="fw-bold mb-0"
          >

            <i className="bi bi-file-earmark-text me-2"></i>

            Chi tiết tài liệu

          </h5>

          <button
            type="button"
            className="btn-close"
            aria-label="Đóng"
            onClick={onClose}
          ></button>

        </div>


        <div className="document-detail-body">

          {loading ? (

            <div className="text-center py-5">

              <div
                className="spinner-border text-primary"
                role="status"
                aria-label="Đang tải"
              ></div>

              <p className="text-secondary mt-3">

                Đang tải chi tiết tài liệu...

              </p>

            </div>

          ) : error ? (

            <div className="alert alert-danger">

              {error}

            </div>

          ) : document && (

            <>

              {/* THANH CHUYỂN ĐỔI NỘI DUNG */}

              <div
                className="document-detail-tabs"
                aria-label="Nội dung chi tiết tài liệu"
              >

                {tabs.map((item) => (

                  <button
                    key={item.id}
                    type="button"
                    className={`document-tab ${
                      activeTab === item.id ? "active" : ""
                    }`}
                    aria-pressed={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                  >

                    <i className={`bi ${item.icon} me-2`}></i>

                    {item.label}

                  </button>

                ))}

              </div>


              {/* NỘI DUNG */}

              {activeTab === "information" && (

                <DocumentInformation document={document} />

              )}

              {activeTab === "transactions" && (

                <DocumentTransactions
                  documentId={documentId}
                />

              )}

              {activeTab === "verifications" && (

                <DocumentVerifications
                  documentId={documentId}
                />

              )}

            </>

          )}

        </div>


        {/* NÚT ĐÓNG */}

        <div className="document-detail-footer">

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >

            Đóng

          </button>

        </div>

      </div>

    </div>

  );

}

export default DocumentDetail;