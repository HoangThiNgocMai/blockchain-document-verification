
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../config/database");


// ==========================================
// 1. HAM TAO LOI
// ==========================================

function createError(message, statusCode) {

    const error = new Error(message);

    error.statusCode = statusCode;

    return error;

}


// ==========================================
// 2. DANG NHAP HE THONG
// ==========================================

async function login(email, password) {

    // --------------------------------------
    // BUOC 1: KIEM TRA CAU HINH JWT
    // --------------------------------------

    const jwtSecret = process.env.JWT_SECRET;

    const expiresIn =
        process.env.JWT_EXPIRES_IN || "2h";

    if (
        !jwtSecret ||
        Buffer.byteLength(jwtSecret, "utf8") < 32
    ) {

        throw createError(
            "JWT_SECRET chua duoc cau hinh hop le",
            500
        );

    }


    // --------------------------------------
    // BUOC 2: TIM TAI KHOAN TRONG MYSQL
    // --------------------------------------

    const [users] = await db.execute(

        `SELECT
            u.id,
            u.full_name,
            u.email,
            u.password_hash,
            u.role,
            u.organization_id,
            o.name AS organization_name,
            o.is_authorized
        FROM users u
        LEFT JOIN organizations o
            ON u.organization_id = o.id
        WHERE u.email = ?
        LIMIT 1`,

        [email]

    );


    // --------------------------------------
    // BUOC 3: KIEM TRA TAI KHOAN TON TAI
    // --------------------------------------

    if (users.length === 0) {

        throw createError(
            "Email hoac mat khau khong chinh xac",
            401
        );

    }

    const user = users[0];


    // --------------------------------------
    // BUOC 4: KIEM TRA MAT KHAU
    // --------------------------------------

    const isPasswordValid = await bcrypt.compare(

        password,

        user.password_hash

    );

    if (!isPasswordValid) {

        throw createError(
            "Email hoac mat khau khong chinh xac",
            401
        );

    }


    // --------------------------------------
    // BUOC 5: KIEM TRA VAI TRO
    // --------------------------------------

    if (!["admin", "issuer"].includes(user.role)) {

        throw createError(
            "Tai khoan khong co quyen truy cap",
            403
        );

    }


    // --------------------------------------
    // BUOC 6: KIEM TRA TO CHUC CAP PHAT
    // --------------------------------------

    if (user.role === "issuer") {

        if (
            !user.organization_id ||
            Number(user.is_authorized) !== 1
        ) {

            throw createError(
                "To chuc chua duoc uy quyen",
                403
            );

        }

    }


    // --------------------------------------
    // BUOC 7: TAO JWT ACCESS TOKEN
    // --------------------------------------

    const accessToken = jwt.sign(

        {

            userId: user.id,

            role: user.role,

            organizationId: user.organization_id

        },

        jwtSecret,

        {

            algorithm: "HS256",

            expiresIn: expiresIn,

            issuer:
                "blockchain-document-verification",

            audience:
                "document-verification-api"

        }

    );


    // --------------------------------------
    // BUOC 8: TRA VE KET QUA DANG NHAP
    // --------------------------------------

    return {

        accessToken: accessToken,

        tokenType: "Bearer",

        expiresIn: expiresIn,

        user: {

            id: user.id,

            fullName: user.full_name,

            email: user.email,

            role: user.role,

            organizationId: user.organization_id,

            organizationName: user.organization_name

        }

    };

}


// ==========================================
// 3. EXPORT MODULE
// ==========================================

module.exports = {
    login
};
