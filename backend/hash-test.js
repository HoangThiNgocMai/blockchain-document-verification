
const crypto = require("crypto");

// Nội dung tài liệu thử nghiệm
const content = "Tai lieu Blockchain 2026";

// Tạo mã SHA-256
const hash = crypto
    .createHash("sha256")
    .update(content, "utf8")
    .digest("hex");

console.log("Ma SHA-256:");
console.log("0x" + hash);
