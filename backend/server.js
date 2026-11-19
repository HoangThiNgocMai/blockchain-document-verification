
// ================================================
// BLOCKCHAIN DOCUMENT VERIFICATION SYSTEM
// BACKEND SERVER
// ================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

// Ket noi MySQL
const db = require("./config/database");

// ================================================
// 1. IMPORT ROUTES
// ================================================

const documentRoutes = require("./routes/documentRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const revocationRoutes = require("./routes/revocationRoutes");
const authRoutes = require("./routes/authRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const userRoutes = require("./routes/userRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const issuerTransactionRoutes = require("./routes/issuerTransactionRoutes");
const issuerVerificationRoutes = require(
  "./routes/issuerVerificationRoutes"
);
const verificationLogRoutes = require("./routes/verificationLogRoutes");
// ================================================
// 2. KHOI TAO EXPRESS
// ================================================

const app = express();

// ================================================
// 3. MIDDLEWARE
// ================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

// ================================================
// 4. TRANG CHU API
// ================================================

app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Blockchain Document Verification API"
    });
});

// ================================================
// 5. KIEM TRA KET NOI DATABASE
// ================================================

app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        return res.status(200).json({
            success: true,
            database: "connected"
        });

    } catch (error) {
        console.error(
            "Database error:",
            error.code || error.name
        );

        return res.status(500).json({
            success: false,
            database: "disconnected"
        });
    }
});

// ================================================
// 6. KHAI BAO API ROUTES
// ================================================

// API dang nhap va xac thuc JWT
app.use("/api/auth", authRoutes);

// API cap phat tai lieu
app.use("/api/documents", documentRoutes);

// API xac thuc tai lieu
app.use("/api/verification", verificationRoutes);

// API thu hoi tai lieu
app.use("/api/revocation", revocationRoutes);

// API quan ly to chuc cap phat
app.use("/api/organizations", organizationRoutes);

// API quan ly tai khoan Issuer
app.use("/api/users", userRoutes);

app.use("/api/dashboard", dashboardRoutes);
// API quan ly giao dich Blockchain
app.use("/api/transactions", transactionRoutes);
app.use("/api/issuer-transactions", issuerTransactionRoutes);
app.use(
  "/api/issuer-verifications",
  issuerVerificationRoutes
);
app.use("/api/verification-logs", verificationLogRoutes);
// ================================================
// 7. XU LY ROUTE KHONG TON TAI - 404
// ================================================

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "API khong ton tai",
        method: req.method,
        path: req.path
    });
});

// ================================================
// 8. ERROR HANDLER
// ================================================

app.use((err, req, res, next) => {

    // Neu response da duoc gui
    if (res.headersSent) {
        return next(err);
    }

    // Loi upload file
    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            message: "File khong hop le hoac qua lon"
        });
    }

    // Loi dinh dang file
    if (
        err.message ===
        "Dinh dang tai lieu khong duoc ho tro"
    ) {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    // Loi JSON
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Du lieu JSON khong hop le"
        });
    }

    // Loi he thong
    console.error(
        "Server error:",
        err.code || err.name
    );

    return res.status(500).json({
        success: false,
        message: "Loi he thong"
    });
});

// ================================================
// 9. KHOI DONG SERVER
// ================================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, "127.0.0.1", () => {

    console.log("");
    console.log("==============================================");
    console.log(" BLOCKCHAIN DOCUMENT VERIFICATION SYSTEM");
    console.log("==============================================");

    console.log("Server running at:");
    console.log(`http://localhost:${PORT}`);

    console.log("");
    console.log("API route prefixes:");
    console.log("/api/health");
    console.log("/api/auth");
    console.log("/api/documents");
    console.log("/api/verification");
    console.log("/api/revocation");
    console.log("/api/organizations");
    console.log("/api/users");
    console.log("/api/dashboard");
    console.log("/api/transactions");
    console.log("");
    console.log("Process ID:", process.pid);
    console.log("Server file:", __filename);
    console.log("==============================================");
});

// ================================================
// 10. XU LY LOI KHOI DONG SERVER
// ================================================

server.on("error", (error) => {

    if (error.code === "EADDRINUSE") {
        console.error(`Cong ${PORT} dang duoc su dung`);
        console.error("Hay dung Server cu truoc khi khoi dong lai");
    } else {
        console.error(
            "Server startup error:",
            error.code || error.name
        );
    }

    process.exit(1);
});
