const db = require("../config/database");

const {
    provider,
    contract
} = require("../config/blockchain");

const {
    generateFileHash
} = require("../utils/hash");


// ==========================================
// 1. LUU LICH SU XAC THUC
// ==========================================

async function saveVerificationLog(
    documentId,
    documentCode,
    result
) {

    await db.execute(
        `INSERT INTO verification_logs
        (
            document_id,
            searched_code,
            result
        )
        VALUES (?, ?, ?)`,
        [
            documentId || null,
            documentCode,
            result
        ]
    );
}


// ==========================================
// 2. XAC THUC TAI LIEU
// ==========================================

async function verifyDocument(
    documentCode,
    file = null
) {

    let documentId = null;

    try {

        // ==================================
        // 3. KIEM TRA MANG BLOCKCHAIN
        // ==================================

        const network = await provider.getNetwork();

        if (network.chainId !== 11155111n) {

            throw new Error(
                "Không phải mạng Sepolia."
            );
        }


        // ==================================
        // 4. TIM TAI LIEU TRONG MYSQL
        // ==================================

        const [rows] = await db.execute(
            `SELECT
                d.id,
                d.document_code,
                d.title,
                d.document_type,
                d.file_hash,
                d.blockchain_tx,
                d.status,
                d.issued_at,
                o.name AS organization_name,
                o.wallet_address
            FROM documents d
            JOIN organizations o
                ON d.organization_id = o.id
            WHERE d.document_code = ?`,
            [documentCode]
        );

        const document = rows[0] || null;

        if (document) {

            documentId = document.id;
        }


        // ==================================
        // 5. DOC DU LIEU TU BLOCKCHAIN
        // ==================================

        const blockchainDocument =
            await contract.getDocument(documentCode);

        const blockchainHash =
            blockchainDocument[0]
                .replace(/^0x/i, "")
                .toLowerCase();

        const issuerAddress =
            blockchainDocument[1];

        const issuedAt =
            blockchainDocument[2];

        const exists =
            blockchainDocument[3];

        const revoked =
            blockchainDocument[4];


        // ==================================
        // 6. TAI LIEU KHONG TON TAI
        // ==================================

        if (!exists) {

            await saveVerificationLog(
                documentId,
                documentCode,
                "not_found"
            );

            return {

                valid: false,

                result: "not_found",

                message:
                    "Tài liệu không tồn tại trên Blockchain.",

                documentCode
            };
        }


        // ==================================
        // 7. THONG TIN TAI LIEU
        // ==================================

        const documentInfo = {

            documentCode,

            title:
                document?.title || null,

            documentType:
                document?.document_type || null,

            organizationName:
                document?.organization_name || null,

            issuerAddress,

            issuedAt: new Date(
                Number(issuedAt) * 1000
            ).toISOString(),

            blockchainHash,

            transactionHash:
                document?.blockchain_tx || null,

            exists,

            revoked,

            databaseHashMatches: document

                ? document.file_hash.toLowerCase()
                    === blockchainHash

                : null
        };


        // ==================================
        // 8. KIEM TRA TAI LIEU BI THU HOI
        // ==================================

        if (revoked) {

            await saveVerificationLog(
                documentId,
                documentCode,
                "revoked"
            );

            return {

                valid: false,

                result: "revoked",

                message:
                    "Tài liệu đã bị thu hồi và không còn hiệu lực.",

                data: documentInfo
            };
        }


        // ==================================
        // 9. KIEM TRA QUYEN VI CAP PHAT
        // ==================================

        const issuerAuthorized =
            await contract.authorizedIssuers(
                issuerAddress
            );

        documentInfo.issuerAuthorized =
            issuerAuthorized;

        if (!issuerAuthorized) {

            await saveVerificationLog(
                documentId,
                documentCode,
                "unauthorized_issuer"
            );

            return {

                valid: false,

                result: "unauthorized_issuer",

                message:
                    "Ví cấp phát tài liệu hiện không được cấp quyền.",

                data: documentInfo
            };
        }


        // ==================================
        // 10. TRA CUU KHONG TAI FILE
        // ==================================

        if (!file) {

            await saveVerificationLog(
                documentId,
                documentCode,
                "lookup_only"
            );

            return {

                valid: null,

                result: "lookup_only",

                message:
                    "Tài liệu đã được đăng ký. Vui lòng tải file lên để xác thực nội dung.",

                data: documentInfo
            };
        }


        // ==================================
        // 11. TAO MA BAM FILE TAI LEN
        // ==================================

        const uploadedHash =
            generateFileHash(file.buffer)
                .toLowerCase();


        // ==================================
        // 12. SO SANH HAI MA BAM
        // ==================================

        const hashMatch =
            uploadedHash === blockchainHash;


        // ==================================
        // 13. XAC THUC BANG SMART CONTRACT
        // ==================================

        const isValid =
            await contract.verifyDocument(
                documentCode,
                `0x${uploadedHash}`
            );


        // ==================================
        // 14. XAC DINH KET QUA
        // ==================================

        let result;
        let message;

        if (isValid && hashMatch) {

            result = "valid";

            message =
                "Tài liệu hợp lệ và nội dung toàn vẹn.";

        } else if (!isValid && !hashMatch) {

            result = "mismatch";

            message =
                "Nội dung tài liệu không trùng khớp với dữ liệu Blockchain.";

        } else {

            result = "error";

            message =
                "Kết quả xác thực chưa nhất quán. Vui lòng thử lại.";
        }


        // ==================================
        // 15. LUU LICH SU XAC THUC
        // ==================================

        await saveVerificationLog(
            documentId,
            documentCode,
            result
        );


        // ==================================
        // 16. TRA VE KET QUA
        // ==================================

        return {

            valid: result === "error"
                ? null
                : result === "valid",

            result,

            message,

            data: {

                ...documentInfo,

                uploadedHash,

                hashMatch
            }
        };


    } catch (error) {

        console.error(
            "Verification Service:",
            error.code || error.name
        );

        try {

            await saveVerificationLog(
                documentId,
                documentCode,
                "error"
            );

        } catch (logError) {

            console.error(
                "Verification Log:",
                logError.code || logError.name
            );
        }

        throw error;
    }
}


// ==========================================
// 17. EXPORT MODULE
// ==========================================

module.exports = {
    verifyDocument
};