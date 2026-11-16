const QRCode = require("qrcode");

async function generateQRCode(documentCode) {

    const verifyUrl = new URL(
        process.env.PUBLIC_VERIFY_URL
        || "http://localhost:3000/verify"
    );

    verifyUrl.searchParams.set(
        "code",
        documentCode
    );

    const qrCode = await QRCode.toDataURL(
        verifyUrl.toString(),
        {
            width: 300,
            margin: 2,
            errorCorrectionLevel: "M"
        }
    );

    return {
        verifyUrl: verifyUrl.toString(),
        qrCode
    };
}

module.exports = {
    generateQRCode
};