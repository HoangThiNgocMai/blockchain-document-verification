const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const { ethers } = require("ethers");

const abi = require("../abi/DocumentVerification.json");

// ======================================
// 1. KIEM TRA CAU HINH
// ======================================

if (!process.env.RPC_URL) {
    throw new Error("Chua cau hinh RPC_URL");
}

if (!ethers.isAddress(process.env.CONTRACT_ADDRESS)) {
    throw new Error("Dia chi Smart Contract khong hop le");
}

if (!process.env.ISSUER_PRIVATE_KEY) {
    throw new Error("Chua cau hinh ISSUER_PRIVATE_KEY");
}

// ======================================
// 2. KET NOI ETHEREUM SEPOLIA
// ======================================

const provider = new ethers.JsonRpcProvider(
    process.env.RPC_URL
);

// ======================================
// 3. KHOI TAO VI ISSUER
// ======================================

const issuerWallet = new ethers.Wallet(
    process.env.ISSUER_PRIVATE_KEY,
    provider
);

// ======================================
// 4. SMART CONTRACT - DOC DU LIEU
// ======================================

const contract = new ethers.Contract(
    process.env.CONTRACT_ADDRESS,
    abi,
    provider
);

// ======================================
// 5. SMART CONTRACT - GHI DU LIEU
// ======================================

const contractWithSigner = contract.connect(
    issuerWallet
);

// ======================================
// 6. XUAT MODULE
// ======================================

module.exports = {
    provider,
    contract,
    issuerWallet,
    contractWithSigner
};