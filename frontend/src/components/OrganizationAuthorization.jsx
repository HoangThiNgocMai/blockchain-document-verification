import { useState, useEffect, useRef } from "react";

import organizationApi from "../api/organizationApi.js";

import OrganizationStatus from "./OrganizationStatus.jsx";


// ================================================
// HIỂN THỊ MÃ GIAO DỊCH BLOCKCHAIN
// ================================================

function TransactionInformation({ hash, blockNumber }) {

  if (!hash) return null;

  const validHash = /^0x[a-fA-F0-9]{64}$/.test(hash);

  return (

    <div className="blockchain-information mt-3">

      <h6 className="fw-bold mb-3">
        Thông tin giao dịch
      </h6>

      <span className="small text-secondary">
        Mã giao dịch (TxHash)
      </span>

      <p className="blockchain-address mt-1 mb-2">
        {hash}
      </p>

      {blockNumber != null && (

        <p className="small">

          Số khối: <strong>{blockNumber}</strong>

        </p>

      )}

      {validHash && (

        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="small text-decoration-none"
        >

          Xem giao dịch trên Etherscan

          <i className="bi bi-box-arrow-up-right ms-2"></i>

        </a>

      )}

    </div>

  );

}


// ================================================
// CẤP VÀ THU HỒI QUYỀN BLOCKCHAIN
// ================================================

function OrganizationAuthorization({
  organization,
  action,
  onClose,
  onSuccess,
}) {

  const isAuthorize = action === "authorize";

  const organizationId = organization.id;

  const actionText = isAuthorize
    ? "cấp quyền"
    : "thu hồi quyền";

  const [checking, setChecking] = useState(true);
  const [currentStatus, setCurrentStatus] = useState(null);

  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const [result, setResult] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);

  const [attempted, setAttempted] = useState(false);

  const requestLock = useRef(false);


  // ================================================
  // 1. KIỂM TRA QUYỀN TRƯỚC KHI GỬI GIAO DỊCH
  // ================================================

  useEffect(() => {

    let cancelled = false;

    async function checkStatus() {

      try {

        const response =
          await organizationApi.getBlockchainStatus(
            organizationId
          );

        if (cancelled) return;

        const data = response.data;

        if (
          !response.success ||
          !data ||
          typeof data.databaseAuthorized !== "boolean" ||
          typeof data.blockchainAuthorized !== "boolean" ||
          typeof data.synced !== "boolean"
        ) {

          setError(
            "Không nhận được trạng thái Blockchain hợp lệ."
          );

          return;
        }

        setCurrentStatus(data);

        if (
          data.walletAddress?.toLowerCase() !==
          organization.wallet_address?.toLowerCase()
        ) {

          setError(
            "Địa chỉ ví đã thay đổi. Vui lòng tải lại danh sách."
          );

        } else if (!data.synced) {

          setError(
            "MySQL và Blockchain chưa đồng bộ. " +
            "Cần kiểm tra lại dữ liệu trước khi thay đổi quyền."
          );

        } else if (
          data.blockchainAuthorized === isAuthorize
        ) {

          setError(
            isAuthorize
              ? "Đơn vị này đã được cấp quyền."
              : "Đơn vị này chưa được cấp quyền."
          );

        }

      } catch {

        if (!cancelled) {

          setError(
            "Không thể kiểm tra quyền Blockchain hiện tại. " +
            "Vui lòng kiểm tra kết nối và thử lại."
          );

        }

      } finally {

        if (!cancelled) {

          setChecking(false);

        }

      }

    }

    checkStatus();

    return () => {

      cancelled = true;

    };

  }, [
    organizationId,
    organization.wallet_address,
    isAuthorize
  ]);


  // ================================================
  // 2. GỬI YÊU CẦU THAY ĐỔI QUYỀN
  // ================================================

  async function handleSubmit() {

    if (
      requestLock.current ||
      checking ||
      processing ||
      attempted ||
      result ||
      error ||
      warning ||
      !confirmed ||
      !currentStatus ||
      !currentStatus.synced
    ) {

      return;

    }

    requestLock.current = true;

    setAttempted(true);
    setProcessing(true);
    setError("");
    setWarning("");

    try {

      const response = isAuthorize

        ? await organizationApi.authorize(
            organizationId
          )

        : await organizationApi.deauthorize(
            organizationId
          );

      const data = response.data;

      if (data?.transactionHash) {

        setTransactionHash(
          data.transactionHash
        );

      }

      if (
        response.success &&
        data?.transactionStatus === "confirmed" &&
        data?.synced === true &&
        data?.requestedStateReached === true &&
        data?.databaseAuthorized === isAuthorize &&
        data?.blockchainAuthorized === isAuthorize
      ) {

        setResult(data);

        onSuccess?.(
          isAuthorize
            ? "Cấp quyền Blockchain thành công."
            : "Thu hồi quyền Blockchain thành công."
        );

      } else {

        setWarning(
          "Chưa thể xác nhận kết quả cuối cùng. " +
          "Vui lòng kiểm tra lại quyền Blockchain " +
          "trước khi thực hiện giao dịch khác."
        );

      }

    } catch (err) {

      const status = err.response?.status;

      const responseData = err.response?.data;

      const hash =
        responseData?.transactionHash ||
        responseData?.data?.transactionHash ||
        null;

      const chainConfirmed =
        responseData?.chainConfirmed === true ||
        responseData?.data?.transactionStatus === "confirmed";

      if (hash) {

        setTransactionHash(hash);

      }

      if (chainConfirmed) {

        setWarning(
          "Giao dịch đã được Blockchain xác nhận, " +
          "nhưng trạng thái hệ thống cần được kiểm tra lại. " +
          "Không gửi lại giao dịch."
        );

      } else if (hash) {

        setWarning(
          "Đã ghi nhận mã giao dịch nhưng chưa xác định " +
          "được kết quả cuối cùng. " +
          "Hãy kiểm tra giao dịch trên Etherscan."
        );

      } else if (!err.response) {

        setWarning(
          "Kết nối bị gián đoạn hoặc hết thời gian chờ. " +
          "Giao dịch vẫn có thể đang được xử lý. " +
          "Không gửi lại ngay."
        );

      } else if (status === 401) {

        setError(
          "Phiên đăng nhập đã hết hạn."
        );

      } else if (status === 403) {

        setError(
          "Bạn không có quyền thực hiện thao tác này."
        );

      } else if (status === 404) {

        setError(
          "Không tìm thấy đơn vị cấp phát."
        );

      } else if (status === 400) {

        setError(
          "Thông tin đơn vị hoặc địa chỉ ví không hợp lệ."
        );

      } else if (status === 409) {

        setWarning(
          "Đang có giao dịch được xử lý hoặc " +
          "trạng thái quyền đã thay đổi. " +
          "Vui lòng kiểm tra lại Blockchain."
        );

      } else if (status === 503) {

        setWarning(
          "Dịch vụ Blockchain tạm thời không khả dụng. " +
          "Hãy kiểm tra mạng, ví quản trị và Smart Contract " +
          "trước khi thực hiện lại."
        );

      } else {

        setWarning(
          "Chưa thể xác định kết quả giao dịch. " +
          "Hãy kiểm tra số dư Sepolia ETH, " +
          "lịch sử giao dịch và trạng thái Blockchain " +
          "trước khi gửi yêu cầu mới."
        );

      }

    } finally {

      requestLock.current = false;

      setProcessing(false);

    }

  }


  // ================================================
  // 3. GIAO DIỆN
  // ================================================

  return (

    <div className="organization-form-overlay">

      <div
        className="organization-form-dialog blockchain-status-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="authorization-title"
      >

        {/* TIÊU ĐỀ */}

        <div className="organization-form-header">

          <h5
            id="authorization-title"
            className="mb-0 fw-bold"
          >

            <i
              className={`bi me-2 ${
                isAuthorize
                  ? "bi-shield-check"
                  : "bi-shield-x"
              }`}
            ></i>

            {isAuthorize
              ? "Cấp quyền Blockchain"
              : "Thu hồi quyền Blockchain"}

          </h5>

          <button
            type="button"
            className="btn-close"
            aria-label="Đóng"
            onClick={onClose}
            disabled={processing}
          ></button>

        </div>


        {/* NỘI DUNG */}

        <div className="organization-form-body">

          <label className="text-secondary small">
            Tên đơn vị cấp phát
          </label>

          <p className="fw-bold">

            {currentStatus?.organizationName ||
              organization.name}

          </p>

          <label className="text-secondary small">
            Địa chỉ ví Blockchain
          </label>

          <p className="blockchain-address">

            {currentStatus?.walletAddress ||
              organization.wallet_address}

          </p>

          <hr />


          {/* ĐANG KIỂM TRA */}

          {checking && (

            <div className="text-center py-4" role="status">

              <div className="spinner-border text-primary"></div>

              <p className="mt-3 mb-0">
                Đang kiểm tra quyền Blockchain...
              </p>

            </div>

          )}


          {/* ĐANG XỬ LÝ GIAO DỊCH */}

          {processing && (

            <div className="text-center py-4" role="status">

              <div className="spinner-border text-primary"></div>

              <h6 className="mt-3 fw-bold">
                Đang xử lý giao dịch Blockchain
              </h6>

              <p className="small text-secondary mb-1">
                Hệ thống đang chờ kết quả từ máy chủ.
              </p>

              <p className="small text-danger mb-0">

                Vui lòng không tải lại trang hoặc
                gửi thêm giao dịch.

              </p>

            </div>

          )}


          {/* THÔNG BÁO LỖI */}

          {error && (

            <div className="alert alert-danger" role="alert">

              <i className="bi bi-exclamation-circle me-2"></i>

              {error}

            </div>

          )}


          {/* THÔNG BÁO CẢNH BÁO */}

          {warning && (

            <div className="alert alert-warning" role="alert">

              <i className="bi bi-exclamation-triangle me-2"></i>

              {warning}

            </div>

          )}


          {/* XÁC NHẬN GIAO DỊCH */}

          {!checking &&
            !processing &&
            !attempted &&
            !error &&
            !warning &&
            !result &&
            currentStatus && (

            <>

              <div className="blockchain-status-row">

                <span>Trạng thái hiện tại</span>

                <OrganizationStatus
                  authorized={
                    currentStatus.blockchainAuthorized
                  }
                />

              </div>

              <div className="blockchain-status-row">

                <span>Trạng thái mong muốn</span>

                <OrganizationStatus
                  authorized={isAuthorize}
                />

              </div>

              <div className="alert alert-warning mt-3">

                <h6 className="fw-bold">

                  <i className="bi bi-exclamation-triangle me-2"></i>

                  Lưu ý trước khi thực hiện

                </h6>

                <p className="small mb-2">

                  Thao tác này sẽ gửi giao dịch lên mạng
                  Ethereum Sepolia và sử dụng Sepolia ETH
                  của ví quản trị để thanh toán phí gas.

                </p>

                {!isAuthorize && (

                  <p className="small text-danger mb-0">

                    Thu hồi quyền có thể ảnh hưởng đến
                    kết quả xác thực các tài liệu mà
                    đơn vị đã cấp phát trước đó.

                  </p>

                )}

              </div>

              <div className="form-check">

                <input
                  id="confirm-authorization"
                  type="checkbox"
                  className="form-check-input"
                  checked={confirmed}
                  onChange={(event) =>
                    setConfirmed(event.target.checked)
                  }
                />

                <label
                  className="form-check-label"
                  htmlFor="confirm-authorization"
                >

                  Tôi xác nhận thực hiện {actionText}
                  {" "}cho đơn vị này.

                </label>

              </div>

            </>

          )}


          {/* GIAO DỊCH THÀNH CÔNG */}

          {result && (

            <>

              <div className="alert alert-success">

                <h6 className="fw-bold">

                  <i className="bi bi-check-circle me-2"></i>

                  {isAuthorize
                    ? "Cấp quyền thành công"
                    : "Thu hồi quyền thành công"}

                </h6>

                <p className="small mb-0">

                  Giao dịch đã được xác nhận và
                  dữ liệu MySQL đã đồng bộ với Blockchain.

                </p>

              </div>

              <div className="blockchain-status-row">

                <span>Trạng thái MySQL</span>

                <OrganizationStatus
                  authorized={result.databaseAuthorized}
                />

              </div>

              <div className="blockchain-status-row">

                <span>Trạng thái Blockchain</span>

                <OrganizationStatus
                  authorized={result.blockchainAuthorized}
                />

              </div>

              <div className="blockchain-status-row">

                <span>Đồng bộ dữ liệu</span>

                <strong className="text-success">
                  Đồng bộ
                </strong>

              </div>

            </>

          )}


          {/* MÃ GIAO DỊCH */}

          <TransactionInformation
            hash={transactionHash}
            blockNumber={result?.blockNumber}
          />

        </div>


        {/* NÚT THAO TÁC */}

        <div className="organization-form-footer">

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={processing}
          >

            {attempted || result || error || warning
              ? "Đóng"
              : "Hủy bỏ"}

          </button>

          {!attempted && !result && !error && !warning && (

            <button
              type="button"
              className={`btn ${
                isAuthorize
                  ? "btn-primary"
                  : "btn-danger"
              }`}
              onClick={handleSubmit}
              disabled={
                checking ||
                processing ||
                !confirmed ||
                !currentStatus?.synced
              }
            >

              {isAuthorize
                ? "Xác nhận cấp quyền"
                : "Xác nhận thu hồi quyền"}

            </button>

          )}

        </div>

      </div>

    </div>

  );

}

export default OrganizationAuthorization;