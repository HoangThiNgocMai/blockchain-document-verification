const crypto = require("crypto");

// Tạo mã băm SHA-256 từ nội dung tài liệu
function generateFileHash(buffer) {
    return crypto
        .createHash("sha256")
        .update(buffer)
        .digest("hex");
}

module.exports = {
    generateFileHash
};