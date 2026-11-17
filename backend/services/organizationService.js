
// ==========================================
// ORGANIZATION SERVICE
// Quan ly to chuc cap phat tai lieu
// ==========================================

const db = require("../config/database");
const { ethers } = require("ethers");

// Tao loi nghiep vu
function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// 1. Lay danh sach to chuc
async function getAllOrganizations() {
    const [rows] = await db.query(`
        SELECT
            id,
            name,
            wallet_address,
            is_authorized,
            created_at
        FROM organizations
        ORDER BY id DESC
    `);

    return rows;
}

// 2. Lay chi tiet to chuc
async function getOrganizationById(id) {
    const [rows] = await db.query(`
        SELECT
            id,
            name,
            wallet_address,
            is_authorized,
            created_at
        FROM organizations
        WHERE id = ?
    `, [id]);

    if (rows.length === 0) {
        throw createError(
            "Khong tim thay to chuc",
            404
        );
    }

    return rows[0];
}

// 3. Them to chuc moi
async function createOrganization(name, walletAddress) {

    if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 255
    ) {
        throw createError(
            "Ten to chuc khong hop le",
            400
        );
    }

    if (
        typeof walletAddress !== "string" ||
        !ethers.isAddress(walletAddress.trim())
    ) {
        throw createError(
            "Dia chi vi Ethereum khong hop le",
            400
        );
    }

    const normalizedWallet = ethers.getAddress(
        walletAddress.trim()
    );

    if (normalizedWallet === ethers.ZeroAddress) {
        throw createError(
            "Khong duoc su dung dia chi vi zero",
            400
        );
    }

    // Kiem tra dia chi vi da ton tai hay chua
    const [existing] = await db.query(`
        SELECT id
        FROM organizations
        WHERE LOWER(wallet_address) = LOWER(?)
    `, [normalizedWallet]);

    if (existing.length > 0) {
        throw createError(
            "Dia chi vi da duoc su dung",
            409
        );
    }

    try {
        // To chuc moi mac dinh chua duoc uy quyen
        const [result] = await db.query(`
            INSERT INTO organizations (
                name,
                wallet_address,
                is_authorized
            )
            VALUES (?, ?, 0)
        `, [
            name.trim(),
            normalizedWallet
        ]);

        return await getOrganizationById(
            result.insertId
        );

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            throw createError(
                "Dia chi vi da duoc su dung",
                409
            );
        }

        throw error;
    }
}

// 4. Cap nhat ten to chuc
async function updateOrganization(id, name) {

    await getOrganizationById(id);

    if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 255
    ) {
        throw createError(
            "Ten to chuc khong hop le",
            400
        );
    }

    await db.query(`
        UPDATE organizations
        SET name = ?
        WHERE id = ?
    `, [
        name.trim(),
        id
    ]);

    return await getOrganizationById(id);
}

// Xuat cac ham
module.exports = {
    getAllOrganizations,
    getOrganizationById,
    createOrganization,
    updateOrganization
};
