
const revocationService = require(
    "../services/revocationService"
);


// ==========================================
// 1. THU HOI TAI LIEU
// ==========================================

async function revokeDocument(req, res) {

    try {

        // Lay ma tai lieu
        const documentCode = String(
            req.body?.documentCode || ""
        ).trim();


        // Kiem tra ma tai lieu
        if (!documentCode || documentCode.length > 100) {

            return res.status(400).json({
                success: false,
                message: "Ma tai lieu khong hop le"
            });

        }


        // Kiem tra quyen Issuer
        if (!req.issuer) {

            return res.status(403).json({
                success: false,
                message: "Ban khong co quyen thu hoi"
            });

        }


        // Goi Service thu hoi
        const result =
            await revocationService.revokeDocument(
                documentCode,
                req.issuer
            );


        // Tra ve ket qua thanh cong
        return res.status(200).json({
            success: true,
            message: "Thu hoi tai lieu thanh cong",
            data: result
        });

    } catch (error) {

        console.error(
            "Revocation Controller:",
            error.code || error.name
        );

        const statusCode =
            error.statusCode || 500;

        const response = {
            success: false,

            message: statusCode === 500
                ? "Loi xu ly thu hoi tai lieu"
                : error.message
        };


        // Tra ve ma giao dich neu da gui
        if (error.transactionHash) {

            response.transactionHash =
                error.transactionHash;

            response.chainConfirmed =
                error.chainConfirmed;

            response.message =
                "Can kiem tra trang thai giao dich truoc khi thu lai";

        }

        return res.status(statusCode).json(response);

    }
}


// ==========================================
// 2. EXPORT MODULE
// ==========================================

module.exports = {
    revokeDocument
};
