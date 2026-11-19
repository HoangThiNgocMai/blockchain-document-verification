const express = require("express");

const router = express.Router();

const transactionController =
    require("../controllers/transactionController");

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
// 2. LAY DANH SACH GIAO DICH
// GET /api/transactions
// ================================================

router.get(

    "/",

    transactionController.getAllTransactions

);


// ================================================
// 3. THONG KE GIAO DICH
// GET /api/transactions/statistics
// ================================================

router.get(

    "/statistics",

    transactionController.getStatistics

);


// ================================================
// 4. LAY CHI TIET GIAO DICH
// GET /api/transactions/:type/:id
// ================================================

router.get(

    "/:type/:id",

    transactionController.getTransactionById

);


// ================================================
// 5. EXPORT
// ================================================

module.exports = router;