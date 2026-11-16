
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
        (document_id, searched_code, result)
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

async function verifyDocument(documentCode, file = null) {

    let documentId = null;

    try {

        // Kiem tra mang Blockchain
        const network = await provider.getNetwork();

        if (network.chainId !== 11155111n) {
            throw new Error("Khong phai mang Sepolia");
        }


        // ==================================
        // 3. TIM TAI LIEU TRONG MYSQL
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
        // 4. DOC DU LIEU TU BLOCKCHAIN
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
        // 5. TAI LIEU KHONG TON TAI
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
                message: "Tai lieu khong ton tai tren Blockchain",
                documentCode
            };
        }


        // ==================================
        // 6. THONG TIN TAI LIEU
        // ==================================

        const documentInfo = {
            documentCode,
            title: document?.title || null,
            documentType: document?.document_type || null,
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
        // 7. KIEM TRA TAI LIEU BI THU HOI
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
                message: "Tai lieu da bi thu hoi",
                data: documentInfo
            };
        }


        // ==================================
        // 8. TRA CUU KHONG TAI FILE
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
                message: "Tai lieu da duoc dang ky. Can tai file len de xac thuc noi dung",
                data: documentInfo
            };
        }


        // ==================================
        // 9. TAO MA BAM FILE TAI LEN
        // ==================================

        const uploadedHash =
            generateFileHash(file.buffer)
                .toLowerCase();


        // ==================================
        // 10. SO SANH HAI MA BAM
        // ==================================

        const hashMatch =
    uploadedHash === blockchainHash;

        const isValid =
    await contract.verifyDocument(
        documentCode,
        `0x${uploadedHash}`
    );

        const result = isValid
            ? "valid"
            : "mismatch";


        // ==================================
        // 11. LUU LICH SU XAC THUC
        // ==================================

        await saveVerificationLog(
            documentId,
            documentCode,
            result
        );


        // ==================================
        // 12. TRA VE KET QUA
        // ==================================

        return {
            valid: isValid,
            result,

            message: isValid
                ? "Tai lieu hop le va toan ven"
                : "Noi dung tai lieu khong trung khop",

            data: {
                ...documentInfo,
                uploadedHash,
                hashMatch: isValid
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
// 13. EXPORT MODULE
// ==========================================

module.exports = {
    verifyDocument
};
