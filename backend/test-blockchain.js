
const {
    provider,
    contract
} = require("./config/blockchain");

async function testBlockchain() {
    try {
        // Kiểm tra mạng Blockchain
        const network = await provider.getNetwork();

        console.log("===== BLOCKCHAIN =====");

        console.log(
            "Network:",
            network.name
        );

        console.log(
            "Chain ID:",
            network.chainId.toString()
        );

        if (network.chainId !== 11155111n) {
            throw new Error("Khong phai mang Sepolia");
        }

        // Kiểm tra block hiện tại
        const blockNumber =
            await provider.getBlockNumber();

        console.log("Block:", blockNumber);

        // Kiểm tra địa chỉ hợp đồng
        const address =
            await contract.getAddress();

        const code =
            await provider.getCode(address);

        if (code === "0x") {
            throw new Error(
                "Khong tim thay Smart Contract"
            );
        }

        console.log("Contract:", address);

        // Đọc địa chỉ quản trị viên
        const admin = await contract.admin();

        console.log("Admin:", admin);

        console.log(
            "Ket noi Blockchain thanh cong!"
        );

    } catch (error) {
        console.error(
            "Loi ket noi:",
            error.message
        );

        process.exitCode = 1;
    }
}

testBlockchain();
