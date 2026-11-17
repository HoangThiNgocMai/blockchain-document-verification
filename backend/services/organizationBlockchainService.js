
// ================================================
// ORGANIZATION BLOCKCHAIN SERVICE
// ================================================

const { ethers } = require("ethers");

const db = require("../config/database");

const {
    provider,
    contract
} = require("../config/blockchain");

// ================================================
// 1. TAO LOI NGHIEP VU
// ================================================

function createError(message, statusCode) {

    const error = new Error(message);

    error.statusCode = statusCode;

    return error;
}

// ================================================
// 2. KIEM TRA MANG BLOCKCHAIN
// ================================================

async function checkBlockchainNetwork() {

    const network = await provider.getNetwork();

    if (network.chainId !== 11155111n) {

        throw createError(
            "Khong dung mang Ethereum Sepolia",
            503
        );
    }

    const contractAddress =
        await contract.getAddress();

    const bytecode =
        await provider.getCode(contractAddress);

    if (bytecode === "0x") {

        throw createError(
            "Smart Contract khong ton tai",
            503
        );
    }

    return network;
}

// ================================================
// 3. LAY TO CHUC THEO ID
// ================================================

async function getOrganizationById(id) {

    const [rows] = await db.execute(
        `SELECT
            id,
            name,
            wallet_address,
            is_authorized,
            created_at
         FROM organizations
         WHERE id = ?
         LIMIT 1`,
        [id]
    );

    if (rows.length === 0) {

        throw createError(
            "Khong tim thay to chuc",
            404
        );
    }

    return rows[0];
}

// ================================================
// 4. KIEM TRA TRANG THAI BLOCKCHAIN
// ================================================

async function getBlockchainStatus(id) {

    // Kiem tra ID
    if (!Number.isSafeInteger(id) || id <= 0) {

        throw createError(
            "ID to chuc khong hop le",
            400
        );
    }

    // Lay thong tin tu MySQL
    const organization =
        await getOrganizationById(id);

    // Kiem tra dia chi vi
    if (!ethers.isAddress(
        organization.wallet_address
    )) {

        throw createError(
            "Dia chi vi to chuc khong hop le",
            400
        );
    }

    const walletAddress = ethers.getAddress(
        organization.wallet_address
    );

    // Kiem tra Blockchain
    await checkBlockchainNetwork();

    // Quyen tren Smart Contract
    const blockchainAuthorized =
        await contract.authorizedIssuers(
            walletAddress
        );

    // Quyen trong MySQL
    const databaseAuthorized =
        Number(organization.is_authorized) === 1;

    // So sanh trang thai
    const synced =
        databaseAuthorized === blockchainAuthorized;

    // Tra ve ket qua
    return {

        organizationId: organization.id,

        organizationName: organization.name,

        walletAddress: walletAddress,

        databaseAuthorized: databaseAuthorized,

        blockchainAuthorized: blockchainAuthorized,

        synced: synced,

        status: synced
            ? "synced"
            : "not_synced",

        network: "sepolia",

        chainId: 11155111,

        contractAddress:
            await contract.getAddress(),

        checkedAt: new Date().toISOString()
    };
}

// ================================================
// 5. EXPORT MODULE
// ================================================

module.exports = {
    getBlockchainStatus
};
