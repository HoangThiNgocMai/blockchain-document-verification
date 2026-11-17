
const jwt = require("jsonwebtoken");

const db = require("../config/database");


// ==========================================
// MIDDLEWARE XAC THUC JWT
// ==========================================

async function authenticateToken(req, res, next) {

    try {

        // 1. LAY AUTHORIZATION HEADER

        const authHeader =
            req.headers.authorization;


        // 2. KIEM TRA TOKEN

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({

                success: false,

                message: "Ban chua dang nhap"

            });

        }


        const token =
            authHeader.substring(7).trim();

        if (!token) {

            return res.status(401).json({

                success: false,

                message: "Khong tim thay Token"

            });

        }


        // 3. KIEM TRA JWT SECRET

        const jwtSecret = process.env.JWT_SECRET;

        if (
            !jwtSecret ||
            Buffer.byteLength(jwtSecret, "utf8") < 32
        ) {

            throw new Error(
                "JWT_SECRET chua duoc cau hinh"
            );

        }


        // 4. XAC MINH TOKEN

        const decoded = jwt.verify(

            token,

            jwtSecret,

            {

                algorithms: ["HS256"],

                issuer:
                    "blockchain-document-verification",

                audience:
                    "document-verification-api"

            }

        );


        // 5. KIEM TRA USER ID

        if (
            !Number.isInteger(decoded.userId) ||
            decoded.userId <= 0
        ) {

            return res.status(401).json({

                success: false,

                message: "Token khong hop le"

            });

        }


        // 6. KIEM TRA TAI KHOAN TRONG MYSQL

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
            LEFT JOIN organizations o
                ON u.organization_id = o.id
            WHERE u.id = ?
            LIMIT 1`,

            [decoded.userId]

        );


        if (users.length === 0) {

            return res.status(401).json({

                success: false,

                message: "Tai khoan khong ton tai"

            });

        }


        const user = users[0];


        // 7. KIEM TRA VAI TRO HIEN TAI

        if (!["admin", "issuer"].includes(user.role)) {

            return res.status(403).json({

                success: false,

                message: "Tai khoan khong co quyen"

            });

        }


        // 8. KIEM TRA QUYEN TO CHUC

        if (user.role === "issuer") {

            if (
                !user.organization_id ||
                Number(user.is_authorized) !== 1
            ) {

                return res.status(403).json({

                    success: false,

                    message: "To chuc chua duoc uy quyen"

                });

            }

        }


        // 9. GAN THONG TIN NGUOI DUNG

        req.user = {

            id: user.id,

            fullName: user.full_name,

            email: user.email,

            role: user.role,

            organizationId: user.organization_id,

            organizationName: user.organization_name,

            walletAddress: user.wallet_address

        };


        // 10. CHUYEN SANG MIDDLEWARE TIEP THEO

        return next();


    } catch (error) {


        // TOKEN HET HAN

        if (error.name === "TokenExpiredError") {

            return res.status(401).json({

                success: false,

                message: "Token da het han"

            });

        }


        // TOKEN KHONG HOP LE

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "NotBeforeError"
        ) {

            return res.status(401).json({

                success: false,

                message: "Token khong hop le"

            });

        }


        // LOI HE THONG

        console.error(

            "Auth Middleware:",

            error.code || error.name

        );


        return res.status(500).json({

            success: false,

            message: "Loi xac thuc nguoi dung"

        });

    }

}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    authenticateToken
};
