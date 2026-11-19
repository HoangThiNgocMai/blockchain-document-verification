const db = require("../config/database");

// ================================================
// 1. HAM TAO LOI
// ================================================

function createError(message, statusCode) {

    const error = new Error(message);

    error.statusCode = statusCode;

    return error;

}


// ================================================
// 2. KIEM TRA QUYEN QUAN TRI VIEN
// ================================================

function checkAdmin(user) {

    if (!user) {

        throw createError(
            "Bạn chưa đăng nhập",
            401
        );

    }

    if (user.role !== "admin") {

        throw createError(
            "Bạn không có quyền truy cập",
            403
        );

    }

}


// ================================================
// 3. KET HOP HAI BANG GIAO DICH
// ================================================

const transactionQuery = `

    SELECT

        bt.id,

        'document' AS transaction_type,

        bt.document_id,

        d.document_code,

        d.title AS document_title,

        d.organization_id,

        o.name AS organization_name,

        NULL AS performed_by,

        NULL AS performer_name,

        bt.tx_hash,

        bt.action,

        bt.block_number,

        bt.status,

        bt.created_at

    FROM blockchain_transactions bt

    LEFT JOIN documents d
        ON bt.document_id = d.id

    LEFT JOIN organizations o
        ON d.organization_id = o.id


    UNION ALL


    SELECT

        ot.id,

        'organization' AS transaction_type,

        NULL AS document_id,

        NULL AS document_code,

        NULL AS document_title,

        ot.organization_id,

        o.name AS organization_name,

        ot.performed_by,

        u.full_name AS performer_name,

        ot.tx_hash,

        ot.action,

        ot.block_number,

        ot.status,

        ot.created_at

    FROM organization_transactions ot

    LEFT JOIN organizations o
        ON ot.organization_id = o.id

    LEFT JOIN users u
        ON ot.performed_by = u.id

`;


// ================================================
// 4. LAY DANH SACH GIAO DICH
// ================================================

async function getAllTransactions(user, filters) {

    checkAdmin(user);

    const {

        search = "",

        action = "",

        status = "",

        organizationId = null,

        page = 1,

        limit = 10

    } = filters;


    const conditions = ["1 = 1"];

    const params = [];


    // TIM KIEM GIAO DICH

    if (search) {

        conditions.push(`

            (

                t.tx_hash LIKE ?

                OR t.document_code LIKE ?

                OR t.document_title LIKE ?

                OR t.organization_name LIKE ?

            )

        `);

        const keyword = `%${search}%`;

        params.push(

            keyword,

            keyword,

            keyword,

            keyword

        );

    }


    // LOC THEO LOAI GIAO DICH

    if (action) {

        conditions.push("t.action = ?");

        params.push(action);

    }


    // LOC THEO TRANG THAI

    if (status) {

        conditions.push("t.status = ?");

        params.push(status);

    }


    // LOC THEO DON VI

    if (organizationId !== null) {

        conditions.push(
            "t.organization_id = ?"
        );

        params.push(organizationId);

    }


    // TAO DIEU KIEN WHERE

    const whereClause =
        conditions.join(" AND ");


    // TINH VI TRI PHAN TRANG

    const offset =
        (page - 1) * limit;


    // DEM TONG SO GIAO DICH

    const [countRows] = await db.execute(`

        SELECT COUNT(*) AS total

        FROM (
            ${transactionQuery}
        ) AS t

        WHERE ${whereClause}

    `, params);


    const total =
        Number(countRows[0].total);


    // LAY DANH SACH GIAO DICH

    const [transactions] = await db.execute(`

        SELECT t.*

        FROM (
            ${transactionQuery}
        ) AS t

        WHERE ${whereClause}

        ORDER BY

            t.created_at DESC,

            t.transaction_type ASC,

            t.id DESC

        LIMIT ? OFFSET ?

    `, [

        ...params,

        limit,

        offset

    ]);


    // TRA VE KET QUA

    return {

        transactions,

        pagination: {

            page,

            limit,

            total,

            totalPages:
                Math.ceil(total / limit)

        }

    };

}


// ================================================
// 5. THONG KE GIAO DICH
// ================================================

async function getTransactionStatistics(user) {

    checkAdmin(user);

    const [rows] = await db.execute(`

        SELECT

            COUNT(*) AS total,

            COALESCE(
                SUM(t.status = 'confirmed'), 0
            ) AS confirmed_count,

            COALESCE(
                SUM(t.status = 'pending'), 0
            ) AS pending_count,

            COALESCE(
                SUM(t.status = 'failed'), 0
            ) AS failed_count,

            COALESCE(
                SUM(
                    t.status IS NULL
                    OR t.status NOT IN (
                        'confirmed',
                        'pending',
                        'failed'
                    )
                ), 0
            ) AS unknown_count,

            COALESCE(
                SUM(t.action = 'issue'), 0
            ) AS issue_count,

            COALESCE(
                SUM(t.action = 'revoke'), 0
            ) AS revoke_count,

            COALESCE(
                SUM(t.action = 'authorize'), 0
            ) AS authorize_count,

            COALESCE(
                SUM(t.action = 'deauthorize'), 0
            ) AS deauthorize_count

        FROM (
            ${transactionQuery}
        ) AS t

    `);


    const data = rows[0];


    return {

        total: Number(data.total),

        confirmed: Number(
            data.confirmed_count
        ),

        pending: Number(
            data.pending_count
        ),

        failed: Number(
            data.failed_count
        ),

        unknown: Number(
            data.unknown_count
        ),

        issue: Number(
            data.issue_count
        ),

        revoke: Number(
            data.revoke_count
        ),

        authorize: Number(
            data.authorize_count
        ),

        deauthorize: Number(
            data.deauthorize_count
        )

    };

}


// ================================================
// 6. LAY CHI TIET GIAO DICH
// ================================================

async function getTransactionById(
    type,
    id,
    user
) {

    checkAdmin(user);

    const [transactions] = await db.execute(`

        SELECT t.*

        FROM (
            ${transactionQuery}
        ) AS t

        WHERE t.transaction_type = ?

            AND t.id = ?

        LIMIT 1

    `, [

        type,

        id

    ]);


    if (transactions.length === 0) {

        throw createError(

            "Không tìm thấy giao dịch",

            404

        );

    }

    return transactions[0];

}


// ================================================
// 7. EXPORT MODULE
// ================================================

module.exports = {

    getAllTransactions,

    getTransactionStatistics,

    getTransactionById

};