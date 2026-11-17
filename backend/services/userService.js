
const db = require("../config/database");
const bcrypt = require("bcryptjs");

// Tao loi kem HTTP status
function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// ==========================================
// 1. LAY DANH SACH TAI KHOAN ISSUER
// ==========================================

async function getAllUsers() {
    const [rows] = await db.query(`
        SELECT
            u.id,
            u.organization_id,
            u.full_name,
            u.email,
            u.role,
            u.is_active,
            u.created_at,
            o.name AS organization_name
        FROM users u
        LEFT JOIN organizations o
            ON u.organization_id = o.id
        WHERE u.role = 'issuer'
        ORDER BY u.id DESC
    `);

    return rows;
}

// ==========================================
// 2. LAY CHI TIET TAI KHOAN
// ==========================================

async function getUserById(id) {
    const [rows] = await db.query(`
        SELECT
            u.id,
            u.organization_id,
            u.full_name,
            u.email,
            u.role,
            u.is_active,
            u.created_at,
            o.name AS organization_name
        FROM users u
        LEFT JOIN organizations o
            ON u.organization_id = o.id
        WHERE u.id = ?
            AND u.role = 'issuer'
        LIMIT 1
    `, [id]);

    if (rows.length === 0) {
        throw createError(
            "Tai khoan Issuer khong ton tai",
            404
        );
    }

    return rows[0];
}

// ==========================================
// 3. KIEM TRA TO CHUC
// ==========================================

async function checkOrganization(organizationId) {
    const [rows] = await db.query(`
        SELECT id, name, is_authorized
        FROM organizations
        WHERE id = ?
        LIMIT 1
    `, [organizationId]);

    if (rows.length === 0) {
        throw createError(
            "To chuc khong ton tai",
            404
        );
    }

    return rows[0];
}

// ==========================================
// 4. TAO TAI KHOAN ISSUER
// ==========================================

async function createUser(data) {
    const {
        fullName,
        email,
        password,
        organizationId
    } = data;

    await checkOrganization(organizationId);

    const [existingUsers] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
    );

    if (existingUsers.length > 0) {
        throw createError(
            "Email da duoc su dung",
            409
        );
    }

    const passwordHash = await bcrypt.hash(
        password,
        12
    );

    try {
        const [result] = await db.query(`
            INSERT INTO users (
                organization_id,
                full_name,
                email,
                password_hash,
                role,
                is_active
            )
            VALUES (?, ?, ?, ?, 'issuer', 1)
        `, [
            organizationId,
            fullName,
            email,
            passwordHash
        ]);

        return await getUserById(result.insertId);

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            throw createError(
                "Email da duoc su dung",
                409
            );
        }

        throw error;
    }
}

// ==========================================
// 5. CAP NHAT THONG TIN TAI KHOAN
// ==========================================

async function updateUser(id, data) {
    await getUserById(id);

    const { fullName, email } = data;

    const [existingUsers] = await db.query(`
        SELECT id
        FROM users
        WHERE email = ?
            AND id != ?
    `, [email, id]);

    if (existingUsers.length > 0) {
        throw createError(
            "Email da duoc su dung",
            409
        );
    }

    try {
        await db.query(`
            UPDATE users
            SET
                full_name = ?,
                email = ?
            WHERE id = ?
                AND role = 'issuer'
        `, [
            fullName,
            email,
            id
        ]);

        return await getUserById(id);

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            throw createError(
                "Email da duoc su dung",
                409
            );
        }

        throw error;
    }
}

// ==========================================
// 6. KHOA HOAC MO KHOA TAI KHOAN
// ==========================================

async function updateUserStatus(id, isActive) {
    const user = await getUserById(id);

    if (Boolean(user.is_active) === isActive) {
        throw createError(
            "Tai khoan da o trang thai yeu cau",
            409
        );
    }

    await db.query(`
        UPDATE users
        SET is_active = ?
        WHERE id = ?
            AND role = 'issuer'
    `, [
        isActive ? 1 : 0,
        id
    ]);

    return await getUserById(id);
}

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    updateUserStatus
};
