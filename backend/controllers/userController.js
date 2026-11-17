
const userService = require("../services/userService");

// Xu ly loi chung
function handleError(res, error) {
    console.error(
        "User Controller Error:",
        error.code || error.name
    );

    const statusCode = [400, 401, 403, 404, 409]
        .includes(error.statusCode)
        ? error.statusCode
        : 500;

    return res.status(statusCode).json({
        success: false,
        message: statusCode === 500
            ? "Loi he thong"
            : error.message
    });
}

// Kiem tra ID
function isValidId(id) {
    return Number.isSafeInteger(id) && id > 0;
}

// Kiem tra email
function isValidEmail(email) {
    return (
        email.length <= 150 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
}

// ==========================================
// 1. DANH SACH TAI KHOAN
// ==========================================

async function getAllUsers(req, res) {
    try {
        const users = await userService.getAllUsers();

        return res.status(200).json({
            success: true,
            message: "Lay danh sach tai khoan thanh cong",
            total: users.length,
            data: users
        });

    } catch (error) {
        return handleError(res, error);
    }
}

// ==========================================
// 2. CHI TIET TAI KHOAN
// ==========================================

async function getUserById(req, res) {
    try {
        const id = Number(req.params.id);

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "ID tai khoan khong hop le"
            });
        }

        const user = await userService.getUserById(id);

        return res.status(200).json({
            success: true,
            message: "Lay thong tin tai khoan thanh cong",
            data: user
        });

    } catch (error) {
        return handleError(res, error);
    }
}

// ==========================================
// 3. TAO TAI KHOAN ISSUER
// ==========================================

async function createUser(req, res) {
    try {
        const fullName =
            typeof req.body?.fullName === "string"
                ? req.body.fullName.trim()
                : "";

        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        const password = req.body?.password;

        const organizationId =
            req.body?.organizationId;

        if (!fullName || fullName.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Ho ten khong hop le"
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Email khong hop le"
            });
        }

        if (
            typeof password !== "string" ||
            password.length < 12 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                success: false,
                message: "Mat khau phai tu 12 ky tu va khong qua 72 byte"
            });
        }

        if (!isValidId(organizationId)) {
            return res.status(400).json({
                success: false,
                message: "ID to chuc khong hop le"
            });
        }

        const user = await userService.createUser({
            fullName,
            email,
            password,
            organizationId
        });

        return res.status(201).json({
            success: true,
            message: "Tao tai khoan Issuer thanh cong",
            data: user
        });

    } catch (error) {
        return handleError(res, error);
    }
}

// ==========================================
// 4. CAP NHAT TAI KHOAN
// ==========================================

async function updateUser(req, res) {
    try {
        const id = Number(req.params.id);

        const fullName =
            typeof req.body?.fullName === "string"
                ? req.body.fullName.trim()
                : "";

        const email =
            typeof req.body?.email === "string"
                ? req.body.email.trim().toLowerCase()
                : "";

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "ID tai khoan khong hop le"
            });
        }

        if (!fullName || fullName.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Ho ten khong hop le"
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Email khong hop le"
            });
        }

        const user = await userService.updateUser(
            id,
            { fullName, email }
        );

        return res.status(200).json({
            success: true,
            message: "Cap nhat tai khoan thanh cong",
            data: user
        });

    } catch (error) {
        return handleError(res, error);
    }
}

// ==========================================
// 5. KHOA HOAC MO KHOA TAI KHOAN
// ==========================================

async function updateUserStatus(req, res) {
    try {
        const id = Number(req.params.id);
        const isActive = req.body?.isActive;

        if (!isValidId(id)) {
            return res.status(400).json({
                success: false,
                message: "ID tai khoan khong hop le"
            });
        }

        if (typeof isActive !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "isActive phai la true hoac false"
            });
        }

        const user =
            await userService.updateUserStatus(
                id,
                isActive
            );

        return res.status(200).json({
            success: true,
            message: isActive
                ? "Mo khoa tai khoan thanh cong"
                : "Khoa tai khoan thanh cong",
            data: user
        });

    } catch (error) {
        return handleError(res, error);
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus
};
