
const crypto = require("crypto");

const db = require("../config/database");

const {
    provider,
    contract,
    issuerWallet,
    contractWithSigner
} = require("../config/blockchain");

const {
    generateFileHash
} = require("../utils/hash");

const {
    generateQRCode
} = require("../utils/qrcode");

async function issueDocument(data, file, issuer) {

    const { title, documentType } = data;

    // 1. Kiem tra mang Sepolia
    const network = await provider.getNetwork();

    if (network.chainId !== 11155111n) {
        throw new Error("Khong phai mang Sepolia");
    }

    // 2. Kiem tra dia chi vi Issuer
    if (
        !issuer.wallet_address ||
        issuer.wallet_address.toLowerCase() !==
        issuerWallet.address.toLowerCase()
    ) {
        throw new Error("Vi Issuer khong khop");
    }

    // 3. Kiem tra quyen tren Smart Contract
    const authorized =
        await contract.authorizedIssuers(
            issuerWallet.address
        );

    if (!authorized) {
        throw new Error("Issuer chua duoc cap quyen");
    }

    // 4. Tao ma tai lieu duy nhat
    const documentCode =
        "DOC-" + crypto.randomUUID();

    // 5. Tao ma bam SHA-256
    const fileHash = generateFileHash(file.buffer);

    // Chuyen sang bytes32 cho Blockchain
    const blockchainHash = "0x" + fileHash;

    // 6. Uoc tinh phi gas
    await contractWithSigner.issueDocument.estimateGas(
        documentCode,
        blockchainHash
    );

    // 7. Tao ma QR
    const qrData = await generateQRCode(
        documentCode
    );

    // 8. Luu tai lieu vao MySQL
    const [result] = await db.execute(
        `INSERT INTO documents (
            document_code,
            title,
            document_type,
            file_hash,
            file_path,
            organization_id,
            issued_by,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
            documentCode,
            title,
            documentType || null,
            fileHash,
            null,
            issuer.organization_id,
            issuer.id
        ]
    );

    const documentId = result.insertId;

    let tx;
    let receipt;

    try {

        // 9. Gui giao dich len Blockchain
        tx = await contractWithSigner.issueDocument(
            documentCode,
            blockchainHash
        );

        console.log("Transaction:", tx.hash);

        // 10. Luu ma giao dich vao MySQL
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            await connection.execute(
                `UPDATE documents
                 SET blockchain_tx = ?
                 WHERE id = ?`,
                [tx.hash, documentId]
            );

            await connection.execute(
                `INSERT INTO blockchain_transactions (
                    document_id,
                    tx_hash,
                    action,
                    status
                ) VALUES (?, ?, 'issue', 'pending')`,
                [documentId, tx.hash]
            );

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            throw error;

        } finally {
            connection.release();
        }

        // 11. Cho Blockchain xac nhan
        receipt = await tx.wait(1, 120000);

        if (!receipt || receipt.status !== 1) {
            throw new Error(
                "Giao dich chua duoc xac nhan"
            );
        }

        // 12. Cap nhat trang thai trong MySQL
        const updateConnection =
            await db.getConnection();

        try {

            await updateConnection.beginTransaction();

            await updateConnection.execute(
                `UPDATE documents
                 SET status = 'issued',
                     issued_at = NOW()
                 WHERE id = ?`,
                [documentId]
            );

            await updateConnection.execute(
                `UPDATE blockchain_transactions
                 SET status = 'confirmed',
                     block_number = ?
                 WHERE tx_hash = ?`,
                [receipt.blockNumber, tx.hash]
            );

            await updateConnection.commit();

        } catch (error) {

            await updateConnection.rollback();
            throw error;

        } finally {
            updateConnection.release();
        }

        // 13. Tra ket qua cap phat
        return {
            documentId,
            documentCode,
            title,
            documentType,
            fileHash,

            issuerAddress: issuerWallet.address,

            transactionHash: tx.hash,

            blockNumber: receipt.blockNumber,

            status: "issued",

            explorerUrl:
                "https://sepolia.etherscan.io/tx/"
                + tx.hash,

            verifyUrl: qrData.verifyUrl,

            qrCode: qrData.qrCode
        };

    } catch (error) {

        console.error(
            "Issue error:",
            error.code || error.message
        );

        const failedReceipt =
            receipt || error.receipt;

        const confirmedFailure =
            failedReceipt?.status === 0;

        const rejectedBeforeSend =
            !tx && (
                error.code === "ACTION_REJECTED" ||
                error.code === "INSUFFICIENT_FUNDS"
            );

        const failed =
            confirmedFailure || rejectedBeforeSend;

        try {

            if (failed) {

                await db.execute(
                    `UPDATE documents
                     SET status = 'failed'
                     WHERE id = ?`,
                    [documentId]
                );

                if (tx) {

                    await db.execute(
                        `UPDATE blockchain_transactions
                         SET status = 'failed'
                         WHERE tx_hash = ?`,
                        [tx.hash]
                    );
                }
            }

        } catch (dbError) {

            console.error(
                "Database update error:",
                dbError.code
            );
        }

        return {
            documentId,
            documentCode,
            fileHash,
            transactionHash: tx?.hash || null,
            status: failed ? "failed" : "pending"
        };
    }
}

module.exports = {
    issueDocument
};
