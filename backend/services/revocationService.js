
const db = require("../config/database");

const {
    provider,
    contract,
    issuerWallet,
    contractWithSigner
} = require("../config/blockchain");


// ==========================================
// HAM TAO LOI NGHIEP VU
// ==========================================

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}


// ==========================================
// THU HOI TAI LIEU
// ==========================================

async function revokeDocument(documentCode, issuer) {

    let txHash = null;
    let chainConfirmed = false;

    try {

        // ==================================
        // 1. KIEM TRA MANG BLOCKCHAIN
        // ==================================

        const network = await provider.getNetwork();

        if (network.chainId !== 11155111n) {
            throw new Error("Khong phai mang Sepolia");
        }


        // ==================================
        // 2. KIEM TRA NGUOI YEU CAU
        // ==================================

        if (!issuer || !issuer.id) {
            throw createError(
                "Nguoi dung khong co quyen",
                403
            );
        }


        // ==================================
        // 3. TIM TAI LIEU TRONG MYSQL
        // ==================================

        const [rows] = await db.execute(
            `SELECT
                d.id,
                d.document_code,
                d.title,
                d.status,
                d.issued_by,
                d.organization_id,
                o.wallet_address
            FROM documents d
            JOIN organizations o
                ON d.organization_id = o.id
            WHERE d.document_code = ?`,
            [documentCode]
        );

        if (rows.length === 0) {
            throw createError(
                "Khong tim thay tai lieu",
                404
            );
        }

        const document = rows[0];


        // ==================================
        // 4. KIEM TRA QUYEN THU HOI
        // ==================================

        if (
            Number(document.issued_by) !==
            Number(issuer.id)
        ) {
            throw createError(
                "Ban khong co quyen thu hoi tai lieu nay",
                403
            );
        }

        const walletAddress =
            await issuerWallet.getAddress();

        if (
            !document.wallet_address ||
            document.wallet_address.toLowerCase() !==
            walletAddress.toLowerCase()
        ) {
            throw createError(
                "Vi Blockchain khong trung khop",
                403
            );
        }


        // ==================================
        // 5. DOC DU LIEU BLOCKCHAIN
        // ==================================

        const blockchainDocument =
            await contract.getDocument(documentCode);

        const blockchainIssuer =
            blockchainDocument[1];

        const exists = blockchainDocument[3];

        const revoked = blockchainDocument[4];


        // ==================================
        // 6. KIEM TRA TRANG THAI
        // ==================================

        if (!exists) {
            throw createError(
                "Tai lieu khong ton tai tren Blockchain",
                404
            );
        }

        if (
            blockchainIssuer.toLowerCase() !==
            walletAddress.toLowerCase()
        ) {
            throw createError(
                "Vi nay khong phai Issuer goc",
                403
            );
        }

        if (revoked) {
            throw createError(
                "Tai lieu da bi thu hoi",
                409
            );
        }

        if (document.status !== "issued") {
            throw createError(
                "Trang thai tai lieu khong cho phep thu hoi",
                409
            );
        }


        // ==================================
        // 7. UOC TINH PHI GAS
        // ==================================

        const gasEstimate =
            await contractWithSigner
                .revokeDocument
                .estimateGas(documentCode);

        console.log(
            "Gas estimate:",
            gasEstimate.toString()
        );


        // ==================================
        // 8. GUI GIAO DICH LEN BLOCKCHAIN
        // ==================================

        const tx =
            await contractWithSigner
                .revokeDocument(documentCode);

        txHash = tx.hash;

        console.log(
            "Revoke Transaction:",
            txHash
        );


        // ==================================
        // 9. LUU GIAO DICH PENDING
        // ==================================

        await db.execute(
            `INSERT INTO blockchain_transactions
            (
                document_id,
                tx_hash,
                action,
                status
            )
            VALUES (?, ?, 'revoke', 'pending')`,
            [
                document.id,
                txHash
            ]
        );


        // ==================================
        // 10. CHO BLOCKCHAIN XAC NHAN
        // ==================================

        const receipt = await tx.wait(1);

        if (!receipt || receipt.status !== 1) {

            await db.execute(
                `UPDATE blockchain_transactions
                SET status = 'failed'
                WHERE tx_hash = ?
                AND action = 'revoke'`,
                [txHash]
            );

            throw new Error(
                "Giao dich thu hoi that bai"
            );
        }

        chainConfirmed = true;


        // ==================================
        // 11. CAP NHAT MYSQL
        // ==================================

        const connection = await db.getConnection();

        try {

            await connection.beginTransaction();

            await connection.execute(
                `UPDATE documents
                SET status = 'revoked'
                WHERE id = ?`,
                [document.id]
            );

            await connection.execute(
                `UPDATE blockchain_transactions
                SET
                    block_number = ?,
                    status = 'confirmed'
                WHERE tx_hash = ?
                AND action = 'revoke'`,
                [
                    receipt.blockNumber,
                    txHash
                ]
            );

            await connection.commit();

        } catch (databaseError) {

            await connection.rollback();

            throw databaseError;

        } finally {

            connection.release();

        }


        // ==================================
        // 12. TRA VE KET QUA
        // ==================================

        return {
            documentId: document.id,
            documentCode: document.document_code,
            title: document.title,
            status: "revoked",
            issuerAddress: walletAddress,
            transactionHash: txHash,
            blockNumber: receipt.blockNumber,
            explorerUrl:
                `https://sepolia.etherscan.io/tx/${txHash}`
        };

    } catch (error) {

        console.error(
            "Revocation Service:",
            error.code || error.message
        );

        if (txHash) {

            error.transactionHash = txHash;

            error.chainConfirmed = chainConfirmed;

            console.error(
                "Can kiem tra giao dich:",
                txHash
            );

        }

        throw error;

    }
}


// ==========================================
// EXPORT MODULE
// ==========================================

module.exports = {
    revokeDocument
};
