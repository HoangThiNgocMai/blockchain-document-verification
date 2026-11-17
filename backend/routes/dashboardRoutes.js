
const express = require("express");

const router = express.Router();

const dashboardController =
    require("../controllers/dashboardController");

const { authenticateToken } =
    require("../middleware/authMiddleware");

const { authorizeRoles } =
    require("../middleware/roleMiddleware");

// ==========================================
// 1. DASHBOARD ADMIN
// GET /api/dashboard/admin
// ==========================================

router.get(
    "/admin",

    authenticateToken,

    authorizeRoles("admin"),

    dashboardController.getAdminDashboard
);

// ==========================================
// 2. DASHBOARD ISSUER
// GET /api/dashboard/issuer
// ==========================================

router.get(
    "/issuer",

    authenticateToken,

    authorizeRoles("issuer"),

    dashboardController.getIssuerDashboard
);

// ==========================================
// 3. EXPORT
// ==========================================

module.exports = router;
