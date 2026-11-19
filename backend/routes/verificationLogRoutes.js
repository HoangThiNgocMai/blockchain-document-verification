const express = require("express");

const router = express.Router();

const verificationLogController =
    require("../controllers/verificationLogController");

const { authenticateToken } =
    require("../middleware/authMiddleware");

const { authorizeRoles } =
    require("../middleware/roleMiddleware");


// ================================================
// 1. KIEM TRA DANG NHAP VA PHAN QUYEN
// ================================================

router.use(

    authenticateToken,

    authorizeRoles("admin")

);


// ================================================
// 2. LAY DANH SACH LICH SU XAC THUC
// GET /api/verification-logs
// ================================================

router.get(

    "/",

    verificationLogController.getAllVerificationLogs

);


// ================================================
// 3. LAY THONG KE XAC THUC
// GET /api/verification-logs/statistics
// ================================================

router.get(

    "/statistics",

    verificationLogController.getStatistics

);


// ================================================
// 4. LAY CHI TIET LICH SU XAC THUC
// GET /api/verification-logs/:id
// ================================================

router.get(

    "/:id",

    verificationLogController.getVerificationLogById

);


// ================================================
// 5. EXPORT
// ================================================

module.exports = router;