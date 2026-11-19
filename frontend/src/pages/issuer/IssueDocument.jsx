import { useRef, useState } from "react";

import useAuth from "../../context/useAuth.js";

import issueApi from "../../api/issueApi.js";

import IssueResult from "../../components/IssueResult.jsx";

import "../../styles/issue-document.css";


// ================================================
// 1. CẤU HÌNH TỆP TÀI LIỆU
// ================================================

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [

  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "image/jpeg",

  "image/png",

];


const DOCUMENT_TYPES = [

  "Bằng tốt nghiệp",

  "Chứng chỉ",

  "Giấy chứng nhận",

  "Bảng điểm",

  "Hợp đồng",

  "Văn bản hành chính",

  "Tài liệu khác",

];


// ================================================
// 2. ĐỊNH DẠNG DUNG LƯỢNG
// ================================================

function formatFileSize(size) {

  if (size < 1024) {

    return `${size} B`;

  }

  if (size < 1024 * 1024) {

    return `${(size / 1024).toFixed(2)} KB`;

  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;

}


// ================================================
// 3. COMPONENT CẤP PHÁT TÀI LIỆU
// ================================================

function IssueDocument() {

  const { user } = useAuth();

  const [title, setTitle] = useState("");

  const [documentType, setDocumentType] = useState("");

  const [file, setFile] = useState(null);

  const [confirmed, setConfirmed] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [uncertain, setUncertain] = useState(false);

  const [result, setResult] = useState(null);

  const fileInputRef = useRef(null);

  const requestLock = useRef(false);

  const formLocked = loading || uncertain;


// ================================================
// 4. KIỂM TRA TỆP
// ================================================

  function handleFileChange(event) {

    const selectedFile = event.target.files?.[0];

    setError("");

    setFile(null);

    setConfirmed(false);


    if (!selectedFile) return;


    if (selectedFile.size === 0) {

      setError("Tệp tài liệu không được để trống.");

      event.target.value = "";

      return;

    }


    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {

      setError(

        "Chỉ hỗ trợ tệp PDF, Word, JPG và PNG."

      );

      event.target.value = "";

      return;

    }


    if (selectedFile.size > MAX_FILE_SIZE) {

      setError(

        "Dung lượng tệp không được vượt quá 10 MB."

      );

      event.target.value = "";

      return;

    }


    setFile(selectedFile);

  }


// ================================================
// 5. XÓA TỆP
// ================================================

  function handleRemoveFile() {

    setFile(null);

    setConfirmed(false);

    if (fileInputRef.current) {

      fileInputRef.current.value = "";

    }

  }


// ================================================
// 6. ĐẶT LẠI BIỂU MẪU
// ================================================

  function handleReset() {

    if (requestLock.current || uncertain) return;

    setTitle("");

    setDocumentType("");

    setFile(null);

    setConfirmed(false);

    setError("");

    setResult(null);

    if (fileInputRef.current) {

      fileInputRef.current.value = "";

    }

  }


// ================================================
// 7. GỬI YÊU CẦU CẤP PHÁT
// ================================================

  async function handleSubmit(event) {

    event.preventDefault();


    if (requestLock.current || uncertain) return;


    setError("");


    const cleanTitle = title.trim();


    if (!cleanTitle) {

      setError("Vui lòng nhập tên tài liệu.");

      return;

    }


    if (cleanTitle.length > 255) {

      setError(

        "Tên tài liệu không được vượt quá 255 ký tự."

      );

      return;

    }


    if (
      documentType &&
      !DOCUMENT_TYPES.includes(documentType)
    ) {

      setError("Loại tài liệu không hợp lệ.");

      return;

    }


    if (!file) {

      setError("Vui lòng chọn tệp tài liệu.");

      return;

    }


    if (!confirmed) {

      setError(

        "Vui lòng xác nhận thông tin trước khi cấp phát."

      );

      return;

    }


    // KHÓA YÊU CẦU, TRÁNH NHẤN NÚT NHIỀU LẦN

    requestLock.current = true;

    setLoading(true);


    try {

      const formData = new FormData();


      formData.append("title", cleanTitle);


      if (documentType) {

        formData.append(
          "documentType",
          documentType
        );

      }


      formData.append("file", file);


      const response =
        await issueApi.issueDocument(formData);


      if (

        !response.success ||

        !response.data ||

        !response.data.documentCode ||

        response.data.status !== "issued"

      ) {

        setUncertain(true);

        setError(

          "Chưa xác định được kết quả cấp phát. " +

          "Vui lòng kiểm tra danh sách tài liệu " +

          "trước khi thực hiện lại."

        );

        return;

      }


      setResult(response.data);


    } catch (err) {

      const status = err.response?.status;


      if (status === 400) {

        setError(

          "Thông tin hoặc tệp tài liệu không hợp lệ."

        );

      } else if (status === 401) {

        setError("Phiên đăng nhập đã hết hạn.");

      } else if (status === 403) {

        setError(

          "Tài khoản chưa được phép sử dụng " +

          "ví Blockchain để cấp phát tài liệu."

        );

      } else if (status === 413) {

        setError("Dung lượng tệp vượt quá giới hạn.");

      } else {

        setUncertain(true);

        setError(

          "Chưa xác định được kết quả giao dịch. " +

          "Giao dịch có thể đã được gửi lên Blockchain. " +

          "Không nên cấp phát lại ngay."

        );

      }

    } finally {

      requestLock.current = false;

      setLoading(false);

    }

  }


// ================================================
// 8. HIỂN THỊ KẾT QUẢ
// ================================================

  if (result) {

    return (

      <div className="issue-document-page">

        <IssueResult

          result={result}

          onReset={handleReset}

        />

      </div>

    );

  }


// ================================================
// 9. GIAO DIỆN BIỂU MẪU
// ================================================

  return (

    <div className="issue-document-page">


      {/* TIÊU ĐỀ */}

      <div className="issue-document-heading mb-4">

        <h3>Cấp phát tài liệu</h3>

        <p className="text-secondary">

          Đăng ký tài liệu mới trên hệ thống Blockchain.

        </p>

      </div>


      {/* THÔNG BÁO LỖI */}

      {error && (

        <div

          className="alert alert-danger"

          role="alert"

        >

          <i className="bi bi-exclamation-circle me-2"></i>

          {error}

        </div>

      )}


      {uncertain && (

        <div className="alert alert-warning">

          Biểu mẫu đã được khóa để tránh cấp phát trùng.

          Hãy kiểm tra dữ liệu trong trang quản lý tài liệu,

          lịch sử giao dịch hoặc liên hệ quản trị viên.

          Chỉ thực hiện lại khi đã xác định rõ kết quả

          của lần cấp phát trước.

        </div>

      )}


      {/* BIỂU MẪU */}

      <div className="card issue-form-card">

        <div className="card-header bg-white">

          <h5 className="mb-0">

            <i className="bi bi-file-earmark-text me-2"></i>

            Thông tin tài liệu

          </h5>

        </div>


        <div className="card-body">

          <form onSubmit={handleSubmit}>


            <fieldset disabled={formLocked}>


              {/* TÊN TÀI LIỆU */}

              <div className="mb-4">

                <label

                  htmlFor="document-title"

                  className="form-label"

                >

                  Tên tài liệu

                  <span className="text-danger"> *</span>

                </label>


                <input

                  id="document-title"

                  type="text"

                  className="form-control"

                  placeholder="Nhập tên tài liệu"

                  maxLength={255}

                  value={title}

                  onChange={(event) => {

                    setTitle(event.target.value);

                    setConfirmed(false);

                  }}

                  required

                />

                <div className="form-text">

                  {title.length}/255 ký tự

                </div>

              </div>


              {/* LOẠI TÀI LIỆU */}

              <div className="mb-4">

                <label

                  htmlFor="document-type"

                  className="form-label"

                >

                  Loại tài liệu

                </label>


                <select

                  id="document-type"

                  className="form-select"

                  value={documentType}

                  onChange={(event) => {

                    setDocumentType(event.target.value);

                    setConfirmed(false);

                  }}

                >

                  <option value="">

                    Chọn loại tài liệu

                  </option>


                  {DOCUMENT_TYPES.map((item) => (

                    <option

                      key={item}

                      value={item}

                    >

                      {item}

                    </option>

                  ))}

                </select>

              </div>


              {/* CHỌN TỆP */}

              <div className="mb-4">

                <label

                  htmlFor="document-file"

                  className="form-label"

                >

                  Tệp tài liệu

                  <span className="text-danger"> *</span>

                </label>


                <div className="issue-upload-box">

                  <i className="bi bi-cloud-arrow-up"></i>

                  <h6>Chọn tệp tài liệu</h6>

                  <p className="text-secondary">

                    Hỗ trợ PDF, Word, JPG và PNG.

                    Dung lượng tối đa 10 MB.

                  </p>


                  <input

                    ref={fileInputRef}

                    id="document-file"

                    type="file"

                    className="form-control"

                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"

                    onChange={handleFileChange}

                  />

                </div>


                {file && (

                  <div className="issue-selected-file mt-3">

                    <i className="bi bi-file-earmark-check text-success fs-3"></i>

                    <div className="flex-grow-1">

                      <strong>{file.name}</strong>

                      <p className="small text-secondary mb-0">

                        {formatFileSize(file.size)}

                      </p>

                    </div>


                    <button

                      type="button"

                      className="btn btn-sm btn-outline-danger"

                      onClick={handleRemoveFile}

                    >

                      <i className="bi bi-trash me-1"></i>

                      Xóa

                    </button>

                  </div>

                )}

              </div>


              {/* ĐƠN VỊ CẤP PHÁT */}

              <div className="mb-4">

                <label

                  htmlFor="issuer-organization"

                  className="form-label"

                >

                  Đơn vị cấp phát

                </label>


                <input

                  id="issuer-organization"

                  type="text"

                  className="form-control bg-light"

                  value={
                    user?.organizationName ||
                    "Chưa xác định"
                  }

                  readOnly

                />

              </div>


              {/* NGƯỜI CẤP PHÁT */}

              <div className="mb-4">

                <label

                  htmlFor="issuer-name"

                  className="form-label"

                >

                  Người cấp phát

                </label>


                <input

                  id="issuer-name"

                  type="text"

                  className="form-control bg-light"

                  value={user?.fullName || ""}

                  readOnly

                />

              </div>


              {/* THÔNG TIN BLOCKCHAIN */}

              <div className="alert alert-info">

                <i className="bi bi-info-circle me-2"></i>

                Hệ thống sẽ tính mã SHA-256 của tệp

                và ghi nhận dữ liệu trên mạng Ethereum Sepolia.

                Nội dung tệp không được lưu trực tiếp

                trên Blockchain.

              </div>


              {/* XÁC NHẬN */}

              <div className="form-check mb-4">

                <input

                  id="issue-confirm"

                  type="checkbox"

                  className="form-check-input"

                  checked={confirmed}

                  onChange={(event) =>
                    setConfirmed(event.target.checked)
                  }

                />


                <label

                  htmlFor="issue-confirm"

                  className="form-check-label"

                >

                  Tôi xác nhận thông tin tài liệu

                  là chính xác và đồng ý cấp phát.

                </label>

              </div>


              {/* NÚT THAO TÁC */}

              <div className="issue-form-actions">

                <button

                  type="button"

                  className="btn btn-outline-secondary"

                  onClick={handleReset}

                >

                  <i className="bi bi-arrow-counterclockwise me-2"></i>

                  Nhập lại

                </button>


                <button

                  type="submit"

                  className="btn btn-primary"

                  disabled={!confirmed || !file || !title.trim()}

                >

                  <i className="bi bi-file-earmark-plus me-2"></i>

                  Cấp phát tài liệu

                </button>

              </div>

            </fieldset>

          </form>


          {/* TRẠNG THÁI ĐANG XỬ LÝ */}

          {loading && (

            <div

              className="issue-processing mt-4"

              role="status"

            >

              <div className="spinner-border text-primary"></div>

              <div>

                <strong>Đang xử lý cấp phát tài liệu...</strong>

                <p className="mb-0 small text-secondary">

                  Vui lòng chờ Blockchain xác nhận giao dịch.

                  Không tải lại trang hoặc gửi thêm yêu cầu.

                </p>

              </div>

            </div>

          )}

        </div>

      </div>

    </div>

  );

}

export default IssueDocument;