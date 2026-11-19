import { useState } from "react";
import { Link } from "react-router-dom";


// ================================================
// 1. DÒNG THÔNG TIN
// ================================================

function InformationRow({ label, children }) {

  return (

    <div className="issue-information-row">

      <div className="issue-information-label">

        {label}

      </div>

      <div className="issue-information-value">

        {children ?? "—"}

      </div>

    </div>

  );

}


// ================================================
// 2. KẾT QUẢ CẤP PHÁT
// ================================================

function IssueResult({ result, onReset }) {

  const [message, setMessage] = useState("");


// ================================================
// 3. SAO CHÉP THÔNG TIN
// ================================================

  async function handleCopy(value) {

    if (!value) return;

    try {

      await navigator.clipboard.writeText(value);

      setMessage("Đã sao chép thông tin.");

    } catch {

      setMessage(
        "Không thể sao chép. Vui lòng sao chép thủ công."
      );

    }

  }


// ================================================
// 4. KIỂM TRA MÃ GIAO DỊCH VÀ QR
// ================================================

  const validTransactionHash =

    typeof result.transactionHash === "string" &&

    /^0x[a-fA-F0-9]{64}$/.test(
      result.transactionHash
    );


  const explorerUrl = validTransactionHash

    ? `https://sepolia.etherscan.io/tx/${result.transactionHash}`

    : null;


  const validQRCode =

    typeof result.qrCode === "string" &&

    /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(
      result.qrCode
    );


  const validVerifyUrl =

    typeof result.verifyUrl === "string" &&

    /^https?:\/\//i.test(result.verifyUrl);


// ================================================
// 5. GIAO DIỆN
// ================================================

  return (

    <div className="card issue-result-card">


      {/* THÔNG BÁO THÀNH CÔNG */}

      <div className="card-body">

        <div className="issue-success-heading">

          <i className="bi bi-check-circle-fill"></i>

          <h4>Cấp phát tài liệu thành công!</h4>

          <p className="text-secondary">

            Tài liệu đã được ghi nhận trên Blockchain.

          </p>

        </div>


        <div className="row g-4">


          {/* THÔNG TIN TÀI LIỆU */}

          <div className="col-lg-8">

            <h5 className="issue-section-title">

              Thông tin tài liệu

            </h5>


            <InformationRow label="Mã tài liệu">

              <div className="issue-copy-group">

                <span className="issue-code">

                  {result.documentCode}

                </span>

                <button

                  type="button"

                  className="btn btn-sm btn-outline-primary"

                  onClick={() =>
                    handleCopy(result.documentCode)
                  }

                >

                  <i className="bi bi-copy"></i>

                </button>

              </div>

            </InformationRow>


            <InformationRow label="Tên tài liệu">

              {result.title || "—"}

            </InformationRow>


            <InformationRow label="Loại tài liệu">

              {result.documentType || "—"}

            </InformationRow>


            <InformationRow label="Mã SHA-256">

              <div className="issue-copy-group">

                <span className="issue-code">

                  {result.fileHash || "—"}

                </span>

                {result.fileHash && (

                  <button

                    type="button"

                    className="btn btn-sm btn-outline-primary"

                    onClick={() =>
                      handleCopy(result.fileHash)
                    }

                  >

                    <i className="bi bi-copy"></i>

                  </button>

                )}

              </div>

            </InformationRow>


            <InformationRow label="Địa chỉ ví cấp phát">

              <span className="issue-code">

                {result.issuerAddress || "—"}

              </span>

            </InformationRow>


            <InformationRow label="Mã giao dịch">

              <span className="issue-code">

                {result.transactionHash || "—"}

              </span>


              {explorerUrl && (

                <div className="mt-2">

                  <a

                    href={explorerUrl}

                    target="_blank"

                    rel="noopener noreferrer"

                  >

                    Xem giao dịch trên Blockchain

                    <i className="bi bi-box-arrow-up-right ms-2"></i>

                  </a>

                </div>

              )}

            </InformationRow>


            <InformationRow label="Số khối">

              {result.blockNumber ?? "—"}

            </InformationRow>


            <InformationRow label="Mạng Blockchain">

              Ethereum Sepolia

            </InformationRow>


            <InformationRow label="Trạng thái">

              <span className="badge text-bg-success">

                Đã cấp phát

              </span>

            </InformationRow>


            {message && (

              <div

                className="small text-secondary mt-3"

                role="status"

              >

                {message}

              </div>

            )}

          </div>


          {/* MÃ QR */}

          <div className="col-lg-4">

            <div className="issue-qr-box">

              <h5>Mã QR xác thực</h5>


              {validQRCode ? (

                <>

                  <img

                    src={result.qrCode}

                    alt="Mã QR xác thực tài liệu"

                    className="issue-qr-image"

                  />

                  <p className="small text-secondary">

                    Quét mã QR để truy cập trang

                    xác thực tài liệu.

                  </p>


                  <a

                    href={result.qrCode}

                    download={`${result.documentCode}.png`}

                    className="btn btn-outline-primary w-100"

                  >

                    <i className="bi bi-download me-2"></i>

                    Tải mã QR

                  </a>

                </>

              ) : (

                <p className="text-secondary">

                  Chưa có mã QR.

                </p>

              )}


              {validVerifyUrl && (

                <>

                  <button

                    type="button"

                    className="btn btn-outline-secondary w-100 mt-2"

                    onClick={() =>
                      handleCopy(result.verifyUrl)
                    }

                  >

                    <i className="bi bi-link-45deg me-2"></i>

                    Sao chép liên kết

                  </button>


                  <p className="small issue-code mt-3 mb-0">

                    {result.verifyUrl}

                  </p>

                </>

              )}

            </div>

          </div>

        </div>


        {/* THAO TÁC */}

        <div className="issue-result-actions mt-4">

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

            onClick={onReset}

          >

            <i className="bi bi-plus-circle me-2"></i>

            Cấp phát tài liệu khác

          </button>

        </div>

      </div>

    </div>

  );

}

export default IssueResult;