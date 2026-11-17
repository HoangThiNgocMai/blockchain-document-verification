
require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./config/database");


// ==========================================
// THIET LAP MAT KHAU CHO ISSUER
// ==========================================

async function resetIssuerPassword() {

    try {

        // 1. Lay thong tin tu bien moi truong

        const issuerId = Number(
            process.env.ISSUER_USER_ID
        );

        const password =
            process.env.SETUP_ISSUER_PASSWORD;


        // 2. Kiem tra ID Issuer

        if (
            !Number.isInteger(issuerId) ||
            issuerId <= 0
        ) {

            throw new Error(
                "ISSUER_USER_ID khong hop le"
            );

        }


        // 3. Kiem tra mat khau

        if (
            !password ||
            password.length < 12 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {

            throw new Error(
                "Mat khau phai tu 12 ky tu va khong qua 72 byte"
            );

        }


        // 4. Tim tai khoan Issuer

        const [users] = await db.execute(

            `SELECT id, email, role
             FROM users
             WHERE id = ?
             AND role = 'issuer'`,

            [issuerId]

        );


        if (users.length === 0) {

            throw new Error(
                "Khong tim thay tai khoan Issuer"
            );

        }


        // 5. Bam mat khau

        const passwordHash = await bcrypt.hash(
            password,
            12
        );


        // 6. Cap nhat MySQL

        await db.execute(

            `UPDATE users
             SET password_hash = ?
             WHERE id = ?
             AND role = 'issuer'`,

            [passwordHash, issuerId]

        );


        // 7. In ket qua

        console.log("============================");

        console.log("CAP NHAT MAT KHAU THANH CONG");

        console.log("ID:", issuerId);

        console.log("Email:", users[0].email);

        console.log("Role: issuer");

        console.log("============================");


    } catch (error) {

        console.error(
            "Reset Issuer Error:",
            error.message
        );

        process.exitCode = 1;


    } finally {

        await db.end();

    }

}


resetIssuerPassword();
