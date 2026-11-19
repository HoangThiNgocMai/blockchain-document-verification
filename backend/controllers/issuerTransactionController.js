const issuerTransactionService = require(
  "../services/issuerTransactionService"
);

// ============================================
// 1. XỬ LÝ LỖI
// ============================================

function handleError(res, error) {
  const statusCode = [400, 401, 403].includes(
    error.statusCode
  )
    ? error.statusCode
    : 500;

  console.error("Lỗi giao dịch:", error.message);

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Không thể xử lý dữ liệu giao dịch."
        : error.message,
  });
}

// ============================================
// 2. LẤY DANH SÁCH GIAO DỊCH
// ============================================

async function getAllTransactions(req, res) {
  try {
    const search = req.query.search ?? "";
    const action = req.query.action ?? "";
    const status = req.query.status ?? "";

    const rawPage = req.query.page ?? "1";
    const rawLimit = req.query.limit ?? "10";

    // Kiểm tra tham số
    if (
      typeof search !== "string" ||
      search.length > 255 ||
      !["", "issue", "revoke"].includes(action) ||
      !["", "confirmed", "pending", "failed"]
        .includes(status) ||
      typeof rawPage !== "string" ||
      typeof rawLimit !== "string" ||
      !/^[1-9]\d*$/.test(rawPage) ||
      !/^[1-9]\d*$/.test(rawLimit)
    ) {
      return res.status(400).json({
        success: false,
        message: "Tham số tìm kiếm không hợp lệ.",
      });
    }

    const page = Number(rawPage);
    const limit = Number(rawLimit);

    if (
      !Number.isSafeInteger(page) ||
      !Number.isSafeInteger(limit) ||
      page > 1000000 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Thông tin phân trang không hợp lệ.",
      });
    }

    const result =
      await issuerTransactionService.getAllTransactions(
        req.user,
        {
          search: search.trim(),
          action,
          status,
          page,
          limit,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách giao dịch thành công.",
      data: result.transactions,
      pagination: result.pagination,
    });

  } catch (error) {
    return handleError(res, error);
  }
}

// ============================================
// 3. THỐNG KÊ GIAO DỊCH
// ============================================

async function getStatistics(req, res) {
  try {
    const data =
      await issuerTransactionService.getStatistics(
        req.user
      );

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê giao dịch thành công.",
      data,
    });

  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  getAllTransactions,
  getStatistics,
};