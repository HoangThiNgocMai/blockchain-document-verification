
require("dotenv").config();

const fs = require("fs");

const db = require("./config/database");

const {
    verifyDocument
} = require("./services/verificationService");


// ==========================================
// 1. MA TAI LIEU DA CAP PHAT
// ==========================================

const documentCode =
    "DOC-e4f12c3f-e2b3-4364-9818-9e25647ed305";


// ==========================================
// 2. HAM KIEM THU
// ==========================================

async function testVerification() {

    try {

        console.log("==================================");
        console.log("KIEM THU XAC THUC TAI LIEU");
        console.log("==================================");

        console.log("Ma tai lieu:", documentCode);

        const filePath = process.argv[2];

        let file = null;

        if (filePath) {

            file = {
                buffer: fs.readFileSync(filePath)
            };

            console.log("File:", filePath);

        } else {

            console.log("Che do: Tra cuu tai lieu");

        }

        // Goi Service xac thuc
        const result = await verifyDocument(
            documentCode,
            file
        );

        console.log("==================================");

        console.log(
            JSON.stringify(result, null, 2)
        );

        console.log("==================================");

    } catch (error) {

        console.error(
            "KIEM THU THAT BAI:",
            error.code || error.name
        );

        process.exitCode = 1;

    } finally {

        await db.end();

    }
}

testVerification();
