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
// 2. LẤY DANH SÁCH GIAO DỊCH
// ============================================

async function getAllTransactions(user, filters = {}) {
  checkIssuer(user);

  const {
    search = "",
    action = "",
    status = "",
    page = 1,
    limit = 10,
  } = filters;

  const conditions = ["d.issued_by = ?"];
  const params = [user.id];

  // Tìm kiếm
  if (search) {
    conditions.push(`
      (
        bt.tx_hash LIKE ?
        OR d.document_code LIKE ?
        OR d.title LIKE ?
      )
    `);

    const keyword = `%${search}%`;

    params.push(keyword, keyword, keyword);
  }

  // Lọc loại giao dịch
  if (action) {
    conditions.push("bt.action = ?");
    params.push(action);
  }

  // Lọc trạng thái
  if (status) {
    conditions.push("bt.status = ?");
    params.push(status);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (page - 1) * limit;

  // Đếm tổng giao dịch
  const [countRows] = await db.execute(
    `
    SELECT COUNT(*) AS total
    FROM blockchain_transactions bt
    INNER JOIN documents d
      ON bt.document_id = d.id
    WHERE ${whereClause}
    `,
    params
  );

  const total = Number(countRows[0].total);

  // Lấy dữ liệu giao dịch
  const [rows] = await db.execute(
    `
    SELECT
      bt.id,
      bt.document_id,
      bt.tx_hash,
      bt.action,
      bt.block_number,
      bt.status,
      bt.created_at,
      d.document_code,
      d.title AS document_title

    FROM blockchain_transactions bt

    INNER JOIN documents d
      ON bt.document_id = d.id

    WHERE ${whereClause}

    ORDER BY bt.created_at DESC, bt.id DESC

    LIMIT ? OFFSET ?
    `,
    [...params, limit, offset]
  );

  return {
    transactions: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ============================================
// 3. THỐNG KÊ GIAO DỊCH
// ============================================

async function getStatistics(user) {
  checkIssuer(user);

  const [rows] = await db.execute(
    `
    SELECT
      COUNT(*) AS total,

      SUM(
        CASE WHEN bt.status = 'confirmed'
        THEN 1 ELSE 0 END
      ) AS confirmed_count,

      SUM(
        CASE WHEN bt.status = 'pending'
        THEN 1 ELSE 0 END
      ) AS pending_count,

      SUM(
        CASE WHEN bt.status = 'failed'
        THEN 1 ELSE 0 END
      ) AS failed_count,

      SUM(
        CASE WHEN bt.action = 'issue'
        THEN 1 ELSE 0 END
      ) AS issue_count,

      SUM(
        CASE WHEN bt.action = 'revoke'
        THEN 1 ELSE 0 END
      ) AS revoke_count

    FROM blockchain_transactions bt

    INNER JOIN documents d
      ON bt.document_id = d.id

    WHERE d.issued_by = ?
    `,
    [user.id]
  );

  const data = rows[0];

  return {
    total: Number(data.total || 0),
    confirmed: Number(data.confirmed_count || 0),
    pending: Number(data.pending_count || 0),
    failed: Number(data.failed_count || 0),
    issue: Number(data.issue_count || 0),
    revoke: Number(data.revoke_count || 0),
  };
}

module.exports = {
  getAllTransactions,
  getStatistics,
};