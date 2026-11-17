
// ================================================
// ORGANIZATION BLOCKCHAIN CONTROLLER
// ================================================

const organizationBlockchainService = require(
    "../services/organizationBlockchainService"
);

// ================================================
// KIEM TRA TRANG THAI UY QUYEN
// ================================================

async function getBlockchainStatus(req, res) {

    try {

        const rawId = req.params.id;

        // Kiem tra ID
        if (!/^[1-9]\d*$/.test(rawId)) {

            return res.status(400).json({
                success: false,
                message: "ID to chuc khong hop le"
            });
        }

        const id = Number(rawId);

        if (!Number.isSafeInteger(id)) {

            return res.status(400).json({
                success: false,
                message: "ID to chuc khong hop le"
            });
        }

        // Goi Service
        const result =
            await organizationBlockchainService
                .getBlockchainStatus(id);

        // Tra ve ket qua
        return res.status(200).json({

            success: true,

            message:
                "Kiem tra trang thai Blockchain thanh cong",

            data: result
        });

    } catch (error) {

        console.error(
            "Organization Blockchain Error:",
            error.code || error.name
        );

        const statusCode =
            [400, 404, 503].includes(error.statusCode)
                ? error.statusCode
                : 500;

        return res.status(statusCode).json({

            success: false,

            message: statusCode === 500
                ? "Loi kiem tra trang thai Blockchain"
                : error.message
        });
    }
}

// ================================================
// EXPORT CONTROLLER
// ================================================

module.exports = {
    getBlockchainStatus
};
