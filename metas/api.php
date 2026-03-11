<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$pdo = getDB();

function jsonSuccess(array $data = []): never {
    echo json_encode(array_merge(['success' => true], $data));
    exit;
}

function jsonError(string $msg, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $msg]);
    exit;
}

try {
    switch ($action) {

        // ---- DELETE ÁREA ----
        case 'delete_area':
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) jsonError('ID inválido');
            $pdo->prepare("DELETE FROM metas_areas WHERE id=?")->execute([$id]);
            jsonSuccess();

        // ---- DELETE COLABORADOR ----
        case 'delete_colaborador':
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) jsonError('ID inválido');
            $pdo->prepare("DELETE FROM metas_colaboradores WHERE id=?")->execute([$id]);
            jsonSuccess();

        // ---- DELETE META ----
        case 'delete_meta':
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) jsonError('ID inválido');
            $pdo->prepare("DELETE FROM metas_metas WHERE id=?")->execute([$id]);
            jsonSuccess();

        // ---- DELETE DISTRIBUIÇÃO ----
        case 'delete_distribuicao':
            $id = (int)($_GET['id'] ?? 0);
            if ($id <= 0) jsonError('ID inválido');
            $pdo->prepare("DELETE FROM metas_distribuicao WHERE id=?")->execute([$id]);
            jsonSuccess();

        // ---- EDITAR DISTRIBUIÇÃO ----
        case 'edit_distribuicao':
            $id    = (int)($_POST['id'] ?? 0);
            $alvo  = (float)($_POST['valor_alvo_individual'] ?? 0);
            $peso  = max(0.01, (float)($_POST['peso_individual'] ?? 1));
            if ($id <= 0) jsonError('ID inválido');
            $pdo->prepare("UPDATE metas_distribuicao SET valor_alvo_individual=?, peso_individual=? WHERE id=?")
                ->execute([$alvo, $peso, $id]);
            jsonSuccess();

        // ---- TOGGLE ATIVO COLABORADOR ----
        case 'toggle_ativo':
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) jsonError('ID inválido');
            $pdo->prepare("UPDATE metas_colaboradores SET ativo = 1 - ativo WHERE id=?")->execute([$id]);
            $ativo = $pdo->prepare("SELECT ativo FROM metas_colaboradores WHERE id=?");
            $ativo->execute([$id]);
            jsonSuccess(['ativo' => (int)$ativo->fetchColumn()]);

        // ---- CALCULAR PAGAMENTOS (AJAX) ----
        case 'calcular_pagamentos':
            $mes = (int)($_POST['mes'] ?? date('n'));
            $ano = (int)($_POST['ano'] ?? date('Y'));

            $colabs = $pdo->query("SELECT * FROM metas_colaboradores WHERE ativo=1")->fetchAll();
            $count = 0;

            foreach ($colabs as $c) {
                $stmtAtrib = $pdo->prepare("
                    SELECT d.id AS dist_id, d.valor_alvo_individual, d.peso_individual, m.tipo
                    FROM metas_distribuicao d
                    JOIN metas_metas m ON m.id = d.meta_id
                    WHERE d.colaborador_id = ? AND m.mes = ? AND m.ano = ? AND m.status = 'ativa'
                ");
                $stmtAtrib->execute([$c['id'], $mes, $ano]);
                $atribuicoes = $stmtAtrib->fetchAll();

                if (empty($atribuicoes)) continue;

                $somaPesos = $somaAtingimento = 0;
                foreach ($atribuicoes as $at) {
                    $stmtLast = $pdo->prepare("SELECT valor_realizado FROM metas_progresso WHERE distribuicao_id=? ORDER BY registrado_em DESC LIMIT 1");
                    $stmtLast->execute([$at['dist_id']]);
                    $ultimoValor = (float)($stmtLast->fetchColumn() ?? 0);
                    $alvo = (float)$at['valor_alvo_individual'];

                    $pct = $at['tipo'] === 'booleano'
                        ? ($ultimoValor > 0 ? 100 : 0)
                        : ($alvo > 0 ? min(100, ($ultimoValor / $alvo) * 100) : 0);

                    $somaAtingimento += $pct * (float)$at['peso_individual'];
                    $somaPesos += (float)$at['peso_individual'];
                }

                $media  = $somaPesos > 0 ? $somaAtingimento / $somaPesos : 0;
                $bonus  = $c['bonus_maximo'] * ($media / 100);

                $pdo->prepare("
                    INSERT INTO metas_pagamentos (colaborador_id, mes, ano, bonus_calculado, percentual_atingimento, status)
                    VALUES (?, ?, ?, ?, ?, 'pendente')
                    ON DUPLICATE KEY UPDATE
                      bonus_calculado = VALUES(bonus_calculado),
                      percentual_atingimento = VALUES(percentual_atingimento),
                      status = IF(status='pago', 'pago', 'pendente')
                ")->execute([$c['id'], $mes, $ano, round($bonus, 2), round($media, 2)]);
                $count++;
            }
            jsonSuccess(['count' => $count]);

        default:
            jsonError('Ação desconhecida: ' . htmlspecialchars($action), 404);
    }
} catch (PDOException $e) {
    jsonError('Erro de banco de dados: ' . $e->getMessage(), 500);
}
