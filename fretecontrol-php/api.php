<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

require_once 'config.php';

function jsonResponse(bool $success, string $message, array $data = []): void {
    echo json_encode(array_merge(['success' => $success, 'message' => $message], $data));
    exit;
}

// Read JSON body
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input || !isset($input['action'], $input['entity'])) {
    jsonResponse(false, 'Parâmetros inválidos.');
}

$action = trim($input['action']);
$entity = trim($input['entity']);

try {
    $pdo = getPDO();

    // ========================
    // TRANSPORTADORES
    // ========================
    if ($entity === 'transportadores') {
        if ($action === 'create') {
            $stmt = $pdo->prepare("INSERT INTO transportadores (nome, cpf_cnpj, tipo, telefone, email, antt, status) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([
                $input['nome'] ?? '',
                $input['cpf_cnpj'] ?? '',
                $input['tipo'] ?? 'PF',
                $input['telefone'] ?: null,
                $input['email'] ?: null,
                $input['antt'] ?: null,
                $input['status'] ?? 'ativo',
            ]);
            jsonResponse(true, 'Transportador criado com sucesso!', ['id' => $pdo->lastInsertId()]);
        }
        if ($action === 'update') {
            $stmt = $pdo->prepare("UPDATE transportadores SET nome=?, cpf_cnpj=?, tipo=?, telefone=?, email=?, antt=?, status=? WHERE id=?");
            $stmt->execute([
                $input['nome'] ?? '',
                $input['cpf_cnpj'] ?? '',
                $input['tipo'] ?? 'PF',
                $input['telefone'] ?: null,
                $input['email'] ?: null,
                $input['antt'] ?: null,
                $input['status'] ?? 'ativo',
                (int)($input['id'] ?? 0),
            ]);
            jsonResponse(true, 'Transportador atualizado com sucesso!');
        }
        if ($action === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM transportadores WHERE id=?");
            $stmt->execute([(int)($input['id'] ?? 0)]);
            jsonResponse(true, 'Transportador removido com sucesso!');
        }
    }

    // ========================
    // VEICULOS
    // ========================
    if ($entity === 'veiculos') {
        if ($action === 'create') {
            $stmt = $pdo->prepare("INSERT INTO veiculos (placa, tipo, marca, modelo, ano, transportador_id, status) VALUES (?,?,?,?,?,?,?)");
            $stmt->execute([
                strtoupper($input['placa'] ?? ''),
                $input['tipo'] ?? '',
                $input['marca'] ?: null,
                $input['modelo'] ?: null,
                $input['ano'] ? (int)$input['ano'] : null,
                $input['transportador_id'] ? (int)$input['transportador_id'] : null,
                $input['status'] ?? 'ativo',
            ]);
            jsonResponse(true, 'Veículo criado com sucesso!', ['id' => $pdo->lastInsertId()]);
        }
        if ($action === 'update') {
            $stmt = $pdo->prepare("UPDATE veiculos SET placa=?, tipo=?, marca=?, modelo=?, ano=?, transportador_id=?, status=? WHERE id=?");
            $stmt->execute([
                strtoupper($input['placa'] ?? ''),
                $input['tipo'] ?? '',
                $input['marca'] ?: null,
                $input['modelo'] ?: null,
                $input['ano'] ? (int)$input['ano'] : null,
                $input['transportador_id'] ? (int)$input['transportador_id'] : null,
                $input['status'] ?? 'ativo',
                (int)($input['id'] ?? 0),
            ]);
            jsonResponse(true, 'Veículo atualizado com sucesso!');
        }
        if ($action === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM veiculos WHERE id=?");
            $stmt->execute([(int)($input['id'] ?? 0)]);
            jsonResponse(true, 'Veículo removido com sucesso!');
        }
    }

    // ========================
    // CONTRATANTES
    // ========================
    if ($entity === 'contratantes') {
        if ($action === 'create') {
            $stmt = $pdo->prepare("INSERT INTO contratantes (nome, cpf_cnpj, tipo, telefone, email, status) VALUES (?,?,?,?,?,?)");
            $stmt->execute([
                $input['nome'] ?? '',
                $input['cpf_cnpj'] ?? '',
                $input['tipo'] ?? 'PJ',
                $input['telefone'] ?: null,
                $input['email'] ?: null,
                $input['status'] ?? 'ativo',
            ]);
            jsonResponse(true, 'Contratante criado com sucesso!', ['id' => $pdo->lastInsertId()]);
        }
        if ($action === 'update') {
            $stmt = $pdo->prepare("UPDATE contratantes SET nome=?, cpf_cnpj=?, tipo=?, telefone=?, email=?, status=? WHERE id=?");
            $stmt->execute([
                $input['nome'] ?? '',
                $input['cpf_cnpj'] ?? '',
                $input['tipo'] ?? 'PJ',
                $input['telefone'] ?: null,
                $input['email'] ?: null,
                $input['status'] ?? 'ativo',
                (int)($input['id'] ?? 0),
            ]);
            jsonResponse(true, 'Contratante atualizado com sucesso!');
        }
        if ($action === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM contratantes WHERE id=?");
            $stmt->execute([(int)($input['id'] ?? 0)]);
            jsonResponse(true, 'Contratante removido com sucesso!');
        }
    }

    // ========================
    // CIOTS
    // ========================
    if ($entity === 'ciots') {
        if ($action === 'create') {
            $stmt = $pdo->prepare("INSERT INTO ciots (numero, transportador_id, contratante_id, origem, destino, valor_frete, status, data_emissao, data_validade) VALUES (?,?,?,?,?,?,?,?,?)");
            $stmt->execute([
                $input['numero'] ?? '',
                (int)($input['transportador_id'] ?? 0),
                (int)($input['contratante_id'] ?? 0),
                $input['origem'] ?? '',
                $input['destino'] ?? '',
                (float)($input['valor_frete'] ?? 0),
                $input['status'] ?? 'pendente',
                $input['data_emissao'] ?? date('Y-m-d'),
                $input['data_validade'] ?: null,
            ]);
            jsonResponse(true, 'CIOT criado com sucesso!', ['id' => $pdo->lastInsertId()]);
        }
        if ($action === 'update') {
            $stmt = $pdo->prepare("UPDATE ciots SET numero=?, transportador_id=?, contratante_id=?, origem=?, destino=?, valor_frete=?, status=?, data_emissao=?, data_validade=? WHERE id=?");
            $stmt->execute([
                $input['numero'] ?? '',
                (int)($input['transportador_id'] ?? 0),
                (int)($input['contratante_id'] ?? 0),
                $input['origem'] ?? '',
                $input['destino'] ?? '',
                (float)($input['valor_frete'] ?? 0),
                $input['status'] ?? 'pendente',
                $input['data_emissao'] ?? date('Y-m-d'),
                $input['data_validade'] ?: null,
                (int)($input['id'] ?? 0),
            ]);
            jsonResponse(true, 'CIOT atualizado com sucesso!');
        }
        if ($action === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM ciots WHERE id=?");
            $stmt->execute([(int)($input['id'] ?? 0)]);
            jsonResponse(true, 'CIOT removido com sucesso!');
        }
    }

    // ========================
    // PEF LANCAMENTOS
    // ========================
    if ($entity === 'pef') {
        if ($action === 'create') {
            $stmt = $pdo->prepare("INSERT INTO pef_lancamentos (ciot_id, tipo, valor, data_lancamento, descricao) VALUES (?,?,?,?,?)");
            $stmt->execute([
                (int)($input['ciot_id'] ?? 0),
                $input['tipo'] ?? 'adiantamento',
                (float)($input['valor'] ?? 0),
                $input['data_lancamento'] ?? date('Y-m-d'),
                $input['descricao'] ?: null,
            ]);
            jsonResponse(true, 'Lançamento PEF criado com sucesso!', ['id' => $pdo->lastInsertId()]);
        }
        if ($action === 'update') {
            $stmt = $pdo->prepare("UPDATE pef_lancamentos SET ciot_id=?, tipo=?, valor=?, data_lancamento=?, descricao=? WHERE id=?");
            $stmt->execute([
                (int)($input['ciot_id'] ?? 0),
                $input['tipo'] ?? 'adiantamento',
                (float)($input['valor'] ?? 0),
                $input['data_lancamento'] ?? date('Y-m-d'),
                $input['descricao'] ?: null,
                (int)($input['id'] ?? 0),
            ]);
            jsonResponse(true, 'Lançamento PEF atualizado com sucesso!');
        }
        if ($action === 'delete') {
            $stmt = $pdo->prepare("DELETE FROM pef_lancamentos WHERE id=?");
            $stmt->execute([(int)($input['id'] ?? 0)]);
            jsonResponse(true, 'Lançamento PEF removido com sucesso!');
        }
    }

    jsonResponse(false, 'Entidade ou ação não reconhecida.');

} catch (PDOException $e) {
    jsonResponse(false, 'Erro de banco de dados: ' . $e->getMessage());
} catch (Throwable $e) {
    jsonResponse(false, 'Erro interno: ' . $e->getMessage());
}
