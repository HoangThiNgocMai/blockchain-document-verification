
const express = require("express");

const router = express.Router();

const issuerAuth = require("../middleware/issuerAuth");

const revocationController = require(
    "../controllers/revocationController"
);

router.post(
    "/revoke",
    issuerAuth,
    revocationController.revokeDocument
);

module.exports = router;
