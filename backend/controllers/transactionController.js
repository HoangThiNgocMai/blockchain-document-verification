const transactionService = require(
    "../services/transactionService"
);


// ================================================
// 1. HAM XU LY LOI
// ================================================

function handleError(res, error) {

    console.error(

        "Transaction Error:",

        error.code || error.name

    );

    const statusCode =

        [400, 401, 403, 404]
            .includes(error.statusCode)

            ? error.statusCode

            : 500;


    return res.status(statusCode).json({

        success: false,

        message: statusCode === 500

            ? "Lỗi truy vấn giao dịch"

            : error.message

    });

}


// ================================================
// 2. KIEM TRA ID
// ================================================

function isValidId(id) {

    return (

        Number.isSafeInteger(id) &&

        id > 0

    );

}


// ================================================
// 3. LAY DANH SACH GIAO DICH
// ================================================

async function getAllTransactions(req, res) {

    try {

        const search =
            String(req.query.search ?? "").trim();

        const action =
            String(req.query.action ?? "").trim();

        const status =
            String(req.query.status ?? "").trim();

        const page =
            Number(req.query.page ?? 1);

        const limit =
            Number(req.query.limit ?? 10);

        const organizationId =

            req.query.organizationId === undefined

                ? null

                : Number(req.query.organizationId);


        // KIEM TRA TU KHOA

        if (search.length > 255) {

            return res.status(400).json({

                success: false,

                message: "Từ khóa tìm kiếm quá dài"

            });

        }


        // KIEM TRA LOAI GIAO DICH

        const allowedActions = [

            "issue",

            "revoke",

            "authorize",

            "deauthorize"

        ];

        if (
            action &&
            !allowedActions.includes(action)
        ) {

            return res.status(400).json({

                success: false,

                message: "Loại giao dịch không hợp lệ"

            });

        }


        // KIEM TRA TRANG THAI

        const allowedStatuses = [

            "pending",

            "confirmed",

            "failed"

        ];

        if (
            status &&
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message: "Trạng thái giao dịch không hợp lệ"

            });

        }


        // KIEM TRA PHAN TRANG

        if (

            !isValidId(page) ||

            page > 1000000 ||

            !isValidId(limit) ||

            limit > 100

        ) {

            return res.status(400).json({

                success: false,

                message: "Tham số phân trang không hợp lệ"

            });

        }


        // KIEM TRA DON VI

        if (

            organizationId !== null &&

            !isValidId(organizationId)

        ) {

            return res.status(400).json({

                success: false,

                message: "ID đơn vị không hợp lệ"

            });

        }


        // GOI SERVICE

        const result =
            await transactionService.getAllTransactions(

                req.user,

                {

                    search,

                    action,

                    status,

                    organizationId,

                    page,

                    limit

                }

            );


        // TRA VE KET QUA

        return res.status(200).json({

            success: true,

            message: "Lấy danh sách giao dịch thành công",

            data: result.transactions,

            pagination: result.pagination

        });

    } catch (error) {

        return handleError(res, error);

    }

}


// ================================================
// 4. THONG KE GIAO DICH
// ================================================

async function getStatistics(req, res) {

    try {

        const statistics =

            await transactionService
                .getTransactionStatistics(req.user);


        return res.status(200).json({

            success: true,

            message: "Lấy thống kê giao dịch thành công",

            data: statistics

        });

    } catch (error) {

        return handleError(res, error);

    }

}


// ================================================
// 5. LAY CHI TIET GIAO DICH
// ================================================

async function getTransactionById(req, res) {

    try {

        const type = req.params.type;

        const id = Number(req.params.id);


        // KIEM TRA NHOM GIAO DICH

        if (

            !["document", "organization"]
                .includes(type)

        ) {

            return res.status(400).json({

                success: false,

                message: "Nhóm giao dịch không hợp lệ"

            });

        }


        // KIEM TRA ID

        if (!isValidId(id)) {

            return res.status(400).json({

                success: false,

                message: "ID giao dịch không hợp lệ"

            });

        }


        const transaction =

            await transactionService.getTransactionById(

                type,

                id,

                req.user

            );


        return res.status(200).json({

            success: true,

            message: "Lấy chi tiết giao dịch thành công",

            data: transaction

        });

    } catch (error) {

        return handleError(res, error);

    }

}


// ================================================
// 6. EXPORT MODULE
// ================================================

module.exports = {

    getAllTransactions,

    getStatistics,

    getTransactionById

};