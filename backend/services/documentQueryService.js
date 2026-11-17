
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
// 2. KIEM TRA PHAM VI TRUY CAP
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
// 3. LAY DANH SACH TAI LIEU
// ==========================================

async function getAllDocuments(user, filters) {

    const {
        search = "",
        status = "",
        organizationId = null,
        page = 1,
        limit = 10
    } = filters;

    const scope = getUserScope(user);

    const conditions = [
        scope.condition
    ];

    const params = [
        ...scope.params
    ];

    // Tim kiem tai lieu

    if (search) {

        conditions.push(`
            (
                d.title LIKE ?
                OR d.document_code LIKE ?
                OR d.document_type LIKE ?
            )
        `);

        const keyword = `%${search}%`;

        params.push(
            keyword,
            keyword,
            keyword
        );
    }

    // Loc theo trang thai

    if (status) {

        conditions.push("d.status = ?");

        params.push(status);
    }

    // Loc theo to chuc

    if (organizationId !== null) {

        if (user.role !== "admin") {

            throw createError(
                "Ban khong co quyen loc theo to chuc",
                403
            );

        }

        conditions.push(
            "d.organization_id = ?"
        );

        params.push(organizationId);
    }

    // Tao dieu kien WHERE

    const whereClause =
        conditions.join(" AND ");

    // Tinh vi tri bat dau phan trang

    const offset =
        (page - 1) * limit;

    // Dem tong so tai lieu

    const [countRows] = await db.execute(`
        SELECT COUNT(*) AS total
        FROM documents d
        WHERE ${whereClause}
    `, params);

    const total =
        Number(countRows[0].total);

    // Lay danh sach tai lieu

    const [documents] = await db.execute(`
        SELECT
            d.id,
            d.document_code,
            d.title,
            d.document_type,
            d.file_hash,
            d.organization_id,
            d.issued_by,
            d.blockchain_tx,
            d.status,
            d.issued_at,
            d.created_at,

            o.name AS organization_name,

            u.full_name AS issuer_name

        FROM documents d

        LEFT JOIN organizations o
            ON d.organization_id = o.id

        LEFT JOIN users u
            ON d.issued_by = u.id

        WHERE ${whereClause}

        ORDER BY d.id DESC

        LIMIT ? OFFSET ?
    `, [
        ...params,
        limit,
        offset
    ]);

    // Tra ve danh sach va phan trang

    return {

        documents,

        pagination: {

            page,

            limit,

            total,

            totalPages:
                Math.ceil(total / limit)

        }

    };
}

// ==========================================
// 4. LAY CHI TIET TAI LIEU
// ==========================================

async function getDocumentById(id, user) {

    const scope = getUserScope(user);

    const [documents] = await db.execute(`
        SELECT
            d.id,
            d.document_code,
            d.title,
            d.document_type,
            d.file_hash,
            d.organization_id,
            d.issued_by,
            d.blockchain_tx,
            d.status,
            d.issued_at,
            d.created_at,

            o.name AS organization_name,
            o.wallet_address,
            o.is_authorized,

            u.full_name AS issuer_name

        FROM documents d

        LEFT JOIN organizations o
            ON d.organization_id = o.id

        LEFT JOIN users u
            ON d.issued_by = u.id

        WHERE d.id = ?
            AND ${scope.condition}

        LIMIT 1
    `, [
        id,
        ...scope.params
    ]);

    if (documents.length === 0) {

        throw createError(
            "Khong tim thay tai lieu",
            404
        );

    }

    return documents[0];
}

// ==========================================
// 5. LICH SU GIAO DICH BLOCKCHAIN
// ==========================================

async function getDocumentTransactions(id, user) {

    // Kiem tra quyen truy cap tai lieu

    await getDocumentById(id, user);

    const scope = getUserScope(user);

    const [transactions] = await db.execute(`
        SELECT
            bt.id,
            bt.document_id,
            bt.tx_hash,
            bt.action,
            bt.block_number,
            bt.status,
            bt.created_at

        FROM blockchain_transactions bt

        INNER JOIN documents d
            ON bt.document_id = d.id

        WHERE bt.document_id = ?
            AND ${scope.condition}

        ORDER BY bt.id DESC
    `, [
        id,
        ...scope.params
    ]);

    return transactions;
}

// ==========================================
// 6. LICH SU XAC THUC TAI LIEU
// ==========================================

async function getDocumentVerifications(
    id,
    user,
    page = 1,
    limit = 10
) {

    // Kiem tra quyen truy cap tai lieu

    await getDocumentById(id, user);

    const scope = getUserScope(user);

    const offset =
        (page - 1) * limit;

    const params = [
        id,
        ...scope.params
    ];

    // Dem tong so luot xac thuc

    const [countRows] = await db.execute(`
        SELECT COUNT(*) AS total

        FROM verification_logs vl

        INNER JOIN documents d
            ON vl.document_id = d.id

        WHERE vl.document_id = ?
            AND ${scope.condition}
    `, params);

    const total =
        Number(countRows[0].total);

    // Lay lich su xac thuc

    const [verifications] = await db.execute(`
        SELECT
            vl.id,
            vl.document_id,
            vl.searched_code,
            vl.result,
            vl.verified_at

        FROM verification_logs vl

        INNER JOIN documents d
            ON vl.document_id = d.id

        WHERE vl.document_id = ?
            AND ${scope.condition}

        ORDER BY vl.id DESC

        LIMIT ? OFFSET ?
    `, [
        ...params,
        limit,
        offset
    ]);

    return {

        verifications,

        pagination: {

            page,

            limit,

            total,

            totalPages:
                Math.ceil(total / limit)

        }

    };
}

// ==========================================
// 7. EXPORT MODULE
// ==========================================

module.exports = {
    getAllDocuments,
    getDocumentById,
    getDocumentTransactions,
    getDocumentVerifications
};
