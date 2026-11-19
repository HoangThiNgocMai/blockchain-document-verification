const express = require("express");

const router = express.Router();

const issuerVerificationController = require(
  "../controllers/issuerVerificationController"
);

// Middleware xác thực
const { authenticateToken } = require(
  "../middleware/authMiddleware"
);

// Middleware phân quyền
const { authorizeRoles } = require(
  "../middleware/roleMiddleware"
);

// ============================================
// 1. PHÂN QUYỀN NGƯỜI CẤP PHÁT
// ============================================

router.use(
  authenticateToken,
  authorizeRoles("issuer")
);

// ============================================
// 2. THỐNG KÊ XÁC THỰC
// ============================================

router.get(
  "/statistics",
  issuerVerificationController.getStatistics
);

// ============================================
// 3. DANH SÁCH LỊCH SỬ XÁC THỰC
// ============================================

router.get(
  "/",
  issuerVerificationController.getAllVerifications
);

// ============================================
// 4. XUẤT ROUTER
// ============================================

module.exports = router;