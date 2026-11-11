
CREATE TABLE organizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42) UNIQUE,
    is_authorized BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'issuer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
);

CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    file_hash CHAR(64) NOT NULL,
    file_path VARCHAR(500),
    organization_id INT NOT NULL,
    issued_by INT NOT NULL,
    blockchain_tx VARCHAR(66),
    status ENUM(
        'pending',
        'issued',
        'revoked',
        'failed'
    ) DEFAULT 'pending',
    issued_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id)
        REFERENCES organizations(id),
    FOREIGN KEY (issued_by)
        REFERENCES users(id)
);

CREATE TABLE blockchain_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    action ENUM('issue', 'revoke') NOT NULL,
    block_number BIGINT NULL,
    status ENUM(
        'pending',
        'confirmed',
        'failed'
    ) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id)
        REFERENCES documents(id)
);

CREATE TABLE verification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NULL,
    searched_code VARCHAR(100),
    result ENUM(
        'valid',
        'mismatch',
        'revoked',
        'not_found',
        'lookup_only',
        'error'
    ) NOT NULL,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id)
        REFERENCES documents(id)
);
