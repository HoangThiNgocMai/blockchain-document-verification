
// ================================================
// ORGANIZATION PERMISSION CONTROLLER
// ================================================

const permissionService = require(
    "../services/organizationPermissionService"
);

// ================================================
// XU LY YEU CAU THAY DOI QUYEN
// ================================================

async function handlePermission(
    req,
    res,
    authorized
) {

    try {

        const rawId = req.params.id;

        if (!/^[1-9]\d*$/.test(rawId)) {
            return res.status(400).json({
                success: false,
                message: "ID to chuc khong hop le"
            });
        }

        const organizationId = Number(rawId);

        if (!Number.isSafeInteger(organizationId)) {
            return res.status(400).json({
                success: false,
                message: "ID to chuc khong hop le"
            });
        }

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Ban chua dang nhap"
            });
        }

        if (req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Ban khong co quyen"
            });
        }

        const adminId = req.user.id;

        // Goi Service
        const result = authorized

            ? await permissionService
                .authorizeOrganization(
                    organizationId,
                    adminId
                )

            : await permissionService
                .deauthorizeOrganization(
                    organizationId,
                    adminId
                );

        if (
            !result.synced ||
            !result.requestedStateReached
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Giao dich da xac nhan nhung " +
                    "trang thai can duoc kiem tra lai",
                data: result
            });
        }

        return res.status(200).json({

            success: true,

            message: authorized
                ? "Cap quyen to chuc thanh cong"
                : "Huy quyen to chuc thanh cong",

            data: result
        });

    } catch (error) {

        console.error(
            "Organization Permission Error:",
            error.code || error.name
        );

        const allowedStatusCodes = [
            400,
            401,
            403,
            404,
            409,
            502,
            503
        ];

        const statusCode =
            allowedStatusCodes.includes(
                error.statusCode
            )
                ? error.statusCode
                : 500;

        return res.status(statusCode).json({

            success: false,

            message: error.transactionHash
                ? "Can kiem tra lai trang thai giao dich"
                : statusCode === 500
                    ? "Loi xu ly quyen to chuc"
                    : error.message,

            transactionHash:
                error.transactionHash || null,

            chainConfirmed:
                error.chainConfirmed || false
        });
    }
}

// ================================================
// CAP QUYEN
// ================================================

async function authorizeOrganization(req, res) {

    return handlePermission(
        req,
        res,
        true
    );
}

// ================================================
// HUY QUYEN
// ================================================

async function deauthorizeOrganization(req, res) {

    return handlePermission(
        req,
        res,
        false
    );
}

// ================================================
// EXPORT CONTROLLER
// ================================================

module.exports = {
    authorizeOrganization,
    deauthorizeOrganization
};
