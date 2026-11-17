
const express = require("express");

const router = express.Router();

const documentController =
    require("../controllers/documentController");

const documentQueryController =
    require("../controllers/documentQueryController");

const upload =
    require("../middleware/upload");

const issuerAuth =
    require("../middleware/issuerAuth");

const { authenticateToken } =
    require("../middleware/authMiddleware");

const { authorizeRoles } =
    require("../middleware/roleMiddleware");

// ==========================================
// 1. CAP PHAT TAI LIEU
// POST /api/documents/issue
// ==========================================

router.post(
    "/issue",

    authenticateToken,

    authorizeRoles("issuer"),

    issuerAuth,

    upload.single("file"),

    documentController.issueDocument
);

// ==========================================
// 2. LAY DANH SACH TAI LIEU
// GET /api/documents
// ==========================================

router.get(
    "/",

    authenticateToken,

    authorizeRoles("admin", "issuer"),

    documentQueryController.getAllDocuments
);

// ==========================================
// 3. LAY LICH SU GIAO DICH BLOCKCHAIN
// GET /api/documents/:id/transactions
// ==========================================

router.get(
    "/:id/transactions",

    authenticateToken,

    authorizeRoles("admin", "issuer"),

    documentQueryController.getDocumentTransactions
);

// ==========================================
// 4. LAY LICH SU XAC THUC TAI LIEU
// GET /api/documents/:id/verifications
// ==========================================

router.get(
    "/:id/verifications",

    authenticateToken,

    authorizeRoles("admin", "issuer"),

    documentQueryController.getDocumentVerifications
);

// ==========================================
// 5. LAY CHI TIET TAI LIEU
// GET /api/documents/:id
// ==========================================

router.get(
    "/:id",

    authenticateToken,

    authorizeRoles("admin", "issuer"),

    documentQueryController.getDocumentById
);

// ==========================================
// 6. EXPORT
// ==========================================

module.exports = router;
