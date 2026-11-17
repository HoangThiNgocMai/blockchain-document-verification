
// ==========================================
// MIDDLEWARE PHAN QUYEN NGUOI DUNG
// ==========================================

function authorizeRoles(...allowedRoles) {

    return (req, res, next) => {


        // 1. KIEM TRA DANG NHAP

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message: "Ban chua dang nhap"

            });

        }


        // 2. KIEM TRA VAI TRO

        if (!allowedRoles.includes(req.user.role)) {

            return res.status(403).json({

                success: false,

                message:
                    "Ban khong co quyen thuc hien chuc nang nay"

            });

        }


        // 3. CHO PHEP TRUY CAP

        return next();

    };

}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    authorizeRoles
};
