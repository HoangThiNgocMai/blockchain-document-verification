const db = require("../config/database");


// ================================================
// 1. TAO LOI
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
            "Bạn chưa đăng nhập.",
            401
        );

    }

    if (user.role !== "admin") {

        throw createError(
            "Bạn không có quyền truy cập.",
            403
        );

    }

}


// ================================================
// 3. CAU TRUY VAN CHUNG
// ================================================

const verificationQuery = `

    SELECT

        vl.id,

        vl.document_id,

        vl.searched_code,

        vl.result,

        vl.verified_at,

        d.document_code,

        d.title AS document_title,

        d.document_type,

        d.status AS document_status,

        d.organization_id,

        o.name AS organization_name

    FROM verification_logs vl

    LEFT JOIN documents d
        ON vl.document_id = d.id

    LEFT JOIN organizations o
        ON d.organization_id = o.id

`;


// ================================================
// 4. LAY DANH SACH LICH SU XAC THUC
// ================================================

async function getAllVerificationLogs(
    user,
    filters = {}
) {

    checkAdmin(user);


    const {

        search = "",

        result = "",

        organizationId = null,

        fromDate = "",

        toDate = "",

        page = 1,

        limit = 10

    } = filters;


    const conditions = [];

    const params = [];


    // TIM KIEM

    if (search) {

        const keyword = `%${search}%`;

        conditions.push(`

            (

                vl.searched_code LIKE ?

                OR d.document_code LIKE ?

                OR d.title LIKE ?

                OR o.name LIKE ?

            )

        `);

        params.push(

            keyword,

            keyword,

            keyword,

            keyword

        );

    }


    // LOC KET QUA XAC THUC

    if (result) {

        conditions.push("vl.result = ?");

        params.push(result);

    }


    // LOC DON VI CAP PHAT

    if (organizationId !== null) {

        conditions.push("d.organization_id = ?");

        params.push(organizationId);

    }


    // LOC TU NGAY

    if (fromDate) {

        conditions.push("vl.verified_at >= ?");

        params.push(`${fromDate} 00:00:00`);

    }


    // LOC DEN NGAY

    if (toDate) {

        conditions.push(`

            vl.verified_at < DATE_ADD(
                ?,
                INTERVAL 1 DAY
            )

        `);

        params.push(toDate);

    }


    // TAO DIEU KIEN WHERE

    const whereClause = conditions.length > 0

        ? `WHERE ${conditions.join(" AND ")}`

        : "";


    // TINH TONG SO BAN GHI

    const countSql = `

        SELECT COUNT(*) AS total

        FROM (

            ${verificationQuery}

            ${whereClause}

        ) AS verification_data

    `;


    const [countRows] = await db.query(

        countSql,

        params

    );


    const total = Number(countRows[0].total);


    // TINH VI TRI PHAN TRANG

    const offset = (page - 1) * limit;


    // LAY DANH SACH

    const dataSql = `

        ${verificationQuery}

        ${whereClause}

        ORDER BY

            vl.verified_at DESC,

            vl.id DESC

        LIMIT ? OFFSET ?

    `;


    const [rows] = await db.query(

        dataSql,

        [...params, limit, offset]

    );


    // TRA VE KET QUA

    return {

        verifications: rows,

        pagination: {

            page,

            limit,

            total,

            totalPages: Math.ceil(total / limit)

        }

    };

}


// ================================================
// 5. THONG KE LICH SU XAC THUC
// ================================================

async function getVerificationStatistics(user) {

    checkAdmin(user);


    const sql = `

        SELECT

            COUNT(*) AS total,

            SUM(
                CASE WHEN result = 'valid'
                THEN 1 ELSE 0 END
            ) AS valid_count,

            SUM(
                CASE WHEN result = 'mismatch'
                THEN 1 ELSE 0 END
            ) AS mismatch_count,

            SUM(
                CASE WHEN result = 'revoked'
                THEN 1 ELSE 0 END
            ) AS revoked_count,

            SUM(
                CASE WHEN result = 'not_found'
                THEN 1 ELSE 0 END
            ) AS not_found_count,

            SUM(
                CASE WHEN result = 'lookup_only'
                THEN 1 ELSE 0 END
            ) AS lookup_only_count,

            SUM(
                CASE WHEN result = 'error'
                THEN 1 ELSE 0 END
            ) AS error_count

        FROM verification_logs

    `;


    const [rows] = await db.query(sql);

    const statistics = rows[0];


    return {

        total: Number(statistics.total || 0),

        valid: Number(statistics.valid_count || 0),

        mismatch: Number(statistics.mismatch_count || 0),

        revoked: Number(statistics.revoked_count || 0),

        notFound: Number(statistics.not_found_count || 0),

        lookupOnly: Number(statistics.lookup_only_count || 0),

        error: Number(statistics.error_count || 0)

    };

}


// ================================================
// 6. LAY CHI TIET LICH SU XAC THUC
// ================================================

async function getVerificationLogById(id, user) {

    checkAdmin(user);


    const sql = `

        ${verificationQuery}

        WHERE vl.id = ?

        LIMIT 1

    `;


    const [rows] = await db.query(

        sql,

        [id]

    );


    if (rows.length === 0) {

        throw createError(

            "Không tìm thấy lịch sử xác thực.",

            404

        );

    }


    return rows[0];

}


// ================================================
// 7. EXPORT
// ================================================

module.exports = {

    getAllVerificationLogs,

    getVerificationStatistics,

    getVerificationLogById

};