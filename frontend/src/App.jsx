import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    Navigate
} from "react-router-dom";

// ==========================================
// QUẢN LÝ PHIÊN ĐĂNG NHẬP
// ==========================================

import useAuth from "./context/useAuth.js";

// ==========================================
// THÀNH PHẦN DÙNG CHUNG
// ==========================================

import Loading from "./components/Loading.jsx";

// ==========================================
// PHÂN QUYỀN
// ==========================================

import ProtectedRoute from "./routes/ProtectedRoute.jsx";

// ==========================================
// BỐ CỤC WEBSITE
// ==========================================

import AdminLayout from "./layouts/AdminLayout.jsx";
import IssuerLayout from "./layouts/IssuerLayout.jsx";

// ==========================================
// TRANG CÔNG KHAI
// ==========================================

import Home from "./pages/public/Home.jsx";
import Login from "./pages/public/Login.jsx";
import Forbidden from "./pages/public/Forbidden.jsx";
import PublicVerification from "./pages/public/PublicVerification.jsx";

// ==========================================
// TRANG QUẢN TRỊ VIÊN
// ==========================================

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import Organizations from "./pages/admin/Organizations.jsx";
import Users from "./pages/admin/Users.jsx";
import Documents from "./pages/admin/Documents.jsx";
import Transactions from "./pages/admin/Transactions.jsx";
import Verifications from "./pages/admin/Verifications.jsx";

// ==========================================
// TRANG NGƯỜI CẤP PHÁT
// ==========================================

import IssuerDashboard from "./pages/issuer/IssuerDashboard.jsx";
import IssueDocument from "./pages/issuer/IssueDocument.jsx";
import IssuerDocuments from "./pages/issuer/IssuerDocuments.jsx";
import RevokeDocument from "./pages/issuer/RevokeDocument.jsx";
import IssuerTransactions from "./pages/issuer/IssuerTransactions.jsx";
import IssuerVerifications from "./pages/issuer/IssuerVerifications.jsx";


// ==========================================
// 1. XÁC ĐỊNH ĐƯỜNG DẪN THEO VAI TRÒ
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
// 2. TRANG KHÔNG TỒN TẠI
// ==========================================

function NotFound() {
    return (
        <div className="container text-center py-5">

            <h1
                className="text-primary fw-bold"
                style={{ fontSize: "80px" }}
            >
                404
            </h1>

            <h3>Không tìm thấy trang</h3>

            <p className="text-secondary">
                Trang bạn đang truy cập không tồn tại.
            </p>

            <Link to="/" className="btn btn-primary">
                <i className="bi bi-house-door me-2"></i>
                Quay về trang chủ
            </Link>

        </div>
    );
}


// ==========================================
// 3. ĐIỀU HƯỚNG ĐĂNG NHẬP
// ==========================================

function LoginRoute() {
    const {
        user,
        isAuthenticated
    } = useAuth();

    if (isAuthenticated && user) {
        return (
            <Navigate
                to={getDashboardPath(user.role)}
                replace
            />
        );
    }

    return <Login />;
}


// ==========================================
// 4. CẤU HÌNH ĐƯỜNG DẪN WEBSITE
// ==========================================

function App() {
    const { loading } = useAuth();

    // KIỂM TRA PHIÊN ĐĂNG NHẬP

    if (loading) {
        return (
            <Loading
                message="Đang kiểm tra phiên đăng nhập..."
            />
        );
    }

    return (
        <BrowserRouter>

            <Routes>

                {/* ==================================
                    4.1. TRANG CÔNG KHAI
                ================================== */}

                {/* TRANG CHỦ */}

                <Route
                    path="/"
                    element={<Home />}
                />

                {/* XÁC THỰC TÀI LIỆU CÔNG KHAI */}

                <Route
                    path="/verify"
                    element={<PublicVerification />}
                />

                {/* ĐĂNG NHẬP */}

                <Route
                    path="/login"
                    element={<LoginRoute />}
                />

                {/* KHÔNG CÓ QUYỀN TRUY CẬP */}

                <Route
                    path="/403"
                    element={<Forbidden />}
                />


                {/* ==================================
                    4.2. KHU VỰC QUẢN TRỊ VIÊN
                ================================== */}

                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["admin"]}
                        />
                    }
                >

                    <Route
                        path="/admin"
                        element={<AdminLayout />}
                    >

                        {/* TRANG TỔNG QUAN */}

                        <Route
                            index
                            element={<AdminDashboard />}
                        />

                        {/* QUẢN LÝ ĐƠN VỊ CẤP PHÁT */}

                        <Route
                            path="organizations"
                            element={<Organizations />}
                        />

                        {/* QUẢN LÝ TÀI KHOẢN */}

                        <Route
                            path="users"
                            element={<Users />}
                        />

                        {/* QUẢN LÝ TÀI LIỆU */}

                        <Route
                            path="documents"
                            element={<Documents />}
                        />

                        {/* GIAO DỊCH BLOCKCHAIN */}

                        <Route
                            path="transactions"
                            element={<Transactions />}
                        />

                        {/* LỊCH SỬ XÁC THỰC */}

                        <Route
                            path="verifications"
                            element={<Verifications />}
                        />

                    </Route>

                </Route>


                {/* ==================================
                    4.3. KHU VỰC NGƯỜI CẤP PHÁT
                ================================== */}

                <Route
                    element={
                        <ProtectedRoute
                            allowedRoles={["issuer"]}
                        />
                    }
                >

                    <Route
                        path="/issuer"
                        element={<IssuerLayout />}
                    >

                        {/* TRANG TỔNG QUAN */}

                        <Route
                            index
                            element={<IssuerDashboard />}
                        />

                        {/* CẤP PHÁT TÀI LIỆU */}

                        <Route
                            path="documents/issue"
                            element={<IssueDocument />}
                        />

                        {/* TÀI LIỆU ĐÃ CẤP PHÁT */}

                        <Route
                            path="documents"
                            element={<IssuerDocuments />}
                        />

                        {/* THU HỒI TÀI LIỆU */}

                        <Route
                            path="documents/revoke"
                            element={<RevokeDocument />}
                        />

                        {/* LỊCH SỬ GIAO DỊCH */}

                        <Route
                            path="transactions"
                            element={<IssuerTransactions />}
                        />

                        {/* LỊCH SỬ XÁC THỰC */}

                        <Route
                            path="verifications"
                            element={<IssuerVerifications />}
                        />

                    </Route>

                </Route>


                {/* ==================================
                    4.4. TRANG KHÔNG TỒN TẠI
                ================================== */}

                <Route
                    path="*"
                    element={<NotFound />}
                />

            </Routes>

        </BrowserRouter>
    );
}


// ==========================================
// 5. EXPORT
// ==========================================

export default App;