
const express = require("express");

const router = express.Router();

const documentController =
    require("../controllers/documentController");

const upload =
    require("../middleware/upload");

const issuerAuth =
    require("../middleware/issuerAuth");

const { authenticateToken } =
    require("../middleware/authMiddleware");

const { authorizeRoles } =
    require("../middleware/roleMiddleware");


// ==========================================
// CAP PHAT TAI LIEU
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
// EXPORT
// ==========================================

module.exports = router;
