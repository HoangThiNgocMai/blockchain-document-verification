
const express = require("express");

const router = express.Router();

const authController = require(
    "../controllers/authController"
);

const { authenticateToken } = require(
    "../middleware/authMiddleware"
);

const { authorizeRoles } = require(
    "../middleware/roleMiddleware"
);


// ==========================================
// 1. DANG NHAP HE THONG
// POST /api/auth/login
// Quyen truy cap: Cong khai
// ==========================================

router.post(
    "/login",
    authController.login
);


// ==========================================
// 2. LAY THONG TIN NGUOI DUNG DANG NHAP
// GET /api/auth/me
// Quyen truy cap: Admin va Issuer
// ==========================================

router.get(
    "/me",

    authenticateToken,

    authController.getMe
);


// ==========================================
// 3. KIEM TRA QUYEN ADMIN
// GET /api/auth/admin-test
// Quyen truy cap: Admin
// ==========================================

router.get(
    "/admin-test",

    authenticateToken,

    authorizeRoles("admin"),

    (req, res) => {

        return res.status(200).json({

            success: true,

            message: "Ban co quyen Admin",

            user: req.user

        });

    }
);


// ==========================================
// 4. KIEM TRA QUYEN ISSUER
// GET /api/auth/issuer-test
// Quyen truy cap: Issuer
// ==========================================

router.get(
    "/issuer-test",

    authenticateToken,

    authorizeRoles("issuer"),

    (req, res) => {

        return res.status(200).json({

            success: true,

            message: "Ban co quyen Issuer",

            user: req.user

        });

    }
);


// ==========================================
// 5. EXPORT ROUTER
// ==========================================

module.exports = router;

