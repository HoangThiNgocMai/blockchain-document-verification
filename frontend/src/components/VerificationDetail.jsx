import { useEffect, useRef, useState } from "react";

import verificationLogApi from "../api/verificationLogApi.js";

import VerificationStatus from "./VerificationStatus.jsx";

import DocumentStatus from "./DocumentStatus.jsx";


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
// 2. NỘI DUNG KẾT QUẢ XÁC THỰC
// ================================================

const resultMessages = {

  valid:
    "Tài liệu được xác thực hợp lệ tại thời điểm kiểm tra.",

  mismatch:
    "Nội dung tệp kiểm tra không trùng khớp với dữ liệu xác thực.",

  revoked:
    "Tài liệu đã bị thu hồi tại thời điểm kiểm tra.",

  not_found:
    "Không tìm thấy tài liệu tương ứng với mã tra cứu.",

  lookup_only:
    "Người dùng chỉ tra cứu thông tin, chưa xác thực nội dung tệp.",

  error:
    "Đã xảy ra lỗi trong quá trình xác thực.",

};


// ================================================
// 3. HIỂN THỊ MỘT DÒNG THÔNG TIN
// ================================================

function InformationRow({ label, children }) {

  return (

    <div className="verification-information-row">

      <div className="verification-information-label">

        {label}

      </div>

      <div className="verification-information-value">

        {children ?? "—"}

      </div>

    </div>

  );

}


// ================================================
// 4. COMPONENT CHI TIẾT LỊCH SỬ XÁC THỰC
// ================================================

function VerificationDetail({
  verificationId,
  onClose,
}) {

  const [verification, setVerification] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [copyMessage, setCopyMessage] =
    useState("");

  const dialogRef = useRef(null);


// ================================================
// 5. MỞ CỬA SỔ CHI TIẾT
// ================================================

  useEffect(() => {

    const dialog = dialogRef.current;

    if (dialog && !dialog.open) {

      dialog.showModal();

    }

    return () => {

      if (dialog?.open) {

        dialog.close();

      }

    };

  }, []);


// ================================================
// 6. LẤY DỮ LIỆU TỪ BACKEND
// ================================================

  useEffect(() => {

    let cancelled = false;

    async function fetchVerification() {

      try {

        const response =
          await verificationLogApi.getById(
            verificationId
          );

        if (cancelled) return;

        if (

          !response.success ||

          !response.data ||

          Number(response.data.id) !==
            Number(verificationId)

        ) {

          setError(
            "Dữ liệu lịch sử xác thực không hợp lệ."
          );

          return;

        }

        setVerification(response.data);

      } catch (err) {

        if (cancelled) return;

        const status = err.response?.status;

        if (status === 401) {

          setError(
            "Phiên đăng nhập đã hết hạn."
          );

        } else if (status === 403) {

          setError(
            "Bạn không có quyền truy cập."
          );

        } else if (status === 404) {

          setError(
            "Không tìm thấy lịch sử xác thực."
          );

        } else if (!err.response) {

          setError(
            "Không thể kết nối đến máy chủ."
          );

        } else {

          setError(
            "Không thể tải chi tiết lịch sử xác thực."
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }

    fetchVerification();

    return () => {

      cancelled = true;

    };

  }, [verificationId]);


// ================================================
// 7. SAO CHÉP MÃ TRA CỨU
// ================================================

  async function handleCopy(value) {

    if (!value) return;

    try {

      await navigator.clipboard.writeText(value);

      setCopyMessage(
        "Đã sao chép mã tra cứu."
      );

    } catch {

      setCopyMessage(
        "Không thể sao chép. Vui lòng sao chép thủ công."
      );

    }

  }


// ================================================
// 8. NỘI DUNG KẾT QUẢ
// ================================================

  const resultMessage =

    verification &&
    Object.hasOwn(
      resultMessages,
      verification.result
    )

      ? resultMessages[verification.result]

      : "Chưa xác định được kết quả xác thực.";


// ================================================
// 9. GIAO DIỆN
// ================================================

  return (

    <dialog

      ref={dialogRef}

      className="verification-detail-dialog"

      aria-labelledby="verification-detail-title"

      onCancel={(event) => {

        event.preventDefault();

        onClose();

      }}

    >

      {/* TIÊU ĐỀ */}

      <div className="verification-detail-header">

        <h5

          id="verification-detail-title"

          className="mb-0"

        >

          <i className="bi bi-shield-check me-2"></i>

          Chi tiết lịch sử xác thực

        </h5>

        <button

          type="button"

          className="btn-close"

          aria-label="Đóng"

          onClick={onClose}

        ></button>

      </div>


      {/* NỘI DUNG */}

      <div className="verification-detail-body">

        {loading ? (

          <div className="text-center py-5">

            <div

              className="spinner-border text-primary"

              role="status"

              aria-label="Đang tải"

            ></div>

            <p className="text-secondary mt-3">

              Đang tải chi tiết lịch sử xác thực...

            </p>

          </div>

        ) : error ? (

          <div className="alert alert-danger">

            <i className="bi bi-exclamation-circle me-2"></i>

            {error}

          </div>

        ) : verification && (

          <>

            {/* KẾT QUẢ XÁC THỰC */}

            <div className="verification-result-box mb-4">

              <div className="mb-3">

                <VerificationStatus
                  result={verification.result}
                />

              </div>

              <p className="mb-0">

                {resultMessage}

              </p>

            </div>


            {/* THÔNG TIN XÁC THỰC */}

            <h6 className="verification-section-title">

              <i className="bi bi-clock-history me-2"></i>

              Thông tin xác thực

            </h6>


            <InformationRow label="ID lịch sử">

              {verification.id}

            </InformationRow>


            <InformationRow label="Mã tra cứu">

              <div className="verification-copy-row">

                <span className="verification-full-code">

                  {verification.searched_code || "—"}

                </span>

                {verification.searched_code && (

                  <button

                    type="button"

                    className="btn btn-sm btn-outline-primary"

                    onClick={() =>
                      handleCopy(
                        verification.searched_code
                      )
                    }

                  >

                    <i className="bi bi-copy me-1"></i>

                    Sao chép

                  </button>

                )}

              </div>

              {copyMessage && (

                <p

                  className="small text-secondary mt-2 mb-0"

                  role="status"

                >

                  {copyMessage}

                </p>

              )}

            </InformationRow>


            <InformationRow label="Kết quả xác thực">

              <VerificationStatus
                result={verification.result}
              />

            </InformationRow>


            <InformationRow label="Thời gian xác thực">

              {formatDate(verification.verified_at)}

            </InformationRow>


            {/* THÔNG TIN TÀI LIỆU */}

            <h6 className="verification-section-title mt-4">

              <i className="bi bi-file-earmark-text me-2"></i>

              Thông tin tài liệu

            </h6>


            {verification.document_id == null ||
             !verification.document_code ? (

              <div className="alert alert-warning mt-3">

                Không có thông tin tài liệu liên kết
                với lượt xác thực này.

              </div>

            ) : (

              <>

                <InformationRow label="ID tài liệu">

                  {verification.document_id}

                </InformationRow>


                <InformationRow label="Mã tài liệu">

                  <span className="verification-full-code">

                    {verification.document_code}

                  </span>

                </InformationRow>


                <InformationRow label="Tên tài liệu">

                  {verification.document_title || "—"}

                </InformationRow>


                <InformationRow label="Loại tài liệu">

                  {verification.document_type || "—"}

                </InformationRow>


                <InformationRow label="Đơn vị cấp phát">

                  {verification.organization_name || "—"}

                </InformationRow>


                <InformationRow label="Trạng thái hiện tại">

                  <DocumentStatus

                    status={verification.document_status}

                  />

                </InformationRow>

              </>

            )}


            {/* GHI CHÚ */}

            <div className="alert alert-info mt-4 mb-0">

              <i className="bi bi-info-circle me-2"></i>

              Kết quả xác thực phản ánh trạng thái tại
              thời điểm kiểm tra. Trạng thái tài liệu
              hiện tại có thể đã thay đổi.

            </div>

          </>

        )}

      </div>


      {/* NÚT ĐÓNG */}

      <div className="verification-detail-footer">

        <button

          type="button"

          className="btn btn-secondary"

          onClick={onClose}

        >

          Đóng

        </button>

      </div>

    </dialog>

  );

}

export default VerificationDetail;