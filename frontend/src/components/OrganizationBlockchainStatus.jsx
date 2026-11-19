import { useState, useEffect } from "react";

import organizationApi from "../api/organizationApi.js";

import OrganizationStatus from "./OrganizationStatus.jsx";

function OrganizationBlockchainStatus({
  organization,
  onClose,
}) {

  const organizationId = organization.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);


  // ========================================
  // 1. KIỂM TRA TRẠNG THÁI BLOCKCHAIN
  // ========================================

  useEffect(() => {

    let cancelled = false;

    async function fetchBlockchainStatus() {

      try {

        const response =
          await organizationApi.getBlockchainStatus(
            organizationId
          );

        if (cancelled) return;

        if (
          !response.success ||
          !response.data ||
          typeof response.data.databaseAuthorized !== "boolean" ||
          typeof response.data.blockchainAuthorized !== "boolean" ||
          typeof response.data.synced !== "boolean"
        ) {

          setError(
            "Dữ liệu kiểm tra Blockchain không hợp lệ."
          );

          return;
        }

        setData(response.data);

      } catch (err) {

        if (cancelled) return;

        const status = err.response?.status;

        if (status === 400) {

          setError(
            "Thông tin đơn vị hoặc địa chỉ ví không hợp lệ."
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

        } else if (status === 503) {

          setError(
            "Dịch vụ Blockchain tạm thời không khả dụng. " +
            "Vui lòng kiểm tra mạng và Smart Contract."
          );

        } else if (!err.response) {

          setError(
            "Không thể kết nối đến máy chủ " +
            "hoặc yêu cầu đã hết thời gian chờ."
          );

        } else {

          setError(
            "Không thể kiểm tra trạng thái Blockchain."
          );

        }

      } finally {

        if (!cancelled) {
          setLoading(false);
        }

      }

    }

    fetchBlockchainStatus();

    return () => {
      cancelled = true;
    };

  }, [organizationId, refreshKey]);


  // ========================================
  // 2. KIỂM TRA LẠI
  // ========================================

  function handleRefresh() {

    setLoading(true);
    setError("");
    setData(null);

    setRefreshKey(
      (previous) => previous + 1
    );

  }


  // ========================================
  // 3. ĐỊNH DẠNG THỜI GIAN
  // ========================================

  function formatDate(value) {

    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("vi-VN");

  }


  // ========================================
  // 4. GIAO DIỆN
  // ========================================

  return (

    <div className="organization-form-overlay">

      <div
        className="organization-form-dialog
                   blockchain-status-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="blockchain-status-title"
      >

        {/* Tiêu đề */}

        <div className="organization-form-header">

          <h5
            id="blockchain-status-title"
            className="mb-0 fw-bold"
          >

            <i className="bi bi-shield-check me-2"></i>

            Kiểm tra quyền Blockchain

          </h5>

          <button
            type="button"
            className="btn-close"
            aria-label="Đóng"
            onClick={onClose}
          ></button>

        </div>


        {/* Nội dung */}

        <div className="organization-form-body">

          {/* Thông tin đơn vị */}

          <div className="mb-3">

            <label className="text-secondary small">
              Tên đơn vị cấp phát
            </label>

            <p className="fw-bold mb-2">

              {data?.organizationName ||
                organization.name}

            </p>

            <label className="text-secondary small">
              Địa chỉ ví Blockchain
            </label>

            <p className="blockchain-address mb-0">

              {data?.walletAddress ||
                organization.wallet_address}

            </p>

          </div>

          <hr />


          {/* Đang kiểm tra */}

          {loading && (

            <div className="text-center py-5" role="status">

              <div
                className="spinner-border text-primary"
                aria-hidden="true"
              ></div>

              <p className="mt-3 mb-1 fw-medium">
                Đang kiểm tra Blockchain...
              </p>

              <p className="text-secondary small mb-0">
                Vui lòng chờ trong giây lát.
              </p>

            </div>

          )}


          {/* Thông báo lỗi */}

          {!loading && error && (

            <div className="alert alert-danger" role="alert">

              <i className="bi bi-exclamation-circle me-2"></i>

              {error}

            </div>

          )}


          {/* Kết quả kiểm tra */}

          {!loading && !error && data && (

            <>

              {/* Trạng thái MySQL */}

              <div className="blockchain-status-row">

                <div>

                  <i className="bi bi-database me-2"></i>

                  Trạng thái trong MySQL

                </div>

                <OrganizationStatus
                  authorized={data.databaseAuthorized}
                />

              </div>


              {/* Trạng thái Blockchain */}

              <div className="blockchain-status-row">

                <div>

                  <i className="bi bi-boxes me-2"></i>

                  Trạng thái trên Blockchain

                </div>

                <OrganizationStatus
                  authorized={data.blockchainAuthorized}
                />

              </div>


              {/* So sánh kết quả */}

              <div
                className={`alert mt-3 ${
                  data.synced
                    ? "alert-success"
                    : "alert-warning"
                }`}
                role="status"
              >

                <h6 className="fw-bold">

                  <i
                    className={`bi me-2 ${
                      data.synced
                        ? "bi-check-circle"
                        : "bi-exclamation-triangle"
                    }`}
                  ></i>

                  {data.synced
                    ? "Dữ liệu đồng bộ"
                    : "Dữ liệu không đồng bộ"}

                </h6>

                <p className="small mb-0">

                  {data.synced
                    ? "Trạng thái quyền trong MySQL khớp với Smart Contract."
                    : "Trạng thái quyền trong MySQL khác với Smart Contract. Cần kiểm tra lại dữ liệu."}

                </p>

              </div>


              {/* Thông tin Blockchain */}

              <div className="blockchain-information">

                <h6 className="fw-bold mb-3">
                  Thông tin Blockchain
                </h6>

                <div className="blockchain-info-row">

                  <span>Mạng Blockchain</span>

                  <strong>
                    {data.network === "sepolia"
                      ? "Ethereum Sepolia"
                      : data.network || "—"}
                  </strong>

                </div>

                <div className="blockchain-info-row">

                  <span>Mã mạng</span>

                  <strong>
                    {data.chainId ?? "—"}
                  </strong>

                </div>

                <div className="mt-3">

                  <span className="text-secondary small">
                    Địa chỉ Smart Contract
                  </span>

                  <p className="blockchain-address mt-1">

                    {data.contractAddress || "—"}

                  </p>

                  {data.network === "sepolia" &&
                    data.contractAddress &&
                    /^0x[a-fA-F0-9]{40}$/.test(
                      data.contractAddress
                    ) && (

                    <a
                      href={`https://sepolia.etherscan.io/address/${data.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="small text-decoration-none"
                    >

                      Xem trên Etherscan

                      <i className="bi bi-box-arrow-up-right ms-1"></i>

                    </a>

                  )}

                </div>

                <hr />

                <div className="blockchain-info-row">

                  <span>Thời điểm kiểm tra</span>

                  <strong>
                    {formatDate(data.checkedAt)}
                  </strong>

                </div>

              </div>

            </>

          )}

        </div>


        {/* Nút thao tác */}

        <div className="organization-form-footer">

          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleRefresh}
            disabled={loading}
          >

            <i className="bi bi-arrow-clockwise me-2"></i>

            Kiểm tra lại

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

export default OrganizationBlockchainStatus;