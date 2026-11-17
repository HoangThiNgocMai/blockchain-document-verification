
// ================================================
// ADMIN BLOCKCHAIN CONFIGURATION
// ================================================

require("dotenv").config();

const { ethers } = require("ethers");

const {
    provider,
    contract,
    issuerWallet
} = require("./blockchain");

// ================================================
// 1. KHOI TAO ADMIN WALLET
// ================================================

let adminWallet = null;
let contractWithAdminSigner = null;

function initializeAdminWallet() {

    const privateKey =
        process.env.ADMIN_PRIVATE_KEY?.trim();

    if (!privateKey) {
        throw new Error(
            "Chua cau hinh ADMIN_PRIVATE_KEY"
        );
    }

    adminWallet = new ethers.Wallet(
        privateKey,
        provider
    );

    // Khong su dung chung vi Admin va Issuer
    if (
        adminWallet.address.toLowerCase() ===
        issuerWallet.address.toLowerCase()
    ) {
        throw new Error(
            "Admin Wallet va Issuer Wallet phai khac nhau"
        );
    }

    contractWithAdminSigner =
        contract.connect(adminWallet);

    return {
        adminWallet,
        contractWithAdminSigner
    };
}

// ================================================
// 2. KIEM TRA QUYEN ADMIN
// ================================================

async function validateAdminWallet() {

    const walletConfig =
        initializeAdminWallet();

    const network = await provider.getNetwork();

    if (network.chainId !== 11155111n) {
        throw new Error(
            "Khong dung mang Ethereum Sepolia"
        );
    }

    const contractAddress =
        await contract.getAddress();

    const bytecode =
        await provider.getCode(contractAddress);

    if (bytecode === "0x") {
        throw new Error(
            "Smart Contract khong ton tai"
        );
    }

    const blockchainAdmin =
        await contract.admin();

    if (
        blockchainAdmin.toLowerCase() !==
        walletConfig.adminWallet.address.toLowerCase()
    ) {
        throw new Error(
            "Vi hien tai khong phai Admin cua Smart Contract"
        );
    }

    return walletConfig;
}

// ================================================
// 3. LAY THONG TIN ADMIN WALLET
// ================================================

async function getAdminWalletInfo() {

    const {
        adminWallet
    } = await validateAdminWallet();

    const balance = await provider.getBalance(
        adminWallet.address
    );

    const blockchainAdmin =
        await contract.admin();

    return {
        address: adminWallet.address,
        blockchainAdmin: blockchainAdmin,
        balance: ethers.formatEther(balance),
        network: "sepolia",
        chainId: 11155111,
        isAdmin: true
    };
}

// ================================================
// 4. EXPORT MODULE
// ================================================

module.exports = {
    initializeAdminWallet,
    validateAdminWallet,
    getAdminWalletInfo
};
