
const express = require("express");

const router = express.Router();

// Import middleware kiem tra quyen
const issuerAuth = require(
    "../middleware/issuerAuth"
);

// Import middleware upload
const upload = require(
    "../middleware/upload"
);

// Import Controller
const documentController = require(
    "../controllers/documentController"
);

// API cap phat tai lieu
router.post(
    "/issue",

    issuerAuth,

    upload.single("file"),

    documentController.issueDocument
);

module.exports = router;
