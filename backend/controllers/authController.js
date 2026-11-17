
const authService = require("../services/authService");


// ==========================================
// 1. DANG NHAP HE THONG
// POST /api/auth/login
// ==========================================

async function login(req, res) {

    try {

        // Lay du lieu tu Client

        const email = req.body?.email;
        const password = req.body?.password;


        // Kiem tra du lieu dau vao

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "Vui long nhap email va mat khau"
            });

        }


        // Chuan hoa email

        const normalizedEmail =
            email.trim().toLowerCase();


        // Kiem tra dinh dang email

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailRegex.test(normalizedEmail) ||
            normalizedEmail.length > 150
        ) {

            return res.status(400).json({
                success: false,
                message: "Email khong hop le"
            });

        }


        // Kiem tra gioi han mat khau cua bcrypt

        if (Buffer.byteLength(password, "utf8") > 72) {

            return res.status(400).json({
                success: false,
                message: "Mat khau qua dai"
            });

        }


        // Goi Service xu ly dang nhap

        const result = await authService.login(
            normalizedEmail,
            password
        );


        // Tra ve ket qua dang nhap

        return res.status(200).json({

            success: true,

            message: "Dang nhap thanh cong",

            data: result

        });


    } catch (error) {

        // Ghi nhan loi tren Server

        console.error("Auth Controller Error:", {
    name: error.name,
    code: error.code,
    message: error.message
});


        // Xac dinh ma trang thai HTTP

        const statusCode =
            [400, 401, 403].includes(error.statusCode)
                ? error.statusCode
                : 500;


        // Tra ve thong bao loi

        return res.status(statusCode).json({

            success: false,

            message: statusCode === 500
                ? "Loi he thong dang nhap"
                : error.message

        });

    }

}


// ==========================================
// 2. LAY THONG TIN NGUOI DUNG DANG NHAP
// GET /api/auth/me
// ==========================================

function getMe(req, res) {

    // Kiem tra nguoi dung da duoc xac thuc

    if (!req.user) {

        return res.status(401).json({

            success: false,

            message: "Ban chua dang nhap"

        });

    }


    // Tra ve thong tin nguoi dung

    return res.status(200).json({

        success: true,

        message: "Lay thong tin nguoi dung thanh cong",

        data: req.user

    });

}


// ==========================================
// 3. EXPORT MODULE
// ==========================================

module.exports = {
    login,
    getMe
};
