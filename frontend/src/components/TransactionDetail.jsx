import { useState, useEffect } from "react";

import transactionApi from "../api/transactionApi.js";

import TransactionStatus from "./TransactionStatus.jsx";
import TransactionAction from "./TransactionAction.jsx";


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
// 2. COMPONENT CHI TIẾT GIAO DỊCH
// ================================================

function TransactionDetail({
  type,
  id,
  onClose,
}) {

  const [transaction, setTransaction] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [copyMessage, setCopyMessage] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);


  // ==============================================
  // 3. LẤY CHI TIẾT GIAO DỊCH
  // ==============================================

  useEffect(() => {

    let cancelled = false;

    async function fetchTransaction() {

      try {

        const response =
          await transactionApi.getById(type, id);

        if (cancelled) return;

        if (
          !response.success ||
          !response.data ||
          response.data.transaction_type !== type ||
          String(response.data.id) !== String(id)
        ) {

          setError("Dữ liệu giao dịch không hợp lệ.");

          return;

        }

        setTransaction(response.data);

      } catch (err) {

        if (cancelled) return;

        const code = err.response?.status;

        if (code === 404) {

          setError("Không tìm thấy giao dịch.");

        } else if (code === 401) {

          setError("Phiên đăng nhập đã hết hạn.");

        } else if (code === 403) {

          setError("Bạn không có quyền truy cập.");

        } else if (!err.response) {

          setError("Không thể kết nối đến máy chủ.");

        } else {

          setError("Không thể tải chi tiết giao dịch.");

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }

    fetchTransaction();

    return () => {
      cancelled = true;
    };

  }, [type, id, refreshKey]);


  // ==============================================
  // 4. LÀM MỚI DỮ LIỆU
  // ==============================================

  function handleRefresh() {

    setLoading(true);

    setError("");

    setCopyMessage("");

    setTransaction(null);

    setRefreshKey((previous) => previous + 1);

  }


  // ==============================================
  // 5. SAO CHÉP MÃ GIAO DỊCH
  // ==============================================

  async function handleCopy() {

    if (!transaction?.tx_hash) return;

    try {

      await navigator.clipboard.writeText(
        transaction.tx_hash
      );

      setCopyMessage("Đã sao chép mã giao dịch.");

    } catch {

      setCopyMessage(
        "Không thể sao chép tự động. Vui lòng sao chép thủ công."
      );

    }

  }


  // ==============================================
  // 6. KIỂM TRA MÃ GIAO DỊCH
  // ==============================================

  const validHash =
    typeof transaction?.tx_hash === "string" &&
    /^0x[a-fA-F0-9]{64}$/.test(transaction.tx_hash);


  // ==============================================
  // 7. GIAO DIỆN CHI TIẾT
  // ==============================================

  return (

    <div className="transaction-detail-overlay">

      <div
        className="transaction-detail-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-detail-title"
      >

        {/* TIÊU ĐỀ */}

        <div className="transaction-detail-header">

          <h5
            id="transaction-detail-title"
            className="mb-0 fw-bold"
          >
            <i className="bi bi-link-45deg me-2"></i>

            Chi tiết giao dịch Blockchain

          </h5>

          <button
            type="button"
            className="btn-close"
            aria-label="Đóng"
            onClick={onClose}
          ></button>

        </div>


        {/* NỘI DUNG */}

        <div className="transaction-detail-body">

          {loading ? (

            <div className="text-center py-5">

              <div
                className="spinner-border text-primary"
                role="status"
                aria-label="Đang tải"
              ></div>

              <p className="text-secondary mt-3">

                Đang tải chi tiết giao dịch...

              </p>

            </div>

          ) : error ? (

            <div className="alert alert-danger">

              <p>{error}</p>

              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={handleRefresh}
              >

                Thử lại

              </button>

            </div>

          ) : transaction && (

            <>

              <h6 className="transaction-section-title">

                Thông tin giao dịch

              </h6>

              <div className="row g-3 mb-4">

                <div className="col-md-6">

                  <label>Nhóm giao dịch</label>

                  <div className="fw-medium">

                    {transaction.transaction_type === "document"
                      ? "Giao dịch tài liệu"
                      : "Giao dịch đơn vị"}

                  </div>

                </div>


                <div className="col-md-6">

                  <label>Trạng thái</label>

                  <div>

                    <TransactionStatus
                      status={transaction.status}
                    />

                  </div>

                </div>


                <div className="col-md-6">

                  <label>Loại giao dịch</label>

                  <div>

                    <TransactionAction
                      action={transaction.action}
                    />

                  </div>

                </div>


                <div className="col-md-6">

                  <label>Số khối Blockchain</label>

                  <div className="fw-medium">

                    {transaction.block_number ?? "—"}

                  </div>

                </div>


                <div className="col-md-6">

                  <label>Đơn vị cấp phát</label>

                  <div className="fw-medium">

                    {transaction.organization_name || "—"}

                  </div>

                </div>


                <div className="col-md-6">

                  <label>Người thực hiện</label>

                  <div className="fw-medium">

                    {transaction.performer_name ||
                      "Không có thông tin"}

                  </div>

                </div>


                <div className="col-md-6">

                  <label>Thời gian giao dịch</label>

                  <div className="fw-medium">

                    {formatDate(transaction.created_at)}

                  </div>

                </div>


                <div className="col-md-6">

                  <label>Mạng Blockchain</label>

                  <div className="fw-medium">

                    Ethereum Sepolia

                  </div>

                </div>

              </div>


              {/* THÔNG TIN TÀI LIỆU */}

              {transaction.transaction_type === "document" && (

                <>

                  <h6 className="transaction-section-title">

                    Thông tin tài liệu

                  </h6>

                  <div className="row g-3 mb-4">

                    <div className="col-12">

                      <label>Tên tài liệu</label>

                      <div className="fw-medium">

                        {transaction.document_title || "—"}

                      </div>

                    </div>


                    <div className="col-12">

                      <label>Mã tài liệu</label>

                      <div className="transaction-full-hash">

                        {transaction.document_code || "—"}

                      </div>

                    </div>

                  </div>

                </>

              )}


              {/* THÔNG TIN BLOCKCHAIN */}

              <h6 className="transaction-section-title">

                Thông tin Blockchain

              </h6>

              <label>Mã giao dịch (TxHash)</label>

              <div className="transaction-full-hash mb-3">

                {transaction.tx_hash || "Chưa có mã giao dịch"}

              </div>


              <div className="d-flex flex-wrap gap-2 mb-3">

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleCopy}
                  disabled={!transaction.tx_hash}
                >

                  <i className="bi bi-copy me-2"></i>

                  Sao chép mã giao dịch

                </button>


                {validHash && (

                  <a
                    href={`https://sepolia.etherscan.io/tx/${transaction.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary"
                  >

                    <i className="bi bi-box-arrow-up-right me-2"></i>

                    Xem trên Etherscan

                  </a>

                )}

              </div>


              {copyMessage && (

                <p
                  className="small text-secondary"
                  role="status"
                >

                  {copyMessage}

                </p>

              )}


              <div className="alert alert-light border mb-0">

                <i className="bi bi-info-circle me-2"></i>

                Thông tin trên được lấy từ cơ sở dữ liệu.
                Bạn có thể truy cập Etherscan để đối chiếu
                giao dịch trên Blockchain.

              </div>

            </>

          )}

        </div>


        {/* CHÂN CỬA SỔ */}

        <div className="transaction-detail-footer">

          <button
            type="button"
            className="btn btn-outline-primary"
            disabled={loading}
            onClick={handleRefresh}
          >

            <i className="bi bi-arrow-clockwise me-2"></i>

            Làm mới

          </button>

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

export default TransactionDetail;