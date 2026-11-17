
// ==========================================
// ORGANIZATION CONTROLLER
// ==========================================

const organizationService = require(
    "../services/organizationService"
);

// Xu ly loi
function handleError(res, error) {
    console.error(
        "Organization Error:",
        error.code || error.name
    );

    const statusCode = [400, 404, 409]
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
function validateId(value) {
    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {
        const error = new Error(
            "ID to chuc khong hop le"
        );
        error.statusCode = 400;
        throw error;
    }

    return id;
}

// 1. Danh sach to chuc
async function getAllOrganizations(req, res) {
    try {
        const organizations =
            await organizationService
                .getAllOrganizations();

        return res.status(200).json({
            success: true,
            message: "Lay danh sach to chuc thanh cong",
            total: organizations.length,
            data: organizations
        });

    } catch (error) {
        return handleError(res, error);
    }
}

// 2. Chi tiet to chuc
async function getOrganizationById(req, res) {
    try {
        const id = validateId(req.params.id);

        const organization =
            await organizationService
                .getOrganizationById(id);

        return res.status(200).json({
            success: true,
            message: "Lay thong tin to chuc thanh cong",
            data: organization
        });

    } catch (error) {
        return handleError(res, error);
    }
}

// 3. Them to chuc moi
async function createOrganization(req, res) {
    try {
        const { name, walletAddress } = req.body || {};

        const organization =
            await organizationService
                .createOrganization(
                    name,
                    walletAddress
                );

        return res.status(201).json({
            success: true,
            message: "Them to chuc thanh cong",
            data: organization
        });

    } catch (error) {
        return handleError(res, error);
    }
}

// 4. Cap nhat to chuc
async function updateOrganization(req, res) {
    try {
        const id = validateId(req.params.id);
        const { name } = req.body || {};

        const organization =
            await organizationService
                .updateOrganization(id, name);

        return res.status(200).json({
            success: true,
            message: "Cap nhat to chuc thanh cong",
            data: organization
        });

    } catch (error) {
        return handleError(res, error);
    }
}

module.exports = {
    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization
};
