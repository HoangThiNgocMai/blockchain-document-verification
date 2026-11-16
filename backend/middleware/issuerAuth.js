
const crypto = require("crypto");
const db = require("../config/database");

async function issuerAuth(req, res, next) {
    try {

        // 1. Lay API Key tu request
        const providedKey = Buffer.from(
            req.get("x-api-key") || ""
        );

        // 2. Lay API Key tu file .env
        const expectedKey = Buffer.from(
            process.env.ISSUER_API_KEY || ""
        );

        // 3. Kiem tra API Key
        if (
            expectedKey.length === 0 ||
            providedKey.length !== expectedKey.length ||
            !crypto.timingSafeEqual(
                providedKey,
                expectedKey
            )
        ) {
            return res.status(401).json({
                success: false,
                message: "API Key khong hop le"
            });
        }

        // 4. Kiem tra tai khoan Issuer trong MySQL
        const [rows] = await db.execute(
            `SELECT
                u.id,
                u.organization_id,
                o.wallet_address
             FROM users u
             JOIN organizations o
                ON o.id = u.organization_id
             WHERE u.id = ?
                AND u.role = 'issuer'
                AND o.is_authorized = TRUE`,
            [process.env.ISSUER_USER_ID]
        );

        // 5. Kiem tra quyen phat hanh
        if (rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: "Issuer khong co quyen"
            });
        }

        // 6. Luu thong tin Issuer vao request
        req.issuer = rows[0];

        // 7. Cho phep chuyen sang buoc tiep theo
        next();

    } catch (error) {

        console.error(
            "Issuer auth error:",
            error.code
        );

        return res.status(500).json({
            success: false,
            message: "Loi kiem tra quyen Issuer"
        });
    }
}

module.exports = issuerAuth;
