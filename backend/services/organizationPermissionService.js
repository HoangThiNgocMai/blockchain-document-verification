
// ================================================
// ORGANIZATION PERMISSION SERVICE
// ================================================

const { ethers } = require("ethers");

const db = require("../config/database");

const {
    contract
} = require("../config/blockchain");

const {
    validateAdminWallet
} = require("../config/adminBlockchain");

// Khoa giao dich trong mot tien trinh Backend
let processing = false;

// ================================================
// 1. TAO LOI NGHIEP VU
// ================================================

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// ================================================
// 2. LAY THONG TIN TO CHUC
// ================================================

async function getOrganization(id) {

    const [rows] = await db.execute(
        `SELECT
            id,
            name,
            wallet_address,
            is_authorized
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
// 3. THAY DOI QUYEN TO CHUC
// ================================================

async function changePermission(
    organizationId,
    adminId,
    authorized
) {

    if (
        !Number.isSafeInteger(organizationId) ||
        organizationId <= 0
    ) {
        throw createError(
            "ID to chuc khong hop le",
            400
        );
    }

    if (
        !Number.isSafeInteger(adminId) ||
        adminId <= 0
    ) {
        throw createError(
            "ID Admin khong hop le",
            403
        );
    }

    if (processing) {
        throw createError(
            "Dang co giao dich duoc xu ly",
            409
        );
    }

    processing = true;

    let transactionHash = null;
    let chainConfirmed = false;

    try {

        // Lay thong tin to chuc
        const organization =
            await getOrganization(organizationId);

        if (!ethers.isAddress(
            organization.wallet_address
        )) {
            throw createError(
                "Dia chi vi khong hop le",
                400
            );
        }

        const walletAddress = ethers.getAddress(
            organization.wallet_address
        );

        if (walletAddress === ethers.ZeroAddress) {
            throw createError(
                "Khong chap nhan dia chi vi 0",
                400
            );
        }

        // Kiem tra Admin Wallet
        const {
            adminWallet,
            contractWithAdminSigner
        } = await validateAdminWallet();

        // Khong cap hoac huy quyen vi Admin
        if (
            walletAddress.toLowerCase() ===
            adminWallet.address.toLowerCase()
        ) {
            throw createError(
                "Khong duoc thay doi quyen vi Admin",
                400
            );
        }

        // Kiem tra trang thai Blockchain
        const currentStatus =
            await contract.authorizedIssuers(
                walletAddress
            );

        if (currentStatus === authorized) {
            throw createError(
                authorized
                    ? "To chuc da duoc cap quyen"
                    : "To chuc chua duoc cap quyen",
                409
            );
        }

        const action = authorized
            ? "authorize"
            : "deauthorize";

        const methodName = authorized
            ? "authorizeIssuer(address)"
            : "removeIssuer(address)";

        // Kiem tra ham trong ABI
        const fragment =
            contract.interface.getFunction(methodName);

        if (!fragment) {
            throw createError(
                "Smart Contract khong ho tro ham " +
                methodName,
                503
            );
        }

        const method =
            contractWithAdminSigner.getFunction(
                methodName
            );

        // Mo phong giao dich
        await method.staticCall(walletAddress);

        // Uoc tinh Gas
        const gasEstimate =
            await method.estimateGas(walletAddress);

        console.log(
            "Estimated Gas:",
            gasEstimate.toString()
        );

        // Gui giao dich Blockchain
        const transaction =
            await method(walletAddress);

        transactionHash = transaction.hash;

        console.log(
            "Transaction Hash:",
            transactionHash
        );

        // Luu giao dich pending
        await db.execute(
            `INSERT INTO organization_transactions (
                organization_id,
                performed_by,
                tx_hash,
                action,
                status
            ) VALUES (?, ?, ?, ?, 'pending')`,
            [
                organizationId,
                adminId,
                transactionHash,
                action
            ]
        );

        // Cho Blockchain xac nhan
        const receipt =
            await transaction.wait(1);

        if (!receipt || receipt.status !== 1) {

            await db.execute(
                `UPDATE organization_transactions
                 SET status = 'failed'
                 WHERE tx_hash = ?`,
                [transactionHash]
            );

            throw createError(
                "Giao dich Blockchain that bai",
                502
            );
        }

        chainConfirmed = true;

        // Doc lai trang thai thuc te
        const blockchainStatus =
            await contract.authorizedIssuers(
                walletAddress
            );

        // Dong bo MySQL bang SQL Transaction
        const connection =
            await db.getConnection();

        try {

            await connection.beginTransaction();

            await connection.execute(
                `UPDATE organizations
                 SET is_authorized = ?
                 WHERE id = ?
                 AND wallet_address = ?`,
                [
                    blockchainStatus ? 1 : 0,
                    organizationId,
                    organization.wallet_address
                ]
            );

            await connection.execute(
                `UPDATE organization_transactions
                 SET
                    status = 'confirmed',
                    block_number = ?
                 WHERE tx_hash = ?`,
                [
                    receipt.blockNumber,
                    transactionHash
                ]
            );

            await connection.commit();

        } catch (error) {

            await connection.rollback();
            throw error;

        } finally {

            connection.release();
        }

        // Kiem tra lai du lieu MySQL
        const updatedOrganization =
            await getOrganization(organizationId);

        const databaseAuthorized =
            Number(
                updatedOrganization.is_authorized
            ) === 1;

        return {
            organizationId: organization.id,

            organizationName: organization.name,

            walletAddress: walletAddress,

            action: action,

            adminAddress: adminWallet.address,

            databaseAuthorized: databaseAuthorized,

            blockchainAuthorized: blockchainStatus,

            synced:
                databaseAuthorized === blockchainStatus,

            requestedStateReached:
                blockchainStatus === authorized,

            transactionHash: transactionHash,

            blockNumber: receipt.blockNumber,

            transactionStatus: "confirmed",

            explorerUrl:
                "https://sepolia.etherscan.io/tx/" +
                transactionHash
        };

    } catch (error) {

        // Chi danh dau failed khi co receipt that bai
        if (
            transactionHash &&
            error.receipt?.status === 0 &&
            error.receipt.hash === transactionHash
        ) {
            try {
                await db.execute(
                    `UPDATE organization_transactions
                     SET status = 'failed'
                     WHERE tx_hash = ?`,
                    [transactionHash]
                );
            } catch {
                console.error(
                    "Khong the cap nhat lich su giao dich"
                );
            }
        }

        error.transactionHash = transactionHash;
        error.chainConfirmed = chainConfirmed;

        throw error;

    } finally {

        processing = false;
    }
}

// ================================================
// 4. CAP QUYEN TO CHUC
// ================================================

async function authorizeOrganization(id, adminId) {

    return changePermission(
        id,
        adminId,
        true
    );
}

// ================================================
// 5. HUY QUYEN TO CHUC
// ================================================

async function deauthorizeOrganization(id, adminId) {

    return changePermission(
        id,
        adminId,
        false
    );
}

// ================================================
// EXPORT MODULE
// ================================================

module.exports = {
    authorizeOrganization,
    deauthorizeOrganization
};
