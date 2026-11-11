
const db = require("./config/database");

async function testConnection() {
    try {
        const [rows] = await db.query(
            "SELECT DATABASE() AS database_name"
        );

        console.log("Ket noi MySQL thanh cong!");
        console.log("Database:", rows[0].database_name);
    } catch (error) {
        console.error("Loi ket noi MySQL:", error.message);
    } finally {
        await db.end();
    }
}

testConnection();
