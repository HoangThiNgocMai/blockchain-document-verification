
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

const db = require("./config/database");

const documentRoutes = require(
    "./routes/documentRoutes"
);

// 1. Khoi tao Express
const app = express();

// 2. Cau hinh middleware
app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// 3. API kiem tra Backend
app.get("/", (req, res) => {

    res.json({
        success: true,
        message:
            "Blockchain Document Verification API"
    });
});

// 4. API kiem tra MySQL
app.get("/api/health", async (req, res) => {

    try {

        await db.query("SELECT 1");

        res.json({
            success: true,
            database: "connected"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            database: "disconnected"
        });
    }
});

// 5. Dang ky API tai lieu
app.use(
    "/api/documents",
    documentRoutes
);

// 6. Xu ly loi upload va he thong
app.use((err, req, res, next) => {

    if (err instanceof multer.MulterError) {

        return res.status(400).json({
            success: false,
            message: "File khong hop le hoac qua lon"
        });
    }

    if (
        err.message ===
        "Dinh dang tai lieu khong duoc ho tro"
    ) {

        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    console.error("Server error:", err.code);

    return res.status(500).json({
        success: false,
        message: "Loi he thong"
    });
});

// 7. Khoi dong Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, "127.0.0.1", () => {

    console.log("============================");

    console.log("BLOCKCHAIN DOCUMENT VERIFICATION");

    console.log(
        `Server running at http://localhost:${PORT}`
    );

    console.log("============================");
});
