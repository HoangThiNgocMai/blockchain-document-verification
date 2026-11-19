const verificationLogService =
    require("../services/verificationLogService");


// ================================================
// 1. CAC KET QUA XAC THUC HOP LE
// ================================================

const VALID_RESULTS = [

    "valid",

    "mismatch",

    "revoked",

    "not_found",

    "lookup_only",

    "error"

];


// ================================================
// 2. TAO LOI
// ================================================

function createError(message, statusCode = 400) {

    const error = new Error(message);

    error.statusCode = statusCode;

    return error;

}


// ================================================
// 3. XU LY LOI
// ================================================

function handleError(res, error) {

    const allowedCodes = [400, 401, 403, 404];

    const statusCode =
        allowedCodes.includes(error.statusCode)
            ? error.statusCode
            : 500;

    if (statusCode === 500) {

        console.error(
            "Loi quan ly lich su xac thuc:",
            error
        );

    }

    return res.status(statusCode).json({

        success: false,

        message: statusCode === 500

            ? "Đã xảy ra lỗi máy chủ."

            : error.message

    });

}


// ================================================
// 4. KIEM TRA CHUOI
// ================================================

function parseText(value, fieldName, maxLength) {

    if (value === undefined) {

        return "";

    }

    if (typeof value !== "string") {

        throw createError(
            `${fieldName} không hợp lệ.`
        );

    }

    const text = value.trim();

    if (text.length > maxLength) {

        throw createError(
            `${fieldName} không được vượt quá ${maxLength} ký tự.`
        );

    }

    return text;

}


// ================================================
// 5. KIEM TRA SO NGUYEN DUONG
// ================================================

function parsePositiveInteger(
    value,
    fieldName,
    max = Number.MAX_SAFE_INTEGER
) {

    if (

        typeof value !== "string" ||

        !/^[1-9]\d*$/.test(value)

    ) {

        throw createError(
            `${fieldName} phải là số nguyên dương.`
        );

    }

    const number = Number(value);

    if (

        !Number.isSafeInteger(number) ||

        number < 1 ||

        number > max

    ) {

        throw createError(
            `${fieldName} không hợp lệ.`
        );

    }

    return number;

}


// ================================================
// 6. KIEM TRA NGAY THANG
// ================================================

function parseDate(value, fieldName) {

    if (value === undefined || value === "") {

        return "";

    }

    if (

        typeof value !== "string" ||

        !/^\d{4}-\d{2}-\d{2}$/.test(value)

    ) {

        throw createError(

            `${fieldName} phải có định dạng YYYY-MM-DD.`

        );

    }

    const year = Number(value.slice(0, 4));

    if (year < 1000 || year > 9998) {

        throw createError(
            `${fieldName} không hợp lệ.`
        );

    }

    const date = new Date(
        `${value}T00:00:00Z`
    );

    if (

        Number.isNaN(date.getTime()) ||

        date.toISOString().slice(0, 10) !== value

    ) {

        throw createError(
            `${fieldName} không hợp lệ.`
        );

    }

    return value;

}


// ================================================
// 7. LAY DANH SACH LICH SU XAC THUC
// GET /api/verification-logs
// ================================================

async function getAllVerificationLogs(req, res) {

    try {

        // TIM KIEM

        const search = parseText(

            req.query.search,

            "Từ khóa tìm kiếm",

            255

        );


        // KET QUA XAC THUC

        const result = parseText(

            req.query.result,

            "Kết quả xác thực",

            50

        );

        if (

            result &&

            !VALID_RESULTS.includes(result)

        ) {

            throw createError(

                "Kết quả xác thực không hợp lệ."

            );

        }


        // DON VI CAP PHAT

        let organizationId = null;

        if (

            req.query.organizationId !== undefined &&

            req.query.organizationId !== ""

        ) {

            organizationId = parsePositiveInteger(

                req.query.organizationId,

                "ID đơn vị"

            );

        }


        // THOI GIAN BAT DAU

        const fromDate = parseDate(

            req.query.fromDate,

            "Ngày bắt đầu"

        );


        // THOI GIAN KET THUC

        const toDate = parseDate(

            req.query.toDate,

            "Ngày kết thúc"

        );


        // KIEM TRA KHOANG THOI GIAN

        if (

            fromDate &&

            toDate &&

            fromDate > toDate

        ) {

            throw createError(

                "Ngày bắt đầu không được lớn hơn ngày kết thúc."

            );

        }


        // PHAN TRANG

        const page = parsePositiveInteger(

            req.query.page ?? "1",

            "Số trang",

            1000000

        );


        const limit = parsePositiveInteger(

            req.query.limit ?? "10",

            "Số dòng mỗi trang",

            100

        );


        // TAO BO LOC

        const filters = {

            search,

            result,

            organizationId,

            fromDate,

            toDate,

            page,

            limit

        };


        // GOI SERVICE

        const data =
            await verificationLogService
                .getAllVerificationLogs(

                    req.user,

                    filters

                );


        // TRA VE KET QUA

        return res.status(200).json({

            success: true,

            message:
                "Lấy lịch sử xác thực thành công.",

            data: data.verifications,

            pagination: data.pagination

        });

    } catch (error) {

        return handleError(res, error);

    }

}


// ================================================
// 8. LAY THONG KE XAC THUC
// GET /api/verification-logs/statistics
// ================================================

async function getStatistics(req, res) {

    try {

        const statistics =
            await verificationLogService
                .getVerificationStatistics(req.user);

        return res.status(200).json({

            success: true,

            message:
                "Lấy thống kê xác thực thành công.",

            data: statistics

        });

    } catch (error) {

        return handleError(res, error);

    }

}


// ================================================
// 9. LAY CHI TIET LICH SU XAC THUC
// GET /api/verification-logs/:id
// ================================================

async function getVerificationLogById(req, res) {

    try {

        const id = parsePositiveInteger(

            req.params.id,

            "ID lịch sử xác thực"

        );


        const verification =
            await verificationLogService
                .getVerificationLogById(

                    id,

                    req.user

                );


        return res.status(200).json({

            success: true,

            message:
                "Lấy chi tiết lịch sử xác thực thành công.",

            data: verification

        });

    } catch (error) {

        return handleError(res, error);

    }

}


// ================================================
// 10. EXPORT
// ================================================

module.exports = {

    getAllVerificationLogs,

    getStatistics,

    getVerificationLogById

};