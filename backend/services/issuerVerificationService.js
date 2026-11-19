const db = require("../config/database");

// ============================================
// 1. KIỂM TRA QUYỀN NGƯỜI CẤP PHÁT
// ============================================

function checkIssuer(user) {
  if (!user || user.role !== "issuer") {
    const error = new Error(
      "Bạn không có quyền truy cập."
    );

    error.statusCode = 403;
    throw error;
  }
}

// ============================================
// 2. LẤY DANH SÁCH LỊCH SỬ XÁC THỰC
// ============================================

async function getAllVerifications(user, filters = {}) {

  checkIssuer(user);

  const {
    search = "",
    result = "",
    fromDate = "",
    toDate = "",
    page = 1,
    limit = 10,
  } = filters;

  const conditions = ["d.issued_by = ?"];
  const params = [user.id];

  // Tìm kiếm tài liệu

  if (search) {
    conditions.push(`
      (
        vl.searched_code LIKE ?
        OR d.document_code LIKE ?
        OR d.title LIKE ?
      )
    `);

    const keyword = `%${search}%`;

    params.push(keyword, keyword, keyword);
  }

  // Lọc kết quả xác thực

  if (result) {
    conditions.push("vl.result = ?");
    params.push(result);
  }

  // Lọc từ ngày

  if (fromDate) {
    conditions.push("vl.verified_at >= ?");
    params.push(`${fromDate} 00:00:00`);
  }

  // Lọc đến hết ngày

  if (toDate) {
    conditions.push(`
      vl.verified_at < DATE_ADD(?, INTERVAL 1 DAY)
    `);

    params.push(toDate);
  }

  const whereClause = conditions.join(" AND ");

  const offset = (page - 1) * limit;

  // Đếm tổng số lượt xác thực

  const [countRows] = await db.execute(
    `
    SELECT COUNT(*) AS total

    FROM verification_logs vl

    INNER JOIN documents d
      ON vl.document_id = d.id

    WHERE ${whereClause}
    `,
    params
  );

  const total = Number(countRows[0].total);

  // Lấy danh sách lịch sử xác thực

  const [rows] = await db.execute(
    `
    SELECT
      vl.id,
      vl.document_id,
      vl.searched_code,
      vl.result,
      vl.verified_at,

      d.document_code,
      d.title AS document_title,
      d.document_type,
      d.status AS document_status

    FROM verification_logs vl

    INNER JOIN documents d
      ON vl.document_id = d.id

    WHERE ${whereClause}

    ORDER BY
      vl.verified_at DESC,
      vl.id DESC

    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  );

  return {
    verifications: rows,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// 3. THỐNG KÊ LỊCH SỬ XÁC THỰC
// ============================================

async function getStatistics(user) {

  checkIssuer(user);

  const [rows] = await db.execute(
    `
    SELECT

      COUNT(*) AS total,

      SUM(
        CASE WHEN vl.result = 'valid'
        THEN 1 ELSE 0 END
      ) AS valid_count,

      SUM(
        CASE WHEN vl.result = 'mismatch'
        THEN 1 ELSE 0 END
      ) AS mismatch_count,

      SUM(
        CASE WHEN vl.result = 'revoked'
        THEN 1 ELSE 0 END
      ) AS revoked_count,

      SUM(
        CASE WHEN vl.result = 'not_found'
        THEN 1 ELSE 0 END
      ) AS not_found_count,

      SUM(
        CASE WHEN vl.result = 'lookup_only'
        THEN 1 ELSE 0 END
      ) AS lookup_only_count,

      SUM(
        CASE WHEN vl.result = 'error'
        THEN 1 ELSE 0 END
      ) AS error_count

    FROM verification_logs vl

    INNER JOIN documents d
      ON vl.document_id = d.id

    WHERE d.issued_by = ?
    `,
    [user.id]
  );

  const data = rows[0];

  return {
    total: Number(data.total || 0),

    valid: Number(data.valid_count || 0),

    mismatch: Number(data.mismatch_count || 0),

    revoked: Number(data.revoked_count || 0),

    notFound: Number(data.not_found_count || 0),

    lookupOnly: Number(data.lookup_only_count || 0),

    error: Number(data.error_count || 0),
  };
}

// ============================================
// 4. XUẤT CÁC HÀM
// ============================================

module.exports = {
  getAllVerifications,
  getStatistics,
};