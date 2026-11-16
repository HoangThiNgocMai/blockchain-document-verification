
const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const verificationController = require(
    "../controllers/verificationController"
);


// ==========================================
// 1. API XAC THUC TAI LIEU BANG FILE
// ==========================================

router.post(
    "/verify",
    upload.single("file"),
    verificationController.verifyDocument
);


// ==========================================
// 2. API TRA CUU TAI LIEU BANG MA
// ==========================================

router.get(
    "/lookup/:documentCode",
    verificationController.lookupDocument
);


// ==========================================
// 3. EXPORT ROUTER
// ==========================================

module.exports = router;

