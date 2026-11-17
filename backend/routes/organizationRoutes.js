
// ================================================
// ORGANIZATION ROUTES
// ================================================

const express = require("express");

const router = express.Router();

// Import Controllers
const organizationController = require(
    "../controllers/organizationController"
);

const organizationBlockchainController = require(
    "../controllers/organizationBlockchainController"
);

const organizationPermissionController = require(
    "../controllers/organizationPermissionController"
);

// Import Middleware
const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

// ================================================
// XAC THUC VA PHAN QUYEN ADMIN
// ================================================

router.use(
    authenticateToken,
    authorizeRoles("admin")
);

// ================================================
// 1. LAY DANH SACH TO CHUC
// ================================================

router.get(
    "/",
    organizationController.getAllOrganizations
);

// ================================================
// 2. KIEM TRA TRANG THAI BLOCKCHAIN
// ================================================

router.get(
    "/:id/blockchain-status",
    organizationBlockchainController.getBlockchainStatus
);

// ================================================
// 3. LAY CHI TIET TO CHUC
// ================================================

router.get(
    "/:id",
    organizationController.getOrganizationById
);

// ================================================
// 4. THEM TO CHUC
// ================================================

router.post(
    "/",
    organizationController.createOrganization
);

// ================================================
// 5. CAP NHAT TO CHUC
// ================================================

router.put(
    "/:id",
    organizationController.updateOrganization
);

// ================================================
// 6. CAP QUYEN TO CHUC
// ================================================

router.post(
    "/:id/authorize",
    organizationPermissionController.authorizeOrganization
);

// ================================================
// 7. HUY QUYEN TO CHUC
// ================================================

router.post(
    "/:id/deauthorize",
    organizationPermissionController.deauthorizeOrganization
);

// ================================================
// EXPORT ROUTER
// ================================================

module.exports = router;
