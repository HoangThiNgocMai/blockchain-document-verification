
require("dotenv").config();

const bcrypt = require("bcryptjs");
const db = require("./config/database");


// ==========================================
// TAO TAI KHOAN ADMIN
// ==========================================

async function createAdmin() {

    try {

        const fullName = "Quan tri vien";

        const email = "admin@example.com";

        const password = process.env.SETUP_ADMIN_PASSWORD;


        // 1. KIEM TRA MAT KHAU

        if (
            !password ||
            password.length < 12 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            throw new Error(
                "Mat khau phai tu 12 ky tu va khong qua 72 byte"
            );
        }


        // 2. KIEM TRA EMAIL TON TAI

        const [existingUsers] = await db.execute(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {

            console.log(
                "Email Admin da ton tai"
            );

            return;

        }


        // 3. MA HOA BAM MAT KHAU

        const passwordHash = await bcrypt.hash(
            password,
            12
        );


        // 4. THEM ADMIN VAO MYSQL

        const [result] = await db.execute(
            `INSERT INTO users
            (
                organization_id,
                full_name,
                email,
                password_hash,
                role
            )
            VALUES (NULL, ?, ?, ?, 'admin')`,
            [
                fullName,
                email,
                passwordHash
            ]
        );


        // 5. THONG BAO KET QUA

        console.log("============================");

        console.log("TAO ADMIN THANH CONG");

        console.log("ID:", result.insertId);

        console.log("Email:", email);

        console.log("Role: admin");

        console.log("============================");

    } catch (error) {

        console.error(
            "Create Admin Error:",
            error.message
        );

        process.exitCode = 1;

    } finally {

        await db.end();

    }
}

createAdmin();
