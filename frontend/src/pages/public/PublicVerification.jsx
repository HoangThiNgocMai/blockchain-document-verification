import { useRef, useState } from "react";

import {
    Link,
    useSearchParams
} from "react-router-dom";

import verificationApi from "../../api/verificationApi.js";


// ==========================================
// 1. CAU HINH FILE
// ==========================================

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
    "pdf",
    "doc",
    "docx",
    "jpg",
    "jpeg",
    "png"
];


// ==========================================
// 2. CAU HINH KET QUA XAC THUC
// ==========================================

const RESULT_CONFIG = {

    valid: {
        title: "TÀI LIỆU HỢP LỆ",
        message:
            "Nội dung tài liệu trùng khớp với dữ liệu Blockchain và đáp ứng điều kiện xác thực.",
        color: "success",
        icon: "bi-shield-check"
    },

    mismatch: {
        title: "TÀI LIỆU KHÔNG TRÙNG KHỚP",
        message:
            "Mã SHA-256 của file tải lên không trùng với mã đã đăng ký trên Blockchain.",
        color: "danger",
        icon: "bi-shield-x"
    },

    revoked: {
        title: "TÀI LIỆU ĐÃ BỊ THU HỒI",
        message:
            "Tài liệu đã bị thu hồi và không còn hiệu lực trong hệ thống.",
        color: "danger",
        icon: "bi-file-earmark-x"
    },

    not_found: {
        title: "KHÔNG TÌM THẤY TÀI LIỆU",
        message:
            "Không tìm thấy tài liệu trên Blockchain. Vui lòng kiểm tra lại mã tài liệu.",
        color: "warning",
        icon: "bi-search"
    },

    unauthorized_issuer: {
        title: "VÍ CẤP PHÁT KHÔNG ĐƯỢC CẤP QUYỀN",
        message:
            "Ví cấp phát tài liệu hiện không được cấp quyền trên Blockchain.",
        color: "danger",
        icon: "bi-shield-exclamation"
    },

    lookup_only: {
        title: "TÀI LIỆU ĐÃ ĐƯỢC ĐĂNG KÝ",
        message:
            "Vui lòng tải file lên để kiểm tra tính toàn vẹn của nội dung.",
        color: "info",
        icon: "bi-info-circle"
    },

    error: {
        title: "CHƯA THỂ XÁC THỰC",
        message:
            "Hệ thống chưa thể xác định kết quả. Vui lòng thử lại.",
        color: "secondary",
        icon: "bi-exclamation-triangle"
    }
};


// ==========================================
// 3. DINH DANG THOI GIAN
// ==========================================

function formatDate(value) {

    if (!value || Number.isNaN(Date.parse(value))) {
        return "Chưa cập nhật";
    }

    return new Date(value).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh"
    });
}


// ==========================================
// 4. KIEM TRA MA TAI LIEU TU URL
// ==========================================

function isValidQRCode(code) {

    return (
        typeof code === "string" &&
        code.length > 0 &&
        code.length <= 100 &&
        /^[a-zA-Z0-9_-]+$/.test(code)
    );
}


// ==========================================
// 5. COMPONENT HIEN THI TRANG THAI
// ==========================================

function ComparisonStatus({
    value,
    trueLabel = "Trùng khớp",
    falseLabel = "Không trùng khớp"
}) {

    if (value === true) {

        return (
            <span className="badge bg-success">
                <i className="bi bi-check-circle me-1"></i>
                {trueLabel}
            </span>
        );
    }

    if (value === false) {

        return (
            <span className="badge bg-danger">
                <i className="bi bi-x-circle me-1"></i>
                {falseLabel}
            </span>
        );
    }

    return (
        <span className="badge bg-secondary">
            Chưa kiểm tra
        </span>
    );
}


// ==========================================
// 6. DOC MA TAI LIEU TU DUONG DAN QR
// ==========================================

export default function PublicVerification() {

    const [searchParams, setSearchParams] =
        useSearchParams();

    const urlCode =
        searchParams.get("code");

    function clearQRCode() {

        const params =
            new URLSearchParams(searchParams);

        params.delete("code");

        setSearchParams(params, {
            replace: true
        });
    }

    return (
        <VerificationForm
            key={JSON.stringify(urlCode)}
            urlCode={urlCode}
            clearQRCode={clearQRCode}
        />
    );
}


// ==========================================
// 7. FORM XAC THUC TAI LIEU
// ==========================================

function VerificationForm({
    urlCode,
    clearQRCode
}) {

    const validQRCode =
        isValidQRCode(urlCode);

    const [documentCode, setDocumentCode] =
        useState(validQRCode ? urlCode : "");

    const [qrNotice, setQrNotice] =
        useState(
            validQRCode
                ? "Đã nhận mã tài liệu từ đường dẫn xác thực."
                : ""
        );

    const [file, setFile] =
        useState(null);

    const [result, setResult] =
        useState(null);

    const [error, setError] =
        useState(
            urlCode !== null && !validQRCode
                ? "Mã tài liệu trong đường dẫn QR không hợp lệ."
                : ""
        );

    const [loading, setLoading] =
        useState(false);

    const [action, setAction] =
        useState("");

    const [copyMessage, setCopyMessage] =
        useState("");

    const fileInputRef =
        useRef(null);

    const requestLock =
        useRef(false);


    // ======================================
    // 8. XOA KET QUA CU
    // ======================================

    function clearResult() {

        setResult(null);

        setError("");

        setCopyMessage("");
    }


    // ======================================
    // 9. THAY DOI MA TAI LIEU
    // ======================================

    function handleCodeChange(event) {

        if (requestLock.current) {
            return;
        }

        setDocumentCode(event.target.value);

        setQrNotice("");

        clearResult();
    }


    // ======================================
    // 10. CHON FILE TAI LIEU
    // ======================================

    function handleFileChange(event) {

        if (requestLock.current) {
            return;
        }

        clearResult();

        setFile(null);

        const selectedFile =
            event.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        const extension = selectedFile.name
            .split(".")
            .pop()
            .toLowerCase();

        if (
            !ALLOWED_EXTENSIONS.includes(extension)
        ) {

            setError(
                "Định dạng tài liệu không được hỗ trợ."
            );

            event.target.value = "";

            return;
        }

        if (selectedFile.size > MAX_FILE_SIZE) {

            setError(
                "Dung lượng tài liệu không được vượt quá 10 MB."
            );

            event.target.value = "";

            return;
        }

        if (selectedFile.size === 0) {

            setError(
                "Tài liệu không có nội dung."
            );

            event.target.value = "";

            return;
        }

        setFile(selectedFile);
    }


    // ======================================
    // 11. KIEM TRA MA TAI LIEU
    // ======================================

    function validateDocumentCode() {

        const code =
            documentCode.trim();

        if (!code) {

            setError(
                "Vui lòng nhập mã tài liệu."
            );

            return false;
        }

        if (!isValidQRCode(code)) {

            setError(
                "Mã tài liệu không hợp lệ."
            );

            return false;
        }

        return true;
    }


    // ======================================
    // 12. XU LY KET QUA API
    // ======================================

    function processResult(response, mode) {

        const status =
            response?.result;

        if (
            !Object.prototype.hasOwnProperty.call(
                RESULT_CONFIG,
                status
            )
        ) {

            setError(
                "Máy chủ trả về kết quả không xác định."
            );

            return;
        }

        const data = response.data;

        const consistentValid =
            mode === "verify" &&
            response.success === true &&
            response.valid === true &&
            data?.hashMatch === true &&
            data?.exists === true &&
            data?.revoked === false &&
            data?.issuerAuthorized === true &&
            /^[a-f0-9]{64}$/i.test(
                data?.uploadedHash || ""
            ) &&
            data?.uploadedHash?.toLowerCase() ===
                data?.blockchainHash?.toLowerCase();

        const inconsistentResult =
            (
                status === "valid" &&
                !consistentValid
            ) ||
            (
                status === "mismatch" &&
                (
                    mode !== "verify" ||
                    response.valid !== false ||
                    data?.hashMatch !== false
                )
            ) ||
            (
                status === "lookup_only" &&
                (
                    mode !== "lookup" ||
                    response.valid !== null
                )
            );

        if (inconsistentResult) {

            setResult({
                ...response,
                result: "error",
                valid: null
            });

            return;
        }

        setResult(response);
    }


    // ======================================
    // 13. XU LY LOI API
    // ======================================

    function handleApiError(err, mode) {

        const status =
            err.response?.status;

        const response =
            err.response?.data;

        if (
            status === 404 &&
            response?.result === "not_found"
        ) {

            processResult(response, mode);

            return;
        }

        if (
            err.code === "ECONNABORTED" ||
            err.code === "ETIMEDOUT"
        ) {

            setError(
                "Quá thời gian chờ. Vui lòng thử lại."
            );

            return;
        }

        if (!err.response) {

            setError(
                "Không thể kết nối đến máy chủ."
            );

            return;
        }

        if (
            status === 413 ||
            response?.code === "LIMIT_FILE_SIZE"
        ) {

            setError(
                "Dung lượng tài liệu vượt quá giới hạn cho phép."
            );

            return;
        }

        if (status === 415) {

            setError(
                "Định dạng tài liệu không được hỗ trợ."
            );

            return;
        }

        if (status === 400) {

            setError(
                "Mã tài liệu hoặc file tải lên không hợp lệ."
            );

            return;
        }

        if (status === 404) {

            setError(
                "Không tìm thấy đường dẫn xử lý yêu cầu."
            );

            return;
        }

        if (status === 429) {

            setError(
                "Có quá nhiều yêu cầu. Vui lòng thử lại sau."
            );

            return;
        }

        if (status >= 500) {

            setError(
                "Máy chủ gặp lỗi trong quá trình xử lý tài liệu."
            );

            return;
        }

        setError(
            "Không thể xử lý yêu cầu. Vui lòng thử lại."
        );
    }


    // ======================================
    // 14. TRA CUU TAI LIEU
    // ======================================

    async function handleLookup() {

        if (requestLock.current) {
            return;
        }

        clearResult();

        if (!validateDocumentCode()) {
            return;
        }

        requestLock.current = true;

        setLoading(true);

        setAction("lookup");

        try {

            const response =
                await verificationApi.lookup(
                    documentCode.trim()
                );

            processResult(response, "lookup");

        } catch (err) {

            handleApiError(err, "lookup");

        } finally {

            requestLock.current = false;

            setLoading(false);

            setAction("");
        }
    }


    // ======================================
    // 15. XAC THUC BANG FILE
    // ======================================

    async function handleVerify(event) {

        event.preventDefault();

        if (requestLock.current) {
            return;
        }

        clearResult();

        if (!validateDocumentCode()) {
            return;
        }

        if (!file) {

            setError(
                "Vui lòng chọn file tài liệu cần xác thực."
            );

            return;
        }

        requestLock.current = true;

        setLoading(true);

        setAction("verify");

        try {

            const response =
                await verificationApi.verify(
                    documentCode.trim(),
                    file
                );

            processResult(response, "verify");

        } catch (err) {

            handleApiError(err, "verify");

        } finally {

            requestLock.current = false;

            setLoading(false);

            setAction("");
        }
    }


    // ======================================
    // 16. SAO CHEP DU LIEU
    // ======================================

    async function handleCopy(value) {

        if (!value) {
            return;
        }

        try {

            await navigator.clipboard.writeText(
                value
            );

            setCopyMessage(
                "Đã sao chép vào bộ nhớ tạm."
            );

        } catch {

            setCopyMessage(
                "Không thể sao chép tự động. Vui lòng sao chép thủ công."
            );
        }
    }


    // ======================================
    // 17. LAM MOI FORM VA XOA MA QR
    // ======================================

    function handleReset() {

        if (requestLock.current) {
            return;
        }

        setDocumentCode("");

        setFile(null);

        setAction("");

        setQrNotice("");

        clearResult();

        if (fileInputRef.current) {

            fileInputRef.current.value = "";
        }

        clearQRCode();
    }


    // ======================================
    // 18. DU LIEU HIEN THI
    // ======================================

    const resultConfig = result
        ? RESULT_CONFIG[result.result]
        : null;

    const data = result?.data;

    const hasValidTransactionHash =
        /^0x[a-fA-F0-9]{64}$/.test(
            data?.transactionHash || ""
        );


    // ======================================
    // 19. GIAO DIEN WEBSITE
    // ======================================

    return (

        <div className="min-vh-100 bg-light d-flex flex-column">

            {/* THANH DIEU HUONG */}

            <header
                className="text-white py-3"
                style={{
                    backgroundColor: "#124a9a"
                }}
            >

                <div className="container d-flex flex-wrap justify-content-between align-items-center gap-3">

                    <Link
                        to="/"
                        className="text-white text-decoration-none fw-bold"
                    >
                        <i className="bi bi-shield-check me-2"></i>

                        XÁC THỰC TÀI LIỆU BLOCKCHAIN
                    </Link>

                    <nav className="d-flex gap-4">

                        <Link
                            to="/"
                            className="text-white text-decoration-none"
                        >
                            Trang chủ
                        </Link>

                        <Link
                            to="/login"
                            className="text-white text-decoration-none"
                        >
                            Đăng nhập
                        </Link>

                    </nav>

                </div>

            </header>


            {/* NOI DUNG CHINH */}

            <main className="container py-5 flex-grow-1">

                <div className="text-center mb-4">

                    <i
                        className="bi bi-shield-check"
                        style={{
                            fontSize: "60px",
                            color: "#124a9a"
                        }}
                    ></i>

                    <h2 className="fw-bold text-primary mt-3">
                        XÁC THỰC TÀI LIỆU
                    </h2>

                    <p className="text-muted">
                        Kiểm tra tính xác thực và toàn vẹn
                        của tài liệu bằng công nghệ Blockchain.
                    </p>

                </div>

                <div className="row justify-content-center">

                    <div className="col-lg-9 col-xl-8">


                        {/* FORM XAC THUC */}

                        <div className="card shadow-sm mb-4">

                            <div className="card-header bg-white py-3">

                                <h5 className="text-primary mb-0">

                                    <i className="bi bi-file-earmark-text me-2"></i>

                                    Thông tin tài liệu

                                </h5>

                            </div>

                            <div className="card-body p-4">


                                {/* THONG BAO NHAN MA QR */}

                                {qrNotice && (

                                    <div
                                        className="alert alert-info"
                                        role="status"
                                    >

                                        <i className="bi bi-qr-code-scan me-2"></i>

                                        {qrNotice}

                                        <div className="small mt-2">

                                            Bạn có thể tra cứu thông tin
                                            hoặc tải file lên để xác thực.

                                        </div>

                                    </div>

                                )}


                                {/* THONG BAO LOI */}

                                {error && (

                                    <div
                                        className="alert alert-danger"
                                        role="alert"
                                    >

                                        <i className="bi bi-exclamation-circle me-2"></i>

                                        {error}

                                    </div>

                                )}


                                <form onSubmit={handleVerify}>


                                    {/* NHAP MA TAI LIEU */}

                                    <div className="mb-4">

                                        <label
                                            htmlFor="documentCode"
                                            className="form-label fw-medium"
                                        >
                                            Mã tài liệu

                                            <span className="text-danger">
                                                {" "}*
                                            </span>

                                        </label>

                                        <input
                                            id="documentCode"
                                            type="text"
                                            className="form-control"
                                            placeholder="Nhập mã tài liệu DOC-..."
                                            value={documentCode}
                                            maxLength={100}
                                            disabled={loading}
                                            onChange={handleCodeChange}
                                        />

                                        <div className="form-text">

                                            Nhập mã tài liệu được cung cấp
                                            hoặc mở đường dẫn từ mã QR.

                                        </div>

                                    </div>


                                    {/* CHON FILE */}

                                    <div className="mb-4">

                                        <label
                                            htmlFor="documentFile"
                                            className="form-label fw-medium"
                                        >
                                            File tài liệu cần xác thực
                                        </label>

                                        <div className="border rounded p-4 text-center">

                                            <i
                                                className="bi bi-cloud-arrow-up text-primary"
                                                style={{
                                                    fontSize: "42px"
                                                }}
                                            ></i>

                                            <p className="text-muted mt-2">
                                                Chọn tài liệu từ thiết bị của bạn
                                            </p>

                                            <input
                                                id="documentFile"
                                                ref={fileInputRef}
                                                type="file"
                                                className="form-control"
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                                disabled={loading}
                                                onChange={handleFileChange}
                                            />

                                            <small className="text-muted d-block mt-2">

                                                PDF, Word, JPG, PNG.
                                                Dung lượng tối đa 10 MB.

                                            </small>

                                        </div>

                                    </div>


                                    {/* THONG TIN FILE */}

                                    {file && (

                                        <div className="alert alert-light border">

                                            <div className="text-break">

                                                <strong>Tên file: </strong>

                                                {file.name}

                                            </div>

                                            <div className="mt-2">

                                                <strong>Dung lượng: </strong>

                                                {(file.size / 1024).toFixed(2)} KB

                                            </div>

                                        </div>

                                    )}


                                    {/* NUT CHUC NANG */}

                                    <div className="row g-3">

                                        <div className="col-sm-6">

                                            <button
                                                type="button"
                                                className="btn btn-outline-primary w-100 py-2"
                                                disabled={loading}
                                                onClick={handleLookup}
                                            >

                                                {loading &&
                                                action === "lookup" ? (

                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>

                                                        Đang tra cứu...
                                                    </>

                                                ) : (

                                                    <>
                                                        <i className="bi bi-search me-2"></i>

                                                        Tra cứu
                                                    </>

                                                )}

                                            </button>

                                        </div>

                                        <div className="col-sm-6">

                                            <button
                                                type="submit"
                                                className="btn btn-primary w-100 py-2"
                                                disabled={loading}
                                            >

                                                {loading &&
                                                action === "verify" ? (

                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2"></span>

                                                        Đang xác thực...
                                                    </>

                                                ) : (

                                                    <>
                                                        <i className="bi bi-shield-check me-2"></i>

                                                        Xác thực tài liệu
                                                    </>

                                                )}

                                            </button>

                                        </div>

                                    </div>


                                    {/* THONG BAO DANG XU LY */}

                                    {loading && (

                                        <div
                                            className="alert alert-info mt-3 mb-0"
                                            role="status"
                                        >

                                            Hệ thống đang kiểm tra dữ liệu
                                            trên Blockchain. Vui lòng chờ.

                                        </div>

                                    )}


                                    {/* NUT LAM MOI */}

                                    <div className="text-center mt-3">

                                        <button
                                            type="button"
                                            className="btn btn-link text-secondary"
                                            disabled={loading}
                                            onClick={handleReset}
                                        >

                                            <i className="bi bi-arrow-clockwise me-2"></i>

                                            Làm mới

                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>


                        {/* KET QUA XAC THUC */}

                        {result && resultConfig && (

                            <div className="card shadow-sm mb-4">

                                <div className="card-header bg-white py-3">

                                    <h5 className="text-primary mb-0">

                                        <i className="bi bi-clipboard-check me-2"></i>

                                        {result.result === "lookup_only"
                                            ? "Kết quả tra cứu"
                                            : "Kết quả kiểm tra"}

                                    </h5>

                                </div>

                                <div
                                    className="card-body p-4"
                                    aria-live="polite"
                                >

                                    <div className={`alert alert-${resultConfig.color} text-center py-4`}>

                                        <i
                                            className={`bi ${resultConfig.icon}`}
                                            style={{
                                                fontSize: "52px"
                                            }}
                                        ></i>

                                        <h4 className="fw-bold mt-3">
                                            {resultConfig.title}
                                        </h4>

                                        <p className="mb-0">
                                            {resultConfig.message}
                                        </p>

                                    </div>


                                    {!data && result.documentCode && (

                                        <div className="border rounded p-3 text-break">

                                            <strong>Mã tài liệu: </strong>

                                            {result.documentCode}

                                        </div>

                                    )}


                                    {data && (

                                        <>

                                            <h6 className="fw-bold text-primary">
                                                Thông tin tài liệu
                                            </h6>

                                            <div className="table-responsive">

                                                <table className="table table-bordered align-middle">

                                                    <tbody>

                                                        <tr>
                                                            <th className="bg-light">
                                                                Mã tài liệu
                                                            </th>

                                                            <td className="text-break">
                                                                {data.documentCode || "Chưa cập nhật"}
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <th className="bg-light">
                                                                Tên tài liệu
                                                            </th>

                                                            <td className="text-break">
                                                                {data.title || "Chưa cập nhật"}
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <th className="bg-light">
                                                                Loại tài liệu
                                                            </th>

                                                            <td>
                                                                {data.documentType || "Chưa cập nhật"}
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <th className="bg-light">
                                                                Đơn vị cấp phát
                                                            </th>

                                                            <td>
                                                                {data.organizationName || "Chưa cập nhật"}
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <th className="bg-light">
                                                                Thời gian cấp phát
                                                            </th>

                                                            <td>
                                                                {formatDate(data.issuedAt)}
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <th className="bg-light">
                                                                Tồn tại trên Blockchain
                                                            </th>

                                                            <td>
                                                                <ComparisonStatus
                                                                    value={data.exists}
                                                                    trueLabel="Có tồn tại"
                                                                    falseLabel="Không tồn tại"
                                                                />
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <th className="bg-light">
                                                                Trạng thái tài liệu
                                                            </th>

                                                            <td>

                                                                {data.revoked === true ? (

                                                                    <span className="badge bg-danger">

                                                                        Đã thu hồi

                                                                    </span>

                                                                ) : data.exists === true &&
                                                                    data.revoked === false ? (

                                                                    <span className="badge bg-info text-dark">

                                                                        Đã đăng ký

                                                                    </span>

                                                                ) : (

                                                                    <span className="badge bg-secondary">

                                                                        Chưa xác định

                                                                    </span>

                                                                )}

                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <th className="bg-light">
                                                                Quyền ví cấp phát
                                                            </th>

                                                            <td>
                                                                <ComparisonStatus
                                                                    value={data.issuerAuthorized}
                                                                    trueLabel="Được cấp quyền"
                                                                    falseLabel="Không có quyền"
                                                                />
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <th className="bg-light">
                                                                Đối chiếu MySQL và Blockchain
                                                            </th>

                                                            <td>
                                                                <ComparisonStatus
                                                                    value={data.databaseHashMatches}
                                                                />
                                                            </td>
                                                        </tr>

                                                        <tr>
                                                            <th className="bg-light">
                                                                Ví cấp phát
                                                            </th>

                                                            <td className="small text-break">
                                                                {data.issuerAddress || "Chưa cập nhật"}
                                                            </td>
                                                        </tr>

                                                    </tbody>

                                                </table>

                                            </div>


                                            {/* DOI CHIEU SHA-256 */}

                                            <h6 className="fw-bold text-primary mt-4 mb-3">

                                                <i className="bi bi-fingerprint me-2"></i>

                                                Đối chiếu mã SHA-256

                                            </h6>


                                            {/* MA BAM BLOCKCHAIN */}

                                            <div className="border rounded p-3 mb-3">

                                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">

                                                    <strong>
                                                        Mã SHA-256 trên Blockchain
                                                    </strong>

                                                    {data.blockchainHash && (

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => handleCopy(data.blockchainHash)}
                                                        >
                                                            Sao chép
                                                        </button>

                                                    )}

                                                </div>

                                                <div className="font-monospace small text-break bg-light rounded p-2">

                                                    {data.blockchainHash || "Chưa cập nhật"}

                                                </div>

                                            </div>


                                            {/* MA BAM FILE TAI LEN */}

                                            <div className="border rounded p-3 mb-3">

                                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">

                                                    <strong>
                                                        Mã SHA-256 của file tải lên
                                                    </strong>

                                                    {data.uploadedHash && (

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-secondary"
                                                            onClick={() => handleCopy(data.uploadedHash)}
                                                        >
                                                            Sao chép
                                                        </button>

                                                    )}

                                                </div>

                                                <div className="font-monospace small text-break bg-light rounded p-2">

                                                    {data.uploadedHash ||
                                                        "Chưa tính mã SHA-256 của file"}

                                                </div>

                                            </div>


                                            {/* KET QUA SO SANH */}

                                            <div className="border rounded p-3 mb-3">

                                                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">

                                                    <strong>
                                                        Kết quả so sánh SHA-256
                                                    </strong>

                                                    <ComparisonStatus
                                                        value={data.hashMatch}
                                                    />

                                                </div>

                                            </div>


                                            {data.databaseHashMatches === false && (

                                                <div className="alert alert-warning">

                                                    Mã SHA-256 trong MySQL không
                                                    trùng với Blockchain.
                                                    Cần kiểm tra lại dữ liệu hệ thống.

                                                </div>

                                            )}


                                            {/* THONG TIN BLOCKCHAIN */}

                                            <h6 className="fw-bold text-primary mt-4">

                                                <i className="bi bi-box me-2"></i>

                                                Thông tin Blockchain

                                            </h6>

                                            <div className="border rounded p-3 mb-3">

                                                <p>

                                                    <strong>Mạng Blockchain: </strong>

                                                    Ethereum Sepolia

                                                </p>

                                                <strong>Mã giao dịch:</strong>

                                                <div className="bg-light rounded p-2 mt-2 small text-break">

                                                    {data.transactionHash ||
                                                        "Chưa đồng bộ"}

                                                </div>

                                                {hasValidTransactionHash && (

                                                    <a
                                                        href={`https://sepolia.etherscan.io/tx/${data.transactionHash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-sm btn-outline-primary mt-3"
                                                    >

                                                        <i className="bi bi-box-arrow-up-right me-2"></i>

                                                        Xem giao dịch Blockchain

                                                    </a>

                                                )}

                                            </div>


                                            {copyMessage && (

                                                <div
                                                    className="alert alert-info"
                                                    role="status"
                                                >
                                                    {copyMessage}
                                                </div>

                                            )}


                                            <p className="text-muted small mb-0">

                                                Tên tài liệu và thông tin đơn vị
                                                được lấy từ cơ sở dữ liệu.
                                                Kết quả xác thực nội dung dựa trên
                                                mã SHA-256 và trạng thái
                                                của Smart Contract.

                                            </p>

                                        </>

                                    )}

                                </div>

                            </div>

                        )}


                        {/* HUONG DAN SU DUNG */}

                        <div className="card shadow-sm">

                            <div className="card-header bg-white py-3">

                                <h5 className="text-primary mb-0">

                                    <i className="bi bi-info-circle me-2"></i>

                                    Hướng dẫn sử dụng

                                </h5>

                            </div>

                            <div className="card-body">

                                <ol>

                                    <li className="mb-2">
                                        Nhập mã tài liệu hoặc mở đường dẫn
                                        từ mã QR được cung cấp.
                                    </li>

                                    <li className="mb-2">
                                        Nhấn Tra cứu để xem thông tin đăng ký.
                                    </li>

                                    <li className="mb-2">
                                        Chọn file tài liệu cần kiểm tra.
                                    </li>

                                    <li className="mb-2">
                                        Nhấn Xác thực tài liệu.
                                    </li>

                                    <li>
                                        Xem kết quả và đối chiếu mã SHA-256.
                                    </li>

                                </ol>

                                <div className="alert alert-warning mb-0">

                                    <i className="bi bi-exclamation-triangle me-2"></i>

                                    Mã QR và thông tin tra cứu không thay thế
                                    việc xác thực nội dung file tài liệu.

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </main>


            {/* FOOTER */}

            <footer
                className="text-white text-center py-3"
                style={{
                    backgroundColor: "#124a9a"
                }}
            >

                <small>
                    Hệ thống xác thực tài liệu bằng Blockchain
                </small>

            </footer>

        </div>
    );
}