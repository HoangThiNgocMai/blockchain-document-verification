
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Trang chủ API
app.get("/", (req, res) => {
    res.send("He thong xac thuc tai lieu bang Blockchain");
});

// Kiểm tra trạng thái Backend
app.get("/api/status", (req, res) => {
    res.json({
        success: true,
        message: "Backend dang hoat dong",
        system: "Blockchain Document Verification"
    });
});

// Khởi động máy chủ
app.listen(PORT, () => {
    console.log(`Server dang chay tai http://localhost:${PORT}`);
});
