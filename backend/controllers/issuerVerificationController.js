const issuerVerificationService = require(
  "../services/issuerVerificationService"
);

// ============================================
// 1. DANH SÁCH KẾT QUẢ HỢP LỆ
// ============================================

const VALID_RESULTS = [
  "",
  "valid",
  "mismatch",
  "revoked",
  "not_found",
  "lookup_only",
  "error",
];

// ============================================
// 2. XỬ LÝ LỖI
// ============================================

function handleError(res, error) {

  const statusCode = [400, 401, 403].includes(
    error.statusCode
  )
    ? error.statusCode
    : 500;

  console.error(
    "Lỗi lịch sử xác thực:",
    error.message
  );

  return res.status(statusCode).json({
    success: false,

    message:
      statusCode === 500
        ? "Không thể xử lý dữ liệu xác thực."
        : error.message,
  });
}

// ============================================
// 3. KIỂM TRA NGÀY
// ============================================

function isValidDate(value) {

  if (value === "") return true;

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const year = Number(value.slice(0, 4));

  if (year < 1000 || year > 9998) {
    return false;
  }

  const date = new Date(
    `${value}T00:00:00Z`
  );

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

// ============================================
// 4. LẤY DANH SÁCH LỊCH SỬ XÁC THỰC
// ============================================

async function getAllVerifications(req, res) {

  try {

    const search = req.query.search ?? "";
    const result = req.query.result ?? "";

    const fromDate = req.query.fromDate ?? "";
    const toDate = req.query.toDate ?? "";

    const rawPage = req.query.page ?? "1";
    const rawLimit = req.query.limit ?? "10";

    // Kiểm tra bộ lọc

    if (
      typeof search !== "string" ||
      search.length > 255 ||
      !VALID_RESULTS.includes(result) ||
      !isValidDate(fromDate) ||
      !isValidDate(toDate) ||
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

    // Kiểm tra khoảng thời gian

    if (
      fromDate &&
      toDate &&
      fromDate > toDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Ngày bắt đầu không được lớn hơn ngày kết thúc.",
      });
    }

    // Kiểm tra phân trang

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

    const data =
      await issuerVerificationService.getAllVerifications(
        req.user,
        {
          search: search.trim(),
          result,
          fromDate,
          toDate,
          page,
          limit,
        }
      );

    return res.status(200).json({
      success: true,

      message: "Lấy lịch sử xác thực thành công.",

      data: data.verifications,

      pagination: data.pagination,
    });

  } catch (error) {

    return handleError(res, error);

  }
}

// ============================================
// 5. LẤY THỐNG KÊ
// ============================================

async function getStatistics(req, res) {

  try {

    const data =
      await issuerVerificationService.getStatistics(
        req.user
      );

    return res.status(200).json({
      success: true,

      message: "Lấy thống kê xác thực thành công.",

      data,
    });

  } catch (error) {

    return handleError(res, error);

  }
}

// ============================================
// 6. XUẤT CÁC HÀM
// ============================================

module.exports = {
  getAllVerifications,
  getStatistics,
};