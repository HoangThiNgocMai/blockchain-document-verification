const { ethers } = require("ethers");

const {
    provider,
    contract,
    issuerWallet
} = require("./config/blockchain");

async function main() {

    console.log("===== KIEM TRA ISSUER =====");

    // Lay thong tin mang
    const network = await provider.getNetwork();

    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());

    if (network.chainId !== 11155111n) {
        throw new Error("Khong phai mang Sepolia");
    }

    // Kiem tra dia chi vi
    const issuerAddress = issuerWallet.address;

    console.log("Issuer:", issuerAddress);

    const expectedAddress =
        "0xC2798ABCF5C4F3d7FcfAe6485aBcb2edBF3ec328";

    if (
        issuerAddress.toLowerCase() !==
        expectedAddress.toLowerCase()
    ) {
        throw new Error("Private Key khong dung vi Issuer");
    }

    // Kiem tra so du
    const balance = await provider.getBalance(
        issuerAddress
    );

    console.log(
        "So du:",
        ethers.formatEther(balance),
        "Sepolia ETH"
    );

    // Kiem tra dia chi Smart Contract
    const contractAddress = await contract.getAddress();

    console.log("Contract:", contractAddress);

    const code = await provider.getCode(contractAddress);

    if (code === "0x") {
        throw new Error("Khong tim thay Smart Contract");
    }

    // Kiem tra quyen phat hanh
    const authorized = await contract.authorizedIssuers(
        issuerAddress
    );

    console.log("Quyen phat hanh:", authorized);

    if (!authorized) {
        throw new Error("Issuer chua duoc cap quyen");
    }

    if (balance === 0n) {
        throw new Error("Vi Issuer chua co Sepolia ETH");
    }

    console.log("============================");
    console.log("KIEM TRA ISSUER THANH CONG!");
    console.log("Vi Issuer da duoc cap quyen va co so du.");
}

main().catch((error) => {
    console.error(
        "Loi:",
        error.code || error.message
    );

    process.exitCode = 1;
});