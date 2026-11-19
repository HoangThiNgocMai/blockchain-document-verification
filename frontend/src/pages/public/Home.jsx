import { Link } from "react-router-dom";
import useAuth from "../../context/useAuth.js";

import "../../styles/home.css";


// ==========================================
// 1. CAC CHUC NANG HE THONG
// ==========================================

const FEATURES = [

    {
        icon: "bi-file-earmark-check",
        title: "Cấp phát tài liệu",
        description:
            "Đăng ký mã SHA-256 của tài liệu trên Blockchain để phục vụ quá trình xác thực."
    },

    {
        icon: "bi-shield-check",
        title: "Xác thực tài liệu",
        description:
            "Kiểm tra tính toàn vẹn và phát hiện sự thay đổi nội dung của tài liệu."
    },

    {
        icon: "bi-qr-code-scan",
        title: "Tra cứu bằng mã QR",
        description:
            "Truy cập nhanh trang xác thực thông qua mã QR được tạo khi cấp phát tài liệu."
    },

    {
        icon: "bi-file-earmark-x",
        title: "Thu hồi tài liệu",
        description:
            "Cho phép người có thẩm quyền thu hồi tài liệu và cập nhật trạng thái trên Blockchain."
    }

];


// ==========================================
// 2. QUY TRINH XAC THUC
// ==========================================

const STEPS = [

    {
        icon: "bi-upc-scan",
        title: "Nhập mã tài liệu",
        description:
            "Nhập mã được cung cấp hoặc truy cập từ mã QR."
    },

    {
        icon: "bi-cloud-arrow-up",
        title: "Tải tài liệu",
        description:
            "Chọn file tài liệu cần kiểm tra từ thiết bị."
    },

    {
        icon: "bi-fingerprint",
        title: "Đối chiếu dữ liệu",
        description:
            "Hệ thống tính SHA-256 và kiểm tra dữ liệu Blockchain."
    },

    {
        icon: "bi-clipboard-check",
        title: "Nhận kết quả",
        description:
            "Hiển thị kết quả kiểm tra và trạng thái tài liệu."
    }

];


// ==========================================
// 3. DUONG DAN THEO VAI TRO
// ==========================================

function getDashboardPath(role) {

    if (role === "admin") {
        return "/admin";
    }

    if (role === "issuer") {
        return "/issuer";
    }

    return "/";
}


// ==========================================
// 4. TRANG CHU
// ==========================================

export default function Home() {

    const {
        user,
        isAuthenticated,
        logout
    } = useAuth();


    return (

        <div className="dapp-home min-vh-100 d-flex flex-column">


            {/* THANH DIEU HUONG */}

            <header className="home-header">

                <div className="container home-navbar">

                    <Link
                        to="/"
                        className="home-brand"
                    >

                        <i className="bi bi-shield-check"></i>

                        <span>
                            XÁC THỰC TÀI LIỆU BLOCKCHAIN
                        </span>

                    </Link>

                    <nav className="home-nav">

                        <Link to="/">
                            Trang chủ
                        </Link>

                        <Link to="/verify">
                            Xác thực tài liệu
                        </Link>

                        {isAuthenticated && user ? (

                            <>

                                <Link
                                    to={getDashboardPath(user.role)}
                                >
                                    Quản lý
                                </Link>

                                <span className="home-user-name">
                                    {user.fullName}
                                </span>

                                <button
                                    type="button"
                                    className="btn btn-outline-light"
                                    onClick={logout}
                                >

                                    <i className="bi bi-box-arrow-right me-2"></i>

                                    Đăng xuất

                                </button>

                            </>

                        ) : (

                            <Link
                                to="/login"
                                className="btn btn-outline-light"
                            >

                                <i className="bi bi-person-circle me-2"></i>

                                Đăng nhập

                            </Link>

                        )}

                    </nav>

                </div>

            </header>


            <main className="flex-grow-1">


                {/* GIOI THIEU HE THONG */}

                <section className="home-hero">

                    <div className="container text-center">

                        <div className="hero-icon">

                            <i className="bi bi-shield-check"></i>

                        </div>

                        <h1>
                            HỆ THỐNG XÁC THỰC TÀI LIỆU
                        </h1>

                        <h2>
                            Bằng công nghệ Blockchain (DApp)
                        </h2>

                        <p className="hero-description">

                            Hệ thống hỗ trợ cấp phát, tra cứu
                            và xác thực tính toàn vẹn của tài liệu
                            bằng công nghệ Blockchain.

                            Đồng thời giúp phát hiện tài liệu
                            bị thay đổi nội dung hoặc đã bị thu hồi.

                        </p>

                        <div className="hero-actions">

                            <Link
                                to="/verify"
                                className="btn btn-primary btn-lg"
                            >

                                <i className="bi bi-shield-check me-2"></i>

                                Xác thực tài liệu

                            </Link>

                            {isAuthenticated && user ? (

                                <Link
                                    to={getDashboardPath(user.role)}
                                    className="btn btn-outline-primary btn-lg"
                                >

                                    <i className="bi bi-grid me-2"></i>

                                    Vào khu vực quản lý

                                </Link>

                            ) : (

                                <Link
                                    to="/login"
                                    className="btn btn-outline-primary btn-lg"
                                >

                                    <i className="bi bi-box-arrow-in-right me-2"></i>

                                    Đăng nhập hệ thống

                                </Link>

                            )}

                        </div>

                        <p className="hero-note">

                            <i className="bi bi-info-circle me-2"></i>

                            Người dùng có thể xác thực tài liệu
                            mà không cần đăng nhập.

                        </p>

                    </div>

                </section>


                {/* CHUC NANG HE THONG */}

                <section className="home-section bg-white">

                    <div className="container">

                        <div className="section-heading">

                            <h2>
                                CHỨC NĂNG HỆ THỐNG
                            </h2>

                            <p>
                                Các chức năng chính của hệ thống DApp
                            </p>

                        </div>

                        <div className="row g-4">

                            {FEATURES.map((feature) => (

                                <div
                                    className="col-sm-6 col-lg-3"
                                    key={feature.title}
                                >

                                    <div className="feature-card">

                                        <div className="feature-icon">

                                            <i
                                                className={`bi ${feature.icon}`}
                                            ></i>

                                        </div>

                                        <h3>
                                            {feature.title}
                                        </h3>

                                        <p>
                                            {feature.description}
                                        </p>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                </section>


                {/* QUY TRINH XAC THUC */}

                <section className="home-section process-section">

                    <div className="container">

                        <div className="section-heading">

                            <h2>
                                QUY TRÌNH XÁC THỰC
                            </h2>

                            <p>
                                Kiểm tra tài liệu qua bốn bước đơn giản
                            </p>

                        </div>

                        <div className="row g-4">

                            {STEPS.map((step, index) => (

                                <div
                                    className="col-sm-6 col-lg-3"
                                    key={step.title}
                                >

                                    <div className="process-card">

                                        <div className="step-number">
                                            {index + 1}
                                        </div>

                                        <i
                                            className={`bi ${step.icon} process-icon`}
                                        ></i>

                                        <h3>
                                            {step.title}
                                        </h3>

                                        <p>
                                            {step.description}
                                        </p>

                                    </div>

                                </div>

                            ))}

                        </div>

                    </div>

                </section>


                {/* CONG NGHE SU DUNG */}

                <section className="home-section bg-white">

                    <div className="container">

                        <div className="section-heading">

                            <h2>
                                CÔNG NGHỆ SỬ DỤNG
                            </h2>

                        </div>

                        <div className="row g-4">

                            <div className="col-md-4">

                                <div className="technology-card">

                                    <i className="bi bi-boxes"></i>

                                    <h3>
                                        Blockchain
                                    </h3>

                                    <p>
                                        Lưu trữ mã băm và trạng thái
                                        tài liệu trên mạng Ethereum Sepolia.
                                    </p>

                                </div>

                            </div>

                            <div className="col-md-4">

                                <div className="technology-card">

                                    <i className="bi bi-fingerprint"></i>

                                    <h3>
                                        SHA-256
                                    </h3>

                                    <p>
                                        Tạo mã băm từ nội dung tài liệu
                                        để kiểm tra tính toàn vẹn.
                                    </p>

                                </div>

                            </div>

                            <div className="col-md-4">

                                <div className="technology-card">

                                    <i className="bi bi-file-earmark-code"></i>

                                    <h3>
                                        Hợp đồng thông minh
                                    </h3>

                                    <p>
                                        Xử lý quyền cấp phát, đăng ký,
                                        thu hồi và xác thực tài liệu.
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* BAT DAU XAC THUC */}

                <section className="home-cta">

                    <div className="container text-center">

                        <h2>
                            Bạn cần xác thực tài liệu?
                        </h2>

                        <p>
                            Kiểm tra thông tin và tính toàn vẹn
                            của tài liệu ngay trên hệ thống.
                        </p>

                        <Link
                            to="/verify"
                            className="btn btn-light btn-lg"
                        >

                            <i className="bi bi-shield-check me-2"></i>

                            Bắt đầu xác thực

                        </Link>

                    </div>

                </section>

            </main>


            {/* CHAN TRANG */}

            <footer className="home-footer">

                <div className="container text-center">

                    <h6>
                        Hệ thống Xác thực Tài liệu
                        bằng Blockchain (DApp)
                    </h6>

                    <p>
                        Nền tảng xác thực tài liệu phi tập trung
                    </p>

                    <small>
                        Ethereum Sepolia | SHA-256
                    </small>

                </div>

            </footer>

        </div>

    );
}