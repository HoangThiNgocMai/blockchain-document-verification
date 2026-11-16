
require("dotenv").config();

const {
    provider,
    contract,
    issuerWallet,
    contractWithSigner
} = require("./config/blockchain");


async function testRevocation() {

    try {

        const documentCode = process.argv[2];

        if (!documentCode) {
            console.log(
                "Su dung: node test-revocation.js DOC-..."
            );
            return;
        }

        console.log("================================");
        console.log("KIEM TRA QUYEN THU HOI TAI LIEU");
        console.log("================================");

        const network = await provider.getNetwork();

        console.log(
            "Network:",
            network.name
        );

        if (network.chainId !== 11155111n) {
            throw new Error("Khong phai mang Sepolia");
        }

        const walletAddress =
            await issuerWallet.getAddress();

        console.log("Wallet:", walletAddress);

        const document =
            await contract.getDocument(documentCode);

        console.log("Document Code:", documentCode);

        console.log("File Hash:", document[0]);

        console.log("Document Issuer:", document[1]);

        console.log("Exists:", document[3]);

        console.log("Revoked:", document[4]);

        if (!document[3]) {
            console.log("Tai lieu khong ton tai");
            return;
        }

        if (document[4]) {
            console.log("Tai lieu da bi thu hoi");
            return;
        }

        const isOwner =
            walletAddress.toLowerCase() ===
            document[1].toLowerCase();

        console.log("Is Original Issuer:", isOwner);

        if (!isOwner) {
            console.log("Khong phai Issuer goc");
            return;
        }

        // Mo phong giao dich, khong ghi Blockchain
        await contractWithSigner
            .revokeDocument
            .staticCall(documentCode);

        const gasEstimate =
            await contractWithSigner
                .revokeDocument
                .estimateGas(documentCode);

        console.log(
            "Gas Estimate:",
            gasEstimate.toString()
        );

        console.log("================================");
        console.log("CO THE THU HOI TREN BLOCKCHAIN");
        console.log("CHUA GUI GIAO DICH THUC TE");
        console.log("================================");

    } catch (error) {

        console.error(
            "Test Error:",
            error.shortMessage || error.message
        );

        process.exitCode = 1;

    }
}

testRevocation();
