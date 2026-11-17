
const documentQueryService = require(
    "../services/documentQueryService"
);

// ==========================================
// 1. HAM XU LY LOI
// ==========================================

function handleError(res, error) {

    console.error(
        "Document Query Error:",
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
            ? "Loi truy van tai lieu"
            : error.message

    });
}

// ==========================================
// 2. KIEM TRA ID
// ==========================================

function isValidId(id) {

    return (
        Number.isSafeInteger(id) &&
        id > 0
    );

}

// ==========================================
// 3. KIEM TRA THAM SO PHAN TRANG
// ==========================================

function getPagination(query) {

    const page =
        Number(query.page ?? 1);

    const limit =
        Number(query.limit ?? 10);

    if (
        !isValidId(page) ||
        page > 1000000 ||
        !isValidId(limit) ||
        limit > 100
    ) {

        const error = new Error(
            "Tham so phan trang khong hop le"
        );

        error.statusCode = 400;

        throw error;

    }

    return {
        page,
        limit
    };
}

// ==========================================
// 4. LAY DANH SACH TAI LIEU
// ==========================================

async function getAllDocuments(req, res) {

    try {

        const search =
            String(req.query.search ?? "").trim();

        const status =
            String(req.query.status ?? "").trim();

        const { page, limit } =
            getPagination(req.query);

        const organizationId =
            req.query.organizationId === undefined
                ? null
                : Number(req.query.organizationId);

        // Kiem tra tu khoa

        if (search.length > 255) {

            return res.status(400).json({

                success: false,

                message: "Tu khoa tim kiem qua dai"

            });

        }

        // Kiem tra trang thai

        const allowedStatuses = [
            "pending",
            "issued",
            "revoked",
            "failed"
        ];

        if (
            status &&
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message: "Trang thai tai lieu khong hop le"

            });

        }

        // Kiem tra ID to chuc

        if (
            organizationId !== null &&
            !isValidId(organizationId)
        ) {

            return res.status(400).json({

                success: false,

                message: "ID to chuc khong hop le"

            });

        }

        const result =
            await documentQueryService.getAllDocuments(

                req.user,

                {
                    search,
                    status,
                    organizationId,
                    page,
                    limit
                }

            );

        return res.status(200).json({

            success: true,

            message: "Lay danh sach tai lieu thanh cong",

            data: result.documents,

            pagination: result.pagination

        });

    } catch (error) {

        return handleError(res, error);

    }
}

// ==========================================
// 5. LAY CHI TIET TAI LIEU
// ==========================================

async function getDocumentById(req, res) {

    try {

        const id =
            Number(req.params.id);

        if (!isValidId(id)) {

            return res.status(400).json({

                success: false,

                message: "ID tai lieu khong hop le"

            });

        }

        const document =
            await documentQueryService.getDocumentById(
                id,
                req.user
            );

        return res.status(200).json({

            success: true,

            message: "Lay chi tiet tai lieu thanh cong",

            data: document

        });

    } catch (error) {

        return handleError(res, error);

    }
}

// ==========================================
// 6. LICH SU GIAO DICH BLOCKCHAIN
// ==========================================

async function getDocumentTransactions(req, res) {

    try {

        const id =
            Number(req.params.id);

        if (!isValidId(id)) {

            return res.status(400).json({

                success: false,

                message: "ID tai lieu khong hop le"

            });

        }

        const transactions =
            await documentQueryService
                .getDocumentTransactions(
                    id,
                    req.user
                );

        return res.status(200).json({

            success: true,

            message: "Lay lich su giao dich thanh cong",

            total: transactions.length,

            data: transactions

        });

    } catch (error) {

        return handleError(res, error);

    }
}

// ==========================================
// 7. LICH SU XAC THUC
// ==========================================

async function getDocumentVerifications(req, res) {

    try {

        const id =
            Number(req.params.id);

        if (!isValidId(id)) {

            return res.status(400).json({

                success: false,

                message: "ID tai lieu khong hop le"

            });

        }

        const { page, limit } =
            getPagination(req.query);

        const result =
            await documentQueryService
                .getDocumentVerifications(
                    id,
                    req.user,
                    page,
                    limit
                );

        return res.status(200).json({

            success: true,

            message: "Lay lich su xac thuc thanh cong",

            data: result.verifications,

            pagination: result.pagination

        });

    } catch (error) {

        return handleError(res, error);

    }
}

// ==========================================
// 8. EXPORT MODULE
// ==========================================

module.exports = {
    getAllDocuments,
    getDocumentById,
    getDocumentTransactions,
    getDocumentVerifications
};
