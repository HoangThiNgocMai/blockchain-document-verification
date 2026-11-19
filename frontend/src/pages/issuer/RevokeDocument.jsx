import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import documentApi from "../../api/documentApi.js";
import revokeApi from "../../api/revokeApi.js";

import DocumentStatus from "../../components/DocumentStatus.jsx";

import "../../styles/revoke-document.css";


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
// 2. COMPONENT THU HỒI TÀI LIỆU
// ================================================

function RevokeDocument() {

  const [searchParams] = useSearchParams();

  const initialCode = searchParams.get("code") || "";

  const [documentCode, setDocumentCode] =
    useState(initialCode);

  const [searchCode, setSearchCode] =
    useState(initialCode.trim());

  const [searchKey, setSearchKey] = useState(0);

  const [document, setDocument] = useState(null);

  const [searching, setSearching] =
    useState(Boolean(initialCode.trim()));

  const [revoking, setRevoking] = useState(false);

  const [confirmed, setConfirmed] = useState(false);

  const [error, setError] = useState("");

  const [uncertain, setUncertain] = useState(false);

  const [result, setResult] = useState(null);

  const [copyMessage, setCopyMessage] = useState("");

  const requestLock = useRef(false);

  const formLocked = revoking || uncertain;


// ================================================
// 3. TÌM KIẾM TÀI LIỆU
// ================================================

  useEffect(() => {

    if (!searchCode) return;

    let cancelled = false;

    async function fetchDocument() {

      try {

        // Kiểm tra độ dài mã tài liệu

        if (searchCode.length > 100) {

          if (!cancelled) {

            setError("Mã tài liệu không hợp lệ.");

          }

          return;

        }

        // Lấy danh sách tài liệu thuộc tài khoản

        const response = await documentApi.getAll({

          search: searchCode,
          page: 1,
          limit: 100,

        });

        if (cancelled) return;

        if (
          !response.success ||
          !Array.isArray(response.data)
        ) {

          setError(
            "Dữ liệu tài liệu không hợp lệ."
          );

          return;

        }

        // Tìm chính xác theo mã tài liệu

        const foundDocument = response.data.find(
          (item) => item.document_code === searchCode
        );

        if (!foundDocument) {

          setError(

            "Không tìm thấy tài liệu thuộc " +
            "tài khoản của bạn."

          );

          return;

        }

        // Lấy thông tin chi tiết

        const detailResponse =
          await documentApi.getById(foundDocument.id);

        if (cancelled) return;

        if (
          !detailResponse.success ||
          !detailResponse.data ||
          detailResponse.data.document_code !== searchCode
        ) {

          setError(
            "Không thể xác định thông tin tài liệu."
          );

          return;

        }

        setDocument(detailResponse.data);

      } catch (err) {

        if (cancelled) return;

        const status = err.response?.status;

        if (status === 401) {

          setError(
            "Phiên đăng nhập đã hết hạn."
          );

        } else if (status === 403) {

          setError(
            "Bạn không có quyền truy cập tài liệu."
          );

        } else if (status === 404) {

          setError(
            "Không tìm thấy tài liệu."
          );

        } else if (!err.response) {

          setError(
            "Không thể kết nối đến máy chủ."
          );

        } else {

          setError(
            "Không thể tìm kiếm tài liệu."
          );

        }

      } finally {

        if (!cancelled) {

          setSearching(false);

        }

      }

    }

    fetchDocument();

    return () => {

      cancelled = true;

    };

  }, [searchCode, searchKey]);


// ================================================
// 4. XỬ LÝ NÚT TÌM KIẾM
// ================================================

  function handleSearch(event) {

    event.preventDefault();

    if (
      requestLock.current ||
      uncertain ||
      searching
    ) return;

    const code = documentCode.trim();

    setError("");

    setDocument(null);

    setConfirmed(false);

    setResult(null);

    if (!code) {

      setError("Vui lòng nhập mã tài liệu.");

      setSearchCode("");

      return;

    }

    if (code.length > 100) {

      setError(
        "Mã tài liệu không được vượt quá 100 ký tự."
      );

      return;

    }

    setSearching(true);

    setSearchCode(code);

    setSearchKey(
      (previous) => previous + 1
    );

  }


// ================================================
// 5. XỬ LÝ THU HỒI TÀI LIỆU
// ================================================

  async function handleRevoke(event) {

    event.preventDefault();

    if (
      requestLock.current ||
      uncertain ||
      searching
    ) return;

    setError("");

    if (!document) {

      setError(
        "Vui lòng tìm kiếm tài liệu cần thu hồi."
      );

      return;

    }

    if (
      documentCode.trim() !== document.document_code
    ) {

      setError(
        "Mã tài liệu đã thay đổi. Vui lòng tìm kiếm lại."
      );

      return;

    }

    if (document.status !== "issued") {

      setError(
        "Chỉ được thu hồi tài liệu đang có hiệu lực."
      );

      return;

    }

    if (!confirmed) {

      setError(
        "Vui lòng xác nhận trước khi thu hồi."
      );

      return;

    }

    // Khóa nút để tránh gửi nhiều yêu cầu

    requestLock.current = true;

    setRevoking(true);

    let revokeRequested = false;

    try {

      // Kiểm tra lại trạng thái trước khi thu hồi

      const latestResponse =
        await documentApi.getById(document.id);

      if (
        !latestResponse.success ||
        !latestResponse.data ||
        latestResponse.data.document_code !==
          document.document_code
      ) {

        setError(
          "Không thể kiểm tra trạng thái tài liệu."
        );

        return;

      }

      const latestDocument = latestResponse.data;

      setDocument(latestDocument);

      if (latestDocument.status !== "issued") {

        setConfirmed(false);

        setError(
          "Tài liệu không còn ở trạng thái đã cấp phát."
        );

        return;

      }

      // Gửi yêu cầu thu hồi

      revokeRequested = true;

      const response =
        await revokeApi.revokeDocument(
          latestDocument.document_code
        );

      if (!response.success) {

        setUncertain(true);

        setError(
          "Chưa xác định được kết quả thu hồi."
        );

        return;

      }

      // Kiểm tra trạng thái trong cơ sở dữ liệu

      const updatedResponse =
        await documentApi.getById(
          latestDocument.id
        );

      if (
        !updatedResponse.success ||
        !updatedResponse.data ||
        updatedResponse.data.document_code !==
          latestDocument.document_code ||
        updatedResponse.data.status !== "revoked"
      ) {

        setUncertain(true);

        setError(

          "Đã gửi yêu cầu thu hồi nhưng chưa " +
          "xác nhận được trạng thái tài liệu."

        );

        return;

      }

      setDocument(updatedResponse.data);

      setResult({

        documentCode: latestDocument.document_code,

        title: latestDocument.title,

        transactionHash:
          response.data?.transactionHash || null,

        blockNumber:
          response.data?.blockNumber ?? null,

      });

      setConfirmed(false);

    } catch (err) {

      const status = err.response?.status;

      if (revokeRequested) {

        // Không tự động gửi lại yêu cầu thu hồi

        setUncertain(true);

        if (status === 403) {

          setError(

            "Yêu cầu thu hồi bị từ chối. " +
            "Vui lòng kiểm tra quyền tài khoản."

          );

        } else {

          setError(

            "Chưa xác định được kết quả giao dịch. " +
            "Không thực hiện lại ngay."

          );

        }

      } else {

        setError(

          "Không thể kiểm tra thông tin tài liệu. " +
          "Chưa gửi yêu cầu thu hồi."

        );

      }

    } finally {

      requestLock.current = false;

      setRevoking(false);

    }

  }


// ================================================
// 6. ĐẶT LẠI BIỂU MẪU
// ================================================

  function handleReset() {

    if (
      requestLock.current ||
      uncertain ||
      searching
    ) return;

    setDocumentCode("");

    setSearchCode("");

    setDocument(null);

    setConfirmed(false);

    setResult(null);

    setError("");

    setCopyMessage("");

  }


// ================================================
// 7. SAO CHÉP MÃ GIAO DỊCH
// ================================================

  async function handleCopy(value) {

    if (!value) return;

    try {

      await navigator.clipboard.writeText(value);

      setCopyMessage("Đã sao chép mã giao dịch.");

    } catch {

      setCopyMessage(
        "Không thể sao chép mã giao dịch."
      );

    }

  }


// ================================================
// 8. KIỂM TRA MÃ GIAO DỊCH
// ================================================

  const transactionHash = result?.transactionHash;

  const explorerUrl =

    typeof transactionHash === "string" &&

    /^0x[a-fA-F0-9]{64}$/.test(transactionHash)

      ? `https://sepolia.etherscan.io/tx/${transactionHash}`

      : null;


// ================================================
// 9. GIAO DIỆN KẾT QUẢ THÀNH CÔNG
// ================================================

  if (result) {

    return (

      <div className="revoke-document-page">

        <div className="card revoke-result-card">

          <div className="card-body">

            <div className="revoke-success-heading">

              <i className="bi bi-check-circle-fill"></i>

              <h4>Thu hồi tài liệu thành công!</h4>

              <p className="text-secondary">

                Tài liệu đã được cập nhật trạng thái
                thu hồi.

              </p>

            </div>


            <div className="revoke-info-row">

              <span>Mã tài liệu</span>

              <strong className="revoke-code">

                {result.documentCode}

              </strong>

            </div>


            <div className="revoke-info-row">

              <span>Tên tài liệu</span>

              <strong>{result.title}</strong>

            </div>


            <div className="revoke-info-row">

              <span>Trạng thái</span>

              <div>

                <DocumentStatus status="revoked" />

              </div>

            </div>


            <div className="revoke-info-row">

              <span>Mã giao dịch thu hồi</span>

              <div className="revoke-info-value">

                <span className="revoke-code">

                  {transactionHash || "Chưa có thông tin"}

                </span>

                {transactionHash && (

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary ms-2"
                    onClick={() =>
                      handleCopy(transactionHash)
                    }
                    aria-label="Sao chép mã giao dịch"
                  >

                    <i className="bi bi-copy"></i>

                  </button>

                )}

                {explorerUrl && (

                  <div className="mt-2">

                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >

                      Xem giao dịch trên Blockchain

                    </a>

                  </div>

                )}

              </div>

            </div>


            <div className="revoke-info-row">

              <span>Số khối</span>

              <strong>

                {result.blockNumber ?? "—"}

              </strong>

            </div>


            <div className="revoke-info-row">

              <span>Mạng Blockchain</span>

              <strong>Ethereum Sepolia</strong>

            </div>


            {copyMessage && (

              <p className="small text-secondary mt-3">

                {copyMessage}

              </p>

            )}


            <div className="alert alert-warning mt-4">

              <i className="bi bi-info-circle me-2"></i>

              Tài liệu đã bị thu hồi và không còn
              hiệu lực xác thực.

              Thông tin lịch sử cấp phát vẫn được lưu giữ.

            </div>


            <div className="revoke-actions">

              <Link
                to="/issuer/documents"
                className="btn btn-outline-primary"
              >

                <i className="bi bi-folder2-open me-2"></i>

                Quản lý tài liệu

              </Link>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleReset}
              >

                Thu hồi tài liệu khác

              </button>

            </div>

          </div>

        </div>

      </div>

    );

  }


// ================================================
// 10. GIAO DIỆN THU HỒI
// ================================================

  return (

    <div className="revoke-document-page">

      {/* TIÊU ĐỀ */}

      <div className="revoke-heading mb-4">

        <h3>Thu hồi tài liệu</h3>

        <p className="text-secondary">

          Thu hồi hiệu lực của tài liệu đã cấp phát
          trên Blockchain.

        </p>

      </div>


      {/* THÔNG BÁO LỖI */}

      {error && (

        <div className="alert alert-danger" role="alert">

          <i className="bi bi-exclamation-circle me-2"></i>

          {error}

        </div>

      )}


      {uncertain && (

        <div className="alert alert-warning">

          Biểu mẫu đã được khóa để tránh gửi trùng
          giao dịch.

          Vui lòng kiểm tra trạng thái tài liệu và
          lịch sử giao dịch trước khi thực hiện lại.

          <div className="mt-3">

            <Link
              to="/issuer/documents"
              className="btn btn-outline-dark btn-sm"
            >

              Kiểm tra danh sách tài liệu

            </Link>

          </div>

        </div>

      )}


      {/* TÌM KIẾM TÀI LIỆU */}

      <div className="card mb-4">

        <div className="card-header bg-white">

          <h5>

            <i className="bi bi-search me-2"></i>

            Tìm kiếm tài liệu

          </h5>

        </div>


        <div className="card-body">

          <form onSubmit={handleSearch}>

            <label
              htmlFor="revoke-document-code"
              className="form-label"
            >

              Mã tài liệu

              <span className="text-danger"> *</span>

            </label>

            <div className="input-group">

              <input
                id="revoke-document-code"
                type="text"
                className="form-control"
                placeholder="Nhập mã tài liệu cần thu hồi"
                maxLength={100}
                value={documentCode}
                disabled={formLocked || searching}
                onChange={(event) => {

                  setDocumentCode(event.target.value);

                  setDocument(null);

                  setConfirmed(false);

                  setError("");

                }}
                required
              />

              <button
                type="submit"
                className="btn btn-primary"
                disabled={formLocked || searching}
              >

                <i className="bi bi-search me-2"></i>

                Tìm kiếm

              </button>

            </div>

          </form>

          <div className="form-text mt-2">

            Bạn có thể lấy mã tài liệu từ trang
            quản lý tài liệu.

          </div>

          <Link
            to="/issuer/documents"
            className="btn btn-outline-primary btn-sm mt-3"
          >

            <i className="bi bi-files me-2"></i>

            Xem danh sách tài liệu

          </Link>

        </div>

      </div>


      {/* ĐANG TÌM KIẾM */}

      {searching && (

        <div className="card mb-4">

          <div
            className="card-body text-center py-4"
            role="status"
          >

            <div className="spinner-border text-primary"></div>

            <p className="mt-2 mb-0">

              Đang tìm kiếm tài liệu...

            </p>

          </div>

        </div>

      )}


      {/* THÔNG TIN TÀI LIỆU */}

      {document && !searching && (

        <div className="card">

          <div className="card-header bg-white">

            <h5>

              <i className="bi bi-file-earmark-text me-2"></i>

              Thông tin tài liệu

            </h5>

          </div>

          <div className="card-body">


            <div className="revoke-info-row">

              <span>Mã tài liệu</span>

              <strong className="revoke-code">

                {document.document_code}

              </strong>

            </div>


            <div className="revoke-info-row">

              <span>Tên tài liệu</span>

              <strong>{document.title}</strong>

            </div>


            <div className="revoke-info-row">

              <span>Loại tài liệu</span>

              <strong>

                {document.document_type || "—"}

              </strong>

            </div>


            <div className="revoke-info-row">

              <span>Đơn vị cấp phát</span>

              <strong>

                {document.organization_name || "—"}

              </strong>

            </div>


            <div className="revoke-info-row">

              <span>Người cấp phát</span>

              <strong>

                {document.issuer_name || "—"}

              </strong>

            </div>


            <div className="revoke-info-row">

              <span>Ngày cấp phát</span>

              <strong>

                {formatDate(document.issued_at)}

              </strong>

            </div>


            <div className="revoke-info-row">

              <span>Mã SHA-256</span>

              <strong className="revoke-code">

                {document.file_hash || "—"}

              </strong>

            </div>


            <div className="revoke-info-row">

              <span>Trạng thái</span>

              <div>

                <DocumentStatus status={document.status} />

              </div>

            </div>


            {/* KIỂM TRA TRẠNG THÁI */}

            {document.status !== "issued" ? (

              <div className="alert alert-warning mt-4 mb-0">

                {document.status === "revoked"

                  ? "Tài liệu này đã được thu hồi."

                  : "Tài liệu chưa đủ điều kiện để thu hồi."}

              </div>

            ) : (

              <form
                onSubmit={handleRevoke}
                className="mt-4"
              >

                <div className="alert alert-warning">

                  <h6>

                    <i className="bi bi-exclamation-triangle me-2"></i>

                    Cảnh báo thu hồi tài liệu

                  </h6>

                  <p className="mb-0">

                    Sau khi thu hồi, tài liệu sẽ không còn
                    hiệu lực xác thực.

                    Thao tác này không thể hoàn tác
                    theo cơ chế hiện tại và sẽ phát sinh
                    phí giao dịch Blockchain.

                  </p>

                </div>


                <div className="form-check mb-4">

                  <input
                    id="revoke-confirm"
                    type="checkbox"
                    className="form-check-input"
                    checked={confirmed}
                    disabled={formLocked}
                    onChange={(event) =>
                      setConfirmed(event.target.checked)
                    }
                  />

                  <label
                    htmlFor="revoke-confirm"
                    className="form-check-label"
                  >

                    Tôi xác nhận muốn thu hồi tài liệu
                    này và hiểu rằng tài liệu sẽ không
                    còn hiệu lực.

                  </label>

                </div>


                <div className="revoke-actions">

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleReset}
                    disabled={formLocked}
                  >

                    <i className="bi bi-arrow-counterclockwise me-2"></i>

                    Nhập lại

                  </button>

                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={!confirmed || formLocked}
                  >

                    <i className="bi bi-file-earmark-x me-2"></i>

                    Thu hồi tài liệu

                  </button>

                </div>

              </form>

            )}


            {/* ĐANG XỬ LÝ GIAO DỊCH */}

            {revoking && (

              <div
                className="revoke-processing mt-4"
                role="status"
              >

                <div className="spinner-border text-primary"></div>

                <div>

                  <strong>

                    Đang xử lý thu hồi tài liệu...

                  </strong>

                  <p className="small text-secondary mb-0">

                    Vui lòng chờ Blockchain xác nhận
                    giao dịch. Không tải lại trang.

                  </p>

                </div>

              </div>

            )}

          </div>

        </div>

      )}

    </div>

  );

}

export default RevokeDocument;