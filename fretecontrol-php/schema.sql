-- FreteControl Database Schema
-- Run this against ligecom20 database

CREATE TABLE IF NOT EXISTS `transportadores` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `nome` VARCHAR(255) NOT NULL,
    `cpf_cnpj` VARCHAR(20) NOT NULL,
    `tipo` ENUM('PF','PJ') NOT NULL DEFAULT 'PF',
    `telefone` VARCHAR(20) DEFAULT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `antt` VARCHAR(50) DEFAULT NULL,
    `status` ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `veiculos` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `placa` VARCHAR(10) NOT NULL,
    `tipo` VARCHAR(100) NOT NULL,
    `marca` VARCHAR(100) DEFAULT NULL,
    `modelo` VARCHAR(100) DEFAULT NULL,
    `ano` SMALLINT UNSIGNED DEFAULT NULL,
    `transportador_id` INT UNSIGNED DEFAULT NULL,
    `status` ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_veiculo_transportador` FOREIGN KEY (`transportador_id`) REFERENCES `transportadores`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contratantes` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `nome` VARCHAR(255) NOT NULL,
    `cpf_cnpj` VARCHAR(20) NOT NULL,
    `tipo` ENUM('PF','PJ') NOT NULL DEFAULT 'PJ',
    `telefone` VARCHAR(20) DEFAULT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `status` ENUM('ativo','inativo') NOT NULL DEFAULT 'ativo',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ciots` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `numero` VARCHAR(50) NOT NULL,
    `transportador_id` INT UNSIGNED NOT NULL,
    `contratante_id` INT UNSIGNED NOT NULL,
    `origem` VARCHAR(255) NOT NULL,
    `destino` VARCHAR(255) NOT NULL,
    `valor_frete` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('pendente','ativo','encerrado','cancelado') NOT NULL DEFAULT 'pendente',
    `data_emissao` DATE NOT NULL,
    `data_validade` DATE DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ciot_transportador` FOREIGN KEY (`transportador_id`) REFERENCES `transportadores`(`id`),
    CONSTRAINT `fk_ciot_contratante` FOREIGN KEY (`contratante_id`) REFERENCES `contratantes`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pef_lancamentos` (
    `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `ciot_id` INT UNSIGNED NOT NULL,
    `tipo` ENUM('adiantamento','saldo','pedagio','outros') NOT NULL DEFAULT 'adiantamento',
    `valor` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `data_lancamento` DATE NOT NULL,
    `descricao` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pef_ciot` FOREIGN KEY (`ciot_id`) REFERENCES `ciots`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
