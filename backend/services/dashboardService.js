
const db = require("../config/database");

// ==========================================
// 1. HAM TAO LOI
// ==========================================

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

// ==========================================
// 2. KIEM TRA PHAM VI THONG KE
// ==========================================

function getUserScope(user) {

    if (!user) {

        throw createError(
            "Ban chua dang nhap",
            401
        );

    }

    if (user.role === "admin") {

        return {
            condition: "1 = 1",
            params: []
        };

    }

    if (
        user.role === "issuer" &&
        Number.isSafeInteger(user.id) &&
        user.id > 0
    ) {

        return {
            condition: "d.issued_by = ?",
            params: [user.id]
        };

    }

    throw createError(
        "Ban khong co quyen truy cap",
        403
    );
}

// ==========================================
// 3. THONG KE TAI LIEU
// ==========================================

async function getDocumentStats(user) {

    const scope = getUserScope(user);

    const [rows] = await db.execute(`
        SELECT
            COUNT(*) AS total,

            COALESCE(
                SUM(d.status = 'issued'), 0
            ) AS issued,

            COALESCE(
                SUM(d.status = 'revoked'), 0
            ) AS revoked,

            COALESCE(
                SUM(d.status = 'pending'), 0
            ) AS pending,

            COALESCE(
                SUM(d.status = 'failed'), 0
            ) AS failed

        FROM documents d

        WHERE ${scope.condition}

    `, scope.params);

    return {
        total: Number(rows[0].total),
        issued: Number(rows[0].issued),
        revoked: Number(rows[0].revoked),
        pending: Number(rows[0].pending),
        failed: Number(rows[0].failed)
    };

}

// ==========================================
// 4. THONG KE TO CHUC
// ==========================================

async function getOrganizationStats() {

    const [rows] = await db.execute(`
        SELECT

            COUNT(*) AS total,

            COALESCE(
                SUM(is_authorized = 1), 0
            ) AS authorized,

            COALESCE(
                SUM(is_authorized = 0), 0
            ) AS unauthorized

        FROM organizations
    `);

    return {
        total: Number(rows[0].total),

        authorized:
            Number(rows[0].authorized),

        unauthorized:
            Number(rows[0].unauthorized)
    };

}

// ==========================================
// 5. THONG KE TAI KHOAN ISSUER
// ==========================================

async function getIssuerStats() {

    const [rows] = await db.execute(`
        SELECT

            COUNT(*) AS total,

            COALESCE(
                SUM(is_active = 1), 0
            ) AS active,

            COALESCE(
                SUM(is_active = 0), 0
            ) AS inactive

        FROM users

        WHERE role = 'issuer'
    `);

    return {
        total: Number(rows[0].total),

        active: Number(rows[0].active),

        inactive: Number(rows[0].inactive)
    };

}

// ==========================================
// 6. THONG KE GIAO DICH BLOCKCHAIN
// ==========================================


async function getTransactionStats(user) {

    const scope = getUserScope(user);

    const [rows] = await db.execute(`
        SELECT

            COUNT(*) AS total,

            COALESCE(
                SUM(bt.action = 'issue'), 0
            ) AS issue_count,

            COALESCE(
                SUM(bt.action = 'revoke'), 0
            ) AS revoke_count,

            COALESCE(
                SUM(bt.status = 'confirmed'), 0
            ) AS confirmed,

            COALESCE(
                SUM(bt.status = 'pending'), 0
            ) AS pending,

            COALESCE(
                SUM(bt.status = 'failed'), 0
            ) AS failed

        FROM blockchain_transactions bt

        INNER JOIN documents d
            ON bt.document_id = d.id

        WHERE ${scope.condition}

    `, scope.params);

    return {

        total: Number(rows[0].total),

        issue: Number(rows[0].issue_count),

        revoke: Number(rows[0].revoke_count),

        confirmed: Number(rows[0].confirmed),

        pending: Number(rows[0].pending),

        failed: Number(rows[0].failed)

    };
}

// ==========================================
// 7. THONG KE LUOT XAC THUC
// ==========================================

async function getVerificationStats(user) {

    const scope = getUserScope(user);

    const [rows] = await db.execute(`
        SELECT

            COUNT(*) AS total,

            COALESCE(
                SUM(vl.result = 'valid'), 0
            ) AS valid,

            COALESCE(
                SUM(vl.result = 'mismatch'), 0
            ) AS mismatch,

            COALESCE(
                SUM(vl.result = 'revoked'), 0
            ) AS revoked,

            COALESCE(
                SUM(vl.result = 'not_found'), 0
            ) AS not_found,

            COALESCE(
                SUM(vl.result = 'lookup_only'), 0
            ) AS lookup_only,

            COALESCE(
                SUM(vl.result = 'error'), 0
            ) AS error,

            COALESCE(
                SUM(vl.result = 'unauthorized_issuer'), 0
            ) AS unauthorized_issuer

        FROM verification_logs vl

        LEFT JOIN documents d
            ON vl.document_id = d.id

        WHERE ${scope.condition}

    `, scope.params);

    return {
        total: Number(rows[0].total),

        valid: Number(rows[0].valid),

        mismatch: Number(rows[0].mismatch),

        revoked: Number(rows[0].revoked),

        notFound: Number(rows[0].not_found),

        lookupOnly: Number(rows[0].lookup_only),

        error: Number(rows[0].error),

        unauthorizedIssuer:
            Number(rows[0].unauthorized_issuer)
    };

}

// ==========================================
// 8. LAY 5 TAI LIEU GAN DAY
// ==========================================

async function getRecentDocuments(user) {

    const scope = getUserScope(user);

    const [rows] = await db.execute(`
        SELECT

            d.id,
            d.document_code,
            d.title,
            d.document_type,
            d.status,
            d.blockchain_tx,
            d.issued_at,
            d.created_at,

            o.name AS organization_name,

            u.full_name AS issuer_name

        FROM documents d

        LEFT JOIN organizations o
            ON d.organization_id = o.id

        LEFT JOIN users u
            ON d.issued_by = u.id

        WHERE ${scope.condition}

        ORDER BY d.id DESC

        LIMIT 5

    `, scope.params);

    return rows;

}

// ==========================================
// 9. DASHBOARD ADMIN
// ==========================================

async function getAdminDashboard(user) {

    if (!user || user.role !== "admin") {

        throw createError(
            "Ban khong co quyen truy cap",
            403
        );

    }

    const [
        documents,
        organizations,
        issuers,
        transactions,
        verifications,
        recentDocuments
    ] = await Promise.all([

        getDocumentStats(user),

        getOrganizationStats(),

        getIssuerStats(),

        getTransactionStats(user),

        getVerificationStats(user),

        getRecentDocuments(user)

    ]);

    return {
        documents,
        organizations,
        issuers,
        transactions,
        verifications,
        recentDocuments
    };

}

// ==========================================
// 10. DASHBOARD ISSUER
// ==========================================

async function getIssuerDashboard(user) {

    if (!user || user.role !== "issuer") {

        throw createError(
            "Ban khong co quyen truy cap",
            403
        );

    }

    const [
        documents,
        transactions,
        verifications,
        recentDocuments
    ] = await Promise.all([

        getDocumentStats(user),

        getTransactionStats(user),

        getVerificationStats(user),

        getRecentDocuments(user)

    ]);

    return {
        documents,
        transactions,
        verifications,
        recentDocuments
    };

}

// ==========================================
// 11. EXPORT MODULE
// ==========================================

module.exports = {
    getAdminDashboard,
    getIssuerDashboard
};
