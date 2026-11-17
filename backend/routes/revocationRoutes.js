
const express = require("express");

const router = express.Router();

const revocationController =
    require("../controllers/revocationController");

const issuerAuth =
    require("../middleware/issuerAuth");

const { authenticateToken } =
    require("../middleware/authMiddleware");

const { authorizeRoles } =
    require("../middleware/roleMiddleware");


// ==========================================
// THU HOI TAI LIEU
// POST /api/revocation/revoke
// ==========================================

router.post(
    "/revoke",

    authenticateToken,

    authorizeRoles("issuer"),

    issuerAuth,

    revocationController.revokeDocument
);


// ==========================================
// EXPORT
// ==========================================

module.exports = router;
