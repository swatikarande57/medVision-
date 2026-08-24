-- MedVision AI — MySQL initialization (runs once on first container start)
-- Charset/collation for international patient names

CREATE DATABASE IF NOT EXISTS medvision
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE medvision;

-- Placeholder schema version table; Flyway migrations will manage schema in backend Phase 1
CREATE TABLE IF NOT EXISTS schema_version (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    version     VARCHAR(32) NOT NULL,
    description VARCHAR(255) NOT NULL,
    applied_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version, description)
SELECT '0.0.0', 'Initial monorepo bootstrap'
WHERE NOT EXISTS (SELECT 1 FROM schema_version WHERE version = '0.0.0');
