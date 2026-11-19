const express = require("express");

const router = express.Router();

const issuerTransactionController = require(
  "../controllers/issuerTransactionController"
);

const { authenticateToken } = require(
  "../middleware/authMiddleware"
);

const { authorizeRoles } = require(
  "../middleware/roleMiddleware"
);

// ============================================
// 1. XÁC THỰC VÀ PHÂN QUYỀN
// ============================================

router.use(
  authenticateToken,
  authorizeRoles("issuer")
);

// ============================================
// 2. THỐNG KÊ GIAO DỊCH
// ============================================

router.get(
  "/statistics",
  issuerTransactionController.getStatistics
);

// ============================================
// 3. DANH SÁCH GIAO DỊCH
// ============================================

router.get(
  "/",
  issuerTransactionController.getAllTransactions
);

module.exports = router;