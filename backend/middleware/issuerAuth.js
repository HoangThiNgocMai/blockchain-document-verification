
const db = require("../config/database");

const {
    provider,
    contract,
    issuerWallet
} = require("../config/blockchain");


// ==========================================
// MIDDLEWARE XAC THUC ISSUER
// SU DUNG JWT THAY CHO API KEY
// ==========================================

async function issuerAuth(req, res, next) {

    try {

        // 1. KIEM TRA DANG NHAP

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Ban chua dang nhap"
            });

        }


        // 2. KIEM TRA VAI TRO ISSUER

        if (req.user.role !== "issuer") {

            return res.status(403).json({
                success: false,
                message: "Ban khong co quyen cap phat"
            });

        }


        // 3. KIEM TRA TAI KHOAN DUOC GAN VOI VI

        const configuredIssuerId = Number(
            process.env.ISSUER_USER_ID
        );

        if (
            !Number.isInteger(configuredIssuerId) ||
            configuredIssuerId <= 0
        ) {

            throw new Error(
                "ISSUER_USER_ID khong hop le"
            );

        }

        if (Number(req.user.id) !== configuredIssuerId) {

            return res.status(403).json({
                success: false,
                message: "Tai khoan khong duoc su dung vi cap phat"
            });

        }


        // 4. KIEM TRA ISSUER TRONG MYSQL

        const [users] = await db.execute(

            `SELECT
                u.id,
                u.full_name,
                u.email,
                u.role,
                u.organization_id,
                o.name AS organization_name,
                o.wallet_address,
                o.is_authorized
            FROM users u
            INNER JOIN organizations o
                ON u.organization_id = o.id
            WHERE u.id = ?
            AND u.role = 'issuer'
            LIMIT 1`,

            [req.user.id]

        );


        if (users.length === 0) {

            return res.status(403).json({
                success: false,
                message: "Khong tim thay to chuc cap phat"
            });

        }

        const issuer = users[0];


        // 5. KIEM TRA QUYEN TO CHUC

        if (Number(issuer.is_authorized) !== 1) {

            return res.status(403).json({
                success: false,
                message: "To chuc chua duoc uy quyen"
            });

        }


        // 6. KIEM TRA MANG BLOCKCHAIN

        const network = await provider.getNetwork();

        if (network.chainId !== 11155111n) {

            throw new Error(
                "Sai mang Blockchain. Yeu cau Sepolia"
            );

        }


        // 7. KIEM TRA DIA CHI VI

        const walletAddress =
            await issuerWallet.getAddress();

        if (
            !issuer.wallet_address ||
            issuer.wallet_address.toLowerCase() !==
            walletAddress.toLowerCase()
        ) {

            return res.status(403).json({
                success: false,
                message: "Dia chi vi cap phat khong khop"
            });

        }


        // 8. KIEM TRA UY QUYEN TREN BLOCKCHAIN

        const isAuthorized =
            await contract.authorizedIssuers(
                walletAddress
            );

        if (!isAuthorized) {

            return res.status(403).json({
                success: false,
                message: "Vi chua duoc uy quyen tren Blockchain"
            });

        }


        // 9. GAN THONG TIN ISSUER

        req.issuer = {

            ...issuer,

            userId: issuer.id,

            fullName: issuer.full_name,

            organizationId: issuer.organization_id,

            organizationName: issuer.organization_name,

            walletAddress: walletAddress,

            issuerAddress: walletAddress,

            isAuthorized: true

        };


        // 10. CHUYEN SANG CONTROLLER

        return next();


    } catch (error) {

        console.error(
            "Issuer Auth Error:",
            error.code || error.name
        );

        return res.status(500).json({
            success: false,
            message: "Loi xac thuc to chuc cap phat"
        });

    }

}


// ==========================================
// EXPORT MODULE
// ==========================================

module.exports = issuerAuth;
