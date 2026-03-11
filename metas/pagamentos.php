<?php
require_once 'config.php';

$currentPage = 'pagamentos';
$pageTitle   = 'Pagamentos';
$pdo = getDB();

$msg = '';
$msgType = 'success';

$mes = (int)($_GET['mes'] ?? date('n'));
$ano = (int)($_GET['ano'] ?? date('Y'));

// POST — Calcular pagamentos
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'calcular') {
    $mesPag = (int)($_POST['mes'] ?? $mes);
    $anoPag = (int)($_POST['ano'] ?? $ano);

    // Buscar todos os colaboradores ativos
    $colabs = $pdo->query("SELECT * FROM metas_colaboradores WHERE ativo=1")->fetchAll();
    $count = 0;

    foreach ($colabs as $c) {
        // Buscar atribuições com metas do mês
        $stmtAtrib = $pdo->prepare("
            SELECT d.id AS dist_id, d.valor_alvo_individual, d.peso_individual, m.tipo
            FROM metas_distribuicao d
            JOIN metas_metas m ON m.id = d.meta_id
            WHERE d.colaborador_id = ? AND m.mes = ? AND m.ano = ? AND m.status = 'ativa'
        ");
        $stmtAtrib->execute([$c['id'], $mesPag, $anoPag]);
        $atribuicoes = $stmtAtrib->fetchAll();

        if (empty($atribuicoes)) continue;

        $somaPesos = 0;
        $somaAtingimento = 0;

        foreach ($atribuicoes as $at) {
            $stmtLast = $pdo->prepare("SELECT valor_realizado FROM metas_progresso WHERE distribuicao_id=? ORDER BY registrado_em DESC LIMIT 1");
            $stmtLast->execute([$at['dist_id']]);
            $ultimoValor = (float)($stmtLast->fetchColumn() ?? 0);

            $alvo = (float)$at['valor_alvo_individual'];
            if ($at['tipo'] === 'booleano') {
                $pct = $ultimoValor > 0 ? 100 : 0;
            } elseif ($alvo > 0) {
                $pct = min(100, ($ultimoValor / $alvo) * 100);
            } else {
                $pct = 0;
            }

            $somaAtingimento += $pct * (float)$at['peso_individual'];
            $somaPesos += (float)$at['peso_individual'];
        }

        $mediaAtingimento = $somaPesos > 0 ? $somaAtingimento / $somaPesos : 0;
        $bonusCalculado   = $c['bonus_maximo'] * ($mediaAtingimento / 100);

        // Upsert pagamento
        $stmtPag = $pdo->prepare("
            INSERT INTO metas_pagamentos (colaborador_id, mes, ano, bonus_calculado, percentual_atingimento, status)
            VALUES (?, ?, ?, ?, ?, 'pendente')
            ON DUPLICATE KEY UPDATE
              bonus_calculado = VALUES(bonus_calculado),
              percentual_atingimento = VALUES(percentual_atingimento),
              status = IF(status='pago', 'pago', 'pendente')
        ");
        $stmtPag->execute([$c['id'], $mesPag, $anoPag, round($bonusCalculado, 2), round($mediaAtingimento, 2)]);
        $count++;
    }

    $msg = "Pagamentos calculados para $count colaborador(es)!";
    $mes = $mesPag;
    $ano = $anoPag;
}

// Atualizar status
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'status') {
    $pagId  = (int)($_POST['pag_id'] ?? 0);
    $status = in_array($_POST['status'] ?? '', ['pendente','aprovado','pago']) ? $_POST['status'] : null;
    if ($pagId > 0 && $status) {
        $pdo->prepare("UPDATE metas_pagamentos SET status=? WHERE id=?")->execute([$status, $pagId]);
        $msg = 'Status atualizado!';
    }
}

// Buscar pagamentos do período
$stmtPag = $pdo->prepare("
    SELECT p.*, c.nome AS colab_nome, c.cargo, c.bonus_maximo,
           a.nome AS area_nome, a.cor AS area_cor
    FROM metas_pagamentos p
    JOIN metas_colaboradores c ON c.id = p.colaborador_id
    LEFT JOIN metas_areas a ON a.id = c.area_id
    WHERE p.mes = ? AND p.ano = ?
    ORDER BY p.percentual_atingimento DESC
");
$stmtPag->execute([$mes, $ano]);
$pagamentos = $stmtPag->fetchAll();

$totalBonus = array_sum(array_column($pagamentos, 'bonus_calculado'));
$mediaAting = count($pagamentos) > 0
    ? array_sum(array_column($pagamentos, 'percentual_atingimento')) / count($pagamentos)
    : 0;

$statusColors = ['pendente' => 'warning', 'aprovado' => 'info', 'pago' => 'success'];
$statusIcons  = ['pendente' => 'bi-hourglass', 'aprovado' => 'bi-check-circle', 'pago' => 'bi-cash'];

require '_header.php';
?>

<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
  <div>
    <h4 class="mb-0 fw-bold"><i class="bi bi-cash-coin text-success me-2"></i>Pagamentos / Bônus</h4>
    <small class="text-secondary">Calcule e gerencie os bônus mensais</small>
  </div>
  <div class="d-flex gap-2">
    <button onclick="window.print()" class="btn btn-outline-secondary btn-sm">
      <i class="bi bi-printer me-1"></i>Imprimir
    </button>
  </div>
</div>

<?php if ($msg): ?>
  <div class="alert alert-<?= $msgType ?> alert-dismissible fade show">
    <?= htmlspecialchars($msg) ?>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>
<?php endif; ?>

<!-- Filtros + Calcular -->
<div class="card mb-4">
  <div class="card-body">
    <div class="d-flex gap-3 flex-wrap align-items-end">
      <form class="d-flex gap-2 align-items-end flex-grow-1" method="get">
        <div>
          <label class="form-label fw-semibold mb-1 d-block" style="font-size:.8rem">Período</label>
          <div class="d-flex gap-2">
            <select name="mes" class="form-select form-select-sm" style="width:130px">
              <?php for ($m = 1; $m <= 12; $m++): ?>
                <option value="<?= $m ?>" <?= $m === $mes ? 'selected' : '' ?>><?= nomeMes($m) ?></option>
              <?php endfor; ?>
            </select>
            <select name="ano" class="form-select form-select-sm" style="width:90px">
              <?php for ($y = date('Y') - 2; $y <= date('Y') + 1; $y++): ?>
                <option value="<?= $y ?>" <?= $y === $ano ? 'selected' : '' ?>><?= $y ?></option>
              <?php endfor; ?>
            </select>
          </div>
        </div>
        <button class="btn btn-outline-secondary btn-sm"><i class="bi bi-funnel me-1"></i>Filtrar</button>
      </form>

      <form method="post">
        <input type="hidden" name="action" value="calcular">
        <input type="hidden" name="mes" value="<?= $mes ?>">
        <input type="hidden" name="ano" value="<?= $ano ?>">
        <button type="submit" class="btn btn-primary"
                onclick="return confirm('Calcular/recalcular bônus de <?= nomeMes($mes) ?>/<?= $ano ?>?')">
          <i class="bi bi-calculator me-1"></i>Calcular Bônus
        </button>
      </form>
    </div>
  </div>
</div>

<!-- KPIs -->
<?php if (!empty($pagamentos)): ?>
<div class="row g-3 mb-4">
  <div class="col-md-3 col-6">
    <div class="card stat-card text-center py-3">
      <div class="kpi-value text-primary"><?= count($pagamentos) ?></div>
      <small class="text-secondary">Colaboradores</small>
    </div>
  </div>
  <div class="col-md-3 col-6">
    <div class="card stat-card text-center py-3">
      <div class="kpi-value text-<?= corProgresso($mediaAting) ?>"><?= round($mediaAting, 1) ?>%</div>
      <small class="text-secondary">Média Atingimento</small>
    </div>
  </div>
  <div class="col-md-3 col-6">
    <div class="card stat-card text-center py-3">
      <div class="kpi-value text-success"><?= formatMoeda($totalBonus) ?></div>
      <small class="text-secondary">Total de Bônus</small>
    </div>
  </div>
  <div class="col-md-3 col-6">
    <div class="card stat-card text-center py-3">
      <div class="kpi-value text-warning"><?= count(array_filter($pagamentos, fn($p) => $p['status'] === 'pendente')) ?></div>
      <small class="text-secondary">Pendentes</small>
    </div>
  </div>
</div>
<?php endif; ?>

<!-- Tabela -->
<div class="card">
  <div class="card-header">
    <h6 class="mb-0"><i class="bi bi-table me-2"></i>Bônus — <?= nomeMes($mes) ?>/<?= $ano ?></h6>
  </div>
  <div class="card-body p-0">
    <?php if (empty($pagamentos)): ?>
      <div class="text-center text-secondary py-5">
        <i class="bi bi-calculator fs-1 d-block mb-2"></i>
        Nenhum pagamento calculado para este período.
        <br><small>Clique em <strong>Calcular Bônus</strong> para gerar.</small>
      </div>
    <?php else: ?>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th class="px-3">#</th>
              <th>Colaborador</th>
              <th>Área</th>
              <th>Atingimento</th>
              <th>Bônus Máximo</th>
              <th>Bônus Calculado</th>
              <th>Status</th>
              <th class="text-end px-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($pagamentos as $i => $p): ?>
              <tr>
                <td class="px-3">
                  <?php if ($i === 0): ?>
                    <span class="badge badge-rank-1 px-2">🥇</span>
                  <?php elseif ($i === 1): ?>
                    <span class="badge badge-rank-2 px-2">🥈</span>
                  <?php elseif ($i === 2): ?>
                    <span class="badge badge-rank-3 px-2">🥉</span>
                  <?php else: ?>
                    <span class="text-secondary"><?= $i + 1 ?></span>
                  <?php endif; ?>
                </td>
                <td>
                  <div class="fw-semibold"><?= htmlspecialchars($p['colab_nome']) ?></div>
                  <?php if ($p['cargo']): ?><small class="text-secondary"><?= htmlspecialchars($p['cargo']) ?></small><?php endif; ?>
                </td>
                <td>
                  <?php if ($p['area_nome']): ?>
                    <span class="badge area-badge" style="background:<?= htmlspecialchars($p['area_cor']) ?>22;color:<?= htmlspecialchars($p['area_cor']) ?>;border:1px solid <?= htmlspecialchars($p['area_cor']) ?>40">
                      <?= htmlspecialchars($p['area_nome']) ?>
                    </span>
                  <?php endif; ?>
                </td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <div class="progress" style="width:80px;height:12px">
                      <div class="progress-bar bg-<?= corProgresso($p['percentual_atingimento']) ?>"
                           style="width:<?= min(100, $p['percentual_atingimento']) ?>%"></div>
                    </div>
                    <span class="fw-bold text-<?= corProgresso($p['percentual_atingimento']) ?>"><?= number_format($p['percentual_atingimento'], 1) ?>%</span>
                  </div>
                  <?= estrelasProgresso($p['percentual_atingimento']) ?>
                </td>
                <td><span class="text-secondary"><?= formatMoeda($p['bonus_maximo']) ?></span></td>
                <td>
                  <span class="fw-bold fs-6 text-<?= corProgresso($p['percentual_atingimento']) ?>">
                    <?= formatMoeda($p['bonus_calculado']) ?>
                  </span>
                </td>
                <td>
                  <span class="badge bg-<?= $statusColors[$p['status']] ?> text-dark">
                    <i class="bi <?= $statusIcons[$p['status']] ?> me-1"></i><?= ucfirst($p['status']) ?>
                  </span>
                </td>
                <td class="text-end px-3">
                  <div class="d-flex justify-content-end gap-1">
                    <?php if ($p['status'] === 'pendente'): ?>
                      <form method="post" class="d-inline">
                        <input type="hidden" name="action" value="status">
                        <input type="hidden" name="pag_id" value="<?= $p['id'] ?>">
                        <input type="hidden" name="status" value="aprovado">
                        <input type="hidden" name="mes" value="<?= $mes ?>">
                        <input type="hidden" name="ano" value="<?= $ano ?>">
                        <button type="submit" class="btn btn-sm btn-outline-info" title="Aprovar"><i class="bi bi-check-circle"></i></button>
                      </form>
                    <?php endif; ?>
                    <?php if ($p['status'] === 'aprovado'): ?>
                      <form method="post" class="d-inline">
                        <input type="hidden" name="action" value="status">
                        <input type="hidden" name="pag_id" value="<?= $p['id'] ?>">
                        <input type="hidden" name="status" value="pago">
                        <input type="hidden" name="mes" value="<?= $mes ?>">
                        <input type="hidden" name="ano" value="<?= $ano ?>">
                        <button type="submit" class="btn btn-sm btn-outline-success" title="Marcar como pago"><i class="bi bi-cash"></i></button>
                      </form>
                    <?php endif; ?>
                    <?php if ($p['status'] !== 'pago'): ?>
                      <form method="post" class="d-inline">
                        <input type="hidden" name="action" value="status">
                        <input type="hidden" name="pag_id" value="<?= $p['id'] ?>">
                        <input type="hidden" name="status" value="pendente">
                        <input type="hidden" name="mes" value="<?= $mes ?>">
                        <input type="hidden" name="ano" value="<?= $ano ?>">
                        <button type="submit" class="btn btn-sm btn-outline-secondary" title="Resetar para pendente"><i class="bi bi-arrow-counterclockwise"></i></button>
                      </form>
                    <?php endif; ?>
                  </div>
                </td>
              </tr>
            <?php endforeach; ?>
          </tbody>
          <tfoot class="table-secondary">
            <tr>
              <td colspan="5" class="px-3 text-end fw-bold">Total de Bônus:</td>
              <td class="fw-bold text-success fs-6"><?= formatMoeda($totalBonus) ?></td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    <?php endif; ?>
  </div>
</div>

<style>
@media print {
  .sidebar, .btn, form, .alert { display: none !important; }
  .main-content { padding: 0 !important; }
  body { background: white !important; color: black !important; }
  .card { background: white !important; border: 1px solid #ccc !important; }
  .table { color: black !important; }
}
</style>

<?php require '_footer.php'; ?>
