
const dashboardService =
    require("../services/dashboardService");

// ==========================================
// 1. HAM XU LY LOI
// ==========================================

function handleError(res, error) {

    console.error("============================");
    console.error("DASHBOARD ERROR");
    console.error("Error Code:", error.code);
    console.error("Error Name:", error.name);
    console.error("Error Message:", error.message);
    console.error("SQL Message:", error.sqlMessage);
    console.error("Error Stack:", error.stack);
    console.error("============================");

    const statusCode =
        [400, 401, 403, 404].includes(error.statusCode)
            ? error.statusCode
            : 500;

    return res.status(statusCode).json({
        success: false,
        message: statusCode === 500
            ? "Loi thong ke he thong"
            : error.message
    });
}

// ==========================================
// 2. DASHBOARD ADMIN
// ==========================================

async function getAdminDashboard(req, res) {

    try {

        const result =
            await dashboardService
                .getAdminDashboard(req.user);

        return res.status(200).json({
            success: true,
            message: "Lay thong ke Admin thanh cong",
            data: result
        });

    } catch (error) {

        return handleError(res, error);

    }
}

// ==========================================
// 3. DASHBOARD ISSUER
// ==========================================

async function getIssuerDashboard(req, res) {

    try {

        const result =
            await dashboardService
                .getIssuerDashboard(req.user);

        return res.status(200).json({
            success: true,
            message: "Lay thong ke Issuer thanh cong",
            data: result
        });

    } catch (error) {

        return handleError(res, error);

    }
}

// ==========================================
// 4. EXPORT MODULE
// ==========================================

module.exports = {
    getAdminDashboard,
    getIssuerDashboard
};
