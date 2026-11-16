
const multer = require("multer");

// 1. Danh sach dinh dang tai lieu duoc phep
const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png"
];

// 2. Cau hinh upload tai lieu
const upload = multer({

    // Luu tai lieu tam thoi trong RAM
    storage: multer.memoryStorage(),

    // Gioi han dung luong va so luong file
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 1
    },

    // 3. Kiem tra dinh dang tai lieu
    fileFilter: function (req, file, cb) {

        if (allowedTypes.includes(file.mimetype)) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Dinh dang tai lieu khong duoc ho tro"
                )
            );
        }
    }
});

// 4. Xuat module
module.exports = upload;
