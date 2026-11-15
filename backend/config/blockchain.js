
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const { ethers } = require("ethers");

const abi = require("../abi/DocumentVerification.json");

// Kiểm tra cấu hình
if (!process.env.RPC_URL) {
    throw new Error("Chua cau hinh RPC_URL");
}

if (!ethers.isAddress(process.env.CONTRACT_ADDRESS)) {
    throw new Error("Dia chi Smart Contract khong hop le");
}

// Kết nối Ethereum Sepolia
const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL
);

// Kết nối Smart Contract ở chế độ đọc
const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    provider
);

module.exports = {
    provider,
    contract
};
