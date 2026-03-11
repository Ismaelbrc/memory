-- ============================================================
-- Sistema de Metas — Schema SQL Completo
-- Banco: ligecom20 | Host: mysql.ligecom.com.br
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Áreas / Departamentos
CREATE TABLE IF NOT EXISTS `metas_areas` (
  `id`          INT          NOT NULL AUTO_INCREMENT,
  `nome`        VARCHAR(100) NOT NULL,
  `descricao`   TEXT,
  `cor`         VARCHAR(7)   NOT NULL DEFAULT '#0d6efd',
  `icone`       VARCHAR(50)  NOT NULL DEFAULT 'bi-briefcase',
  `criado_em`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Colaboradores
CREATE TABLE IF NOT EXISTS `metas_colaboradores` (
  `id`           INT           NOT NULL AUTO_INCREMENT,
  `nome`         VARCHAR(100)  NOT NULL,
  `cargo`        VARCHAR(100),
  `area_id`      INT,
  `bonus_maximo` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `email`        VARCHAR(150),
  `ativo`        TINYINT(1)    NOT NULL DEFAULT 1,
  `criado_em`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_colab_area`
    FOREIGN KEY (`area_id`) REFERENCES `metas_areas` (`id`) ON DELETE SET NULL,
  INDEX `idx_area` (`area_id`),
  INDEX `idx_ativo` (`ativo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Metas mensais por área
CREATE TABLE IF NOT EXISTS `metas_metas` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `area_id`     INT           NOT NULL,
  `titulo`      VARCHAR(200)  NOT NULL,
  `descricao`   TEXT,
  `tipo`        ENUM('numero','percentual','monetario','booleano') NOT NULL DEFAULT 'numero',
  `valor_alvo`  DECIMAL(15,2) NOT NULL,
  `unidade`     VARCHAR(50),
  `peso`        DECIMAL(5,2)  NOT NULL DEFAULT 1.00,
  `mes`         TINYINT       NOT NULL,
  `ano`         SMALLINT      NOT NULL,
  `status`      ENUM('ativa','concluida','cancelada') NOT NULL DEFAULT 'ativa',
  `criado_em`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_meta_area`
    FOREIGN KEY (`area_id`) REFERENCES `metas_areas` (`id`) ON DELETE CASCADE,
  INDEX `idx_mes_ano` (`mes`, `ano`),
  INDEX `idx_area_mes` (`area_id`, `mes`, `ano`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Atribuição de metas a colaboradores (distribuição)
CREATE TABLE IF NOT EXISTS `metas_distribuicao` (
  `id`                    INT           NOT NULL AUTO_INCREMENT,
  `meta_id`               INT           NOT NULL,
  `colaborador_id`        INT           NOT NULL,
  `valor_alvo_individual` DECIMAL(15,2),
  `peso_individual`       DECIMAL(5,2)  NOT NULL DEFAULT 1.00,
  `criado_em`             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_dist_meta`
    FOREIGN KEY (`meta_id`) REFERENCES `metas_metas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dist_colab`
    FOREIGN KEY (`colaborador_id`) REFERENCES `metas_colaboradores` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_meta_colab` (`meta_id`, `colaborador_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Registros de progresso
CREATE TABLE IF NOT EXISTS `metas_progresso` (
  `id`                 INT           NOT NULL AUTO_INCREMENT,
  `distribuicao_id`    INT           NOT NULL,
  `valor_realizado`    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `observacao`         TEXT,
  `registrado_em`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_prog_dist`
    FOREIGN KEY (`distribuicao_id`) REFERENCES `metas_distribuicao` (`id`) ON DELETE CASCADE,
  INDEX `idx_dist_data` (`distribuicao_id`, `registrado_em`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pagamentos / Bônus mensais calculados
CREATE TABLE IF NOT EXISTS `metas_pagamentos` (
  `id`                    INT           NOT NULL AUTO_INCREMENT,
  `colaborador_id`        INT           NOT NULL,
  `mes`                   TINYINT       NOT NULL,
  `ano`                   SMALLINT      NOT NULL,
  `bonus_calculado`       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `percentual_atingimento` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `observacao`            TEXT,
  `status`                ENUM('pendente','aprovado','pago') NOT NULL DEFAULT 'pendente',
  `criado_em`             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_pag_colab`
    FOREIGN KEY (`colaborador_id`) REFERENCES `metas_colaboradores` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_pagamento` (`colaborador_id`, `mes`, `ano`),
  INDEX `idx_mes_ano_pag` (`mes`, `ano`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Dados de exemplo para demonstração
-- ============================================================

INSERT IGNORE INTO `metas_areas` (`nome`, `descricao`, `cor`, `icone`) VALUES
  ('Vendas',           'Equipe comercial e inside sales', '#198754', 'bi-graph-up-arrow'),
  ('Marketing',        'Geração de demanda e branding',   '#0d6efd', 'bi-megaphone-fill'),
  ('Customer Success', 'Retenção e satisfação de clientes','#fd7e14', 'bi-heart-fill'),
  ('Tecnologia',       'Desenvolvimento e infraestrutura', '#6f42c1', 'bi-cpu-fill');
