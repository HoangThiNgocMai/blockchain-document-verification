
const express = require("express");

const router = express.Router();

const userController = require(
    "../controllers/userController"
);

const { authenticateToken } = require(
    "../middleware/authMiddleware"
);

const { authorizeRoles } = require(
    "../middleware/roleMiddleware"
);

// Tat ca API quan ly tai khoan
// deu yeu cau dang nhap va quyen Admin

router.use(
    authenticateToken,
    authorizeRoles("admin")
);

// Lay danh sach tai khoan
router.get(
    "/",
    userController.getAllUsers
);

// Lay chi tiet tai khoan
router.get(
    "/:id",
    userController.getUserById
);

// Tao tai khoan Issuer
router.post(
    "/",
    userController.createUser
);

// Cap nhat tai khoan
router.put(
    "/:id",
    userController.updateUser
);

// Khoa hoac mo khoa tai khoan
router.patch(
    "/:id/status",
    userController.updateUserStatus
);

module.exports = router;
