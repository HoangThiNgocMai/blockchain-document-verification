
const verificationService = require(
    "../services/verificationService"
);

// ==========================================
// 1. XAC THUC TAI LIEU BANG FILE
// ==========================================

async function verifyDocument(req, res) {

    try {

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

        // Kiem tra file tai len
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Vui long tai file can xac thuc"
            });
        }

        // Goi Service xu ly
        const result =
            await verificationService.verifyDocument(
                documentCode,
                req.file
            );

        // Tra ket qua
        return res.status(
            result.result === "not_found" ? 404 : 200
        ).json({
            success: result.result !== "not_found",
            ...result
        });

    } catch (error) {

        console.error(
            "Verification Controller:",
            error.code || error.name
        );

        return res.status(500).json({
            success: false,
            message: "Loi xac thuc tai lieu"
        });
    }
}


// ==========================================
// 2. TRA CUU TAI LIEU BANG MA
// ==========================================

async function lookupDocument(req, res) {

    try {

        const documentCode = String(
            req.params.documentCode || ""
        ).trim();

        // Kiem tra ma tai lieu
        if (!documentCode || documentCode.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Ma tai lieu khong hop le"
            });
        }

        // Tra cuu khong can tai file
        const result =
            await verificationService.verifyDocument(
                documentCode,
                null
            );

        return res.status(
            result.result === "not_found" ? 404 : 200
        ).json({
            success: result.result !== "not_found",
            ...result
        });

    } catch (error) {

        console.error(
            "Lookup Controller:",
            error.code || error.name
        );

        return res.status(500).json({
            success: false,
            message: "Loi tra cuu tai lieu"
        });
    }
}


// ==========================================
// 3. EXPORT MODULE
// ==========================================

module.exports = {
    verifyDocument,
    lookupDocument
};
