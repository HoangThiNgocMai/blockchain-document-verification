
const documentService = require(
    "../services/documentService"
);

async function issueDocument(req, res) {

    try {

        // 1. Kiem tra Body
        if (!req.body) {

            return res.status(400).json({
                success: false,
                message: "Body khong hop le. Hay su dung form-data"
            });
        }

        // 2. Lay thong tin tai lieu
        const title = String(
            req.body.title || ""
        ).trim();

        const documentType = String(
            req.body.documentType || ""
        ).trim();

        // 3. Kiem tra tieu de
        if (!title || title.length > 255) {

            return res.status(400).json({
                success: false,
                message: "Tieu de khong hop le"
            });
        }

        // 4. Kiem tra loai tai lieu
        if (documentType.length > 100) {

            return res.status(400).json({
                success: false,
                message: "Loai tai lieu qua dai"
            });
        }

        // 5. Kiem tra file upload
        if (!req.file || req.file.size === 0) {

            return res.status(400).json({
                success: false,
                message: "Vui long chon file tai lieu hop le"
            });
        }

        // 6. Goi Service cap phat tai lieu
        const result =
            await documentService.issueDocument(
                {
                    title,
                    documentType: documentType || null
                },
                req.file,
                req.issuer
            );

        // 7. Giao dich that bai
        if (result.status === "failed") {

            return res.status(502).json({
                success: false,
                message: "Cap phat tai lieu that bai",
                data: result
            });
        }

        // 8. Giao dich dang cho
        if (result.status === "pending") {

            return res.status(202).json({
                success: false,
                message: "Giao dich can duoc kiem tra lai",
                data: result
            });
        }

        // 9. Cap phat thanh cong
        return res.status(201).json({
            success: true,
            message: "Cap phat tai lieu thanh cong",
            data: result
        });

    } catch (error) {

        console.error(
            "Document Controller:",
            error.code || error.name
        );

        return res.status(500).json({
            success: false,
            message: "Loi cap phat tai lieu"
        });
    }
}

module.exports = {
    issueDocument
};

