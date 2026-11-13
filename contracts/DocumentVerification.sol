
 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DocumentVerification {

    address public admin;

    // Danh sách địa chỉ được cấp quyền phát hành
    mapping(address => bool) public authorizedIssuers;

    // Thông tin tài liệu
    struct Document {
        bytes32 fileHash;
        address issuer;
        uint256 issuedAt;
        bool exists;
        bool revoked;
    }

    // Mã tài liệu => thông tin tài liệu
    mapping(string => Document) private documents;

    // Sự kiện
    event IssuerAuthorized(address indexed issuer);
    event IssuerRemoved(address indexed issuer);

    event DocumentIssued(
        string documentId,
        bytes32 fileHash,
        address indexed issuer
    );

    event DocumentRevoked(string documentId);

    // Chỉ quản trị viên
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    // Chỉ tổ chức được cấp quyền
    modifier onlyIssuer() {
        require(
            authorizedIssuers[msg.sender],
            "Not authorized"
        );
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedIssuers[msg.sender] = true;
    }

    // Cấp quyền phát hành
    function authorizeIssuer(
        address issuer
    ) external onlyAdmin {
        require(issuer != address(0), "Invalid issuer");
        authorizedIssuers[issuer] = true;

        emit IssuerAuthorized(issuer);
    }

    // Thu hồi quyền phát hành
    function removeIssuer(
        address issuer
    ) external onlyAdmin {
        require(issuer != admin, "Cannot remove admin");

        authorizedIssuers[issuer] = false;

        emit IssuerRemoved(issuer);
    }

    // Cấp phát tài liệu
    function issueDocument(
        string calldata documentId,
        bytes32 fileHash
    ) external onlyIssuer {
        require(bytes(documentId).length > 0, "Empty ID");
        require(fileHash != bytes32(0), "Empty hash");
        require(!documents[documentId].exists, "ID exists");

        documents[documentId] = Document({
            fileHash: fileHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            exists: true,
            revoked: false
        });

        emit DocumentIssued(
            documentId,
            fileHash,
            msg.sender
        );
    }

    // Thu hồi tài liệu
    function revokeDocument(
        string calldata documentId
    ) external {
        Document storage doc = documents[documentId];

        require(doc.exists, "Not found");
        require(!doc.revoked, "Already revoked");

        require(
            msg.sender == admin ||
            msg.sender == doc.issuer,
            "Not permitted"
        );

        doc.revoked = true;

        emit DocumentRevoked(documentId);
    }

    // Xác thực tài liệu
    function verifyDocument(
        string calldata documentId,
        bytes32 fileHash
    ) external view returns (bool) {
        Document memory doc = documents[documentId];

        return (
            doc.exists &&
            !doc.revoked &&
            authorizedIssuers[doc.issuer] &&
            doc.fileHash == fileHash
        );
    }

    // Xem thông tin tài liệu
    function getDocument(
        string calldata documentId
    ) external view returns (
        bytes32 fileHash,
        address issuer,
        uint256 issuedAt,
        bool exists,
        bool revoked
    ) {
        Document memory doc = documents[documentId];

        return (
            doc.fileHash,
            doc.issuer,
            doc.issuedAt,
            doc.exists,
            doc.revoked
        );
    }
}
