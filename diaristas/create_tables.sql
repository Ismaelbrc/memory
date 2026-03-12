-- ============================================================
--  Sistema de Solicitação de Diaristas
--  Execute este script UMA VEZ para criar a estrutura do banco.
-- ============================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ── 1. Solicitações (criadas pelo Supervisor) ─────────────────
CREATE TABLE IF NOT EXISTS `solicitacoes` (
    `id`               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    `supervisor_nome`  VARCHAR(100)    NOT NULL,
    `supervisor_email` VARCHAR(150)    NOT NULL,
    `local_servico`    VARCHAR(200)    NOT NULL,
    `data_servico`     DATE            NOT NULL,
    `horario_inicio`   TIME            NOT NULL,
    `horario_fim`      TIME            NOT NULL,
    `descricao`        TEXT            NULL,
    `status`           ENUM('pendente','aprovado','reprovado','concluido')
                                       NOT NULL DEFAULT 'pendente',
    `criado_em`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `atualizado_em`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_status`       (`status`),
    INDEX `idx_data_servico` (`data_servico`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ── 2. Aprovações (preenchidas pelo Gestor) ───────────────────
CREATE TABLE IF NOT EXISTS `aprovacoes` (
    `id`             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `solicitacao_id` INT UNSIGNED  NOT NULL,
    `gestor_nome`    VARCHAR(100)  NOT NULL,
    `gestor_email`   VARCHAR(150)  NOT NULL,
    `decisao`        ENUM('aprovado','reprovado') NOT NULL,
    `observacao`     TEXT          NULL,
    `criado_em`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_sol` (`solicitacao_id`),
    CONSTRAINT `fk_apr_sol`
        FOREIGN KEY (`solicitacao_id`)
        REFERENCES `solicitacoes` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ── 3. Diaristas (preenchidas pelo Fornecedor) ────────────────
CREATE TABLE IF NOT EXISTS `diaristas` (
    `id`               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    `solicitacao_id`   INT UNSIGNED  NOT NULL,
    `nome`             VARCHAR(150)  NOT NULL,
    `cpf`              CHAR(14)      NOT NULL,
    `foto`             VARCHAR(255)  NULL,
    `fornecedor_nome`  VARCHAR(100)  NOT NULL,
    `fornecedor_email` VARCHAR(150)  NULL,
    `criado_em`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY  `uk_sol`  (`solicitacao_id`),
    CONSTRAINT `fk_dia_sol`
        FOREIGN KEY (`solicitacao_id`)
        REFERENCES `solicitacoes` (`id`)
        ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
