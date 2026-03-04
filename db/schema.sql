-- Memory Repository System - Schema
-- Run against: mysql.ligecom.com.br | database: ligecom20

CREATE TABLE IF NOT EXISTS `memory_projects` (
  `id`          CHAR(36)     NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `slug`        VARCHAR(100) NOT NULL,
  `api_key`     CHAR(64)     NOT NULL,
  `description` TEXT         NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_slug`    (`slug`),
  UNIQUE KEY `uq_api_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `memories` (
  `id`         CHAR(36)                             NOT NULL,
  `project_id` CHAR(36)                             NOT NULL,
  `type`       ENUM('text','kv','message','vector') NOT NULL,
  `key_name`   VARCHAR(255)                         NULL     COMMENT 'chave para tipo kv',
  `content`    TEXT                                 NOT NULL,
  `tags`       JSON                                 NULL     COMMENT 'array de strings: ["tag1","tag2"]',
  `metadata`   JSON                                 NULL     COMMENT 'role para message, source para vector, etc.',
  `embedding`  LONGTEXT                             NULL     COMMENT 'float array JSON do OpenAI text-embedding-3-small',
  `created_at` DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME                             NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_memories_project`
    FOREIGN KEY (`project_id`) REFERENCES `memory_projects` (`id`) ON DELETE CASCADE,
  INDEX `idx_project_type` (`project_id`, `type`),
  INDEX `idx_project_key`  (`project_id`, `key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
