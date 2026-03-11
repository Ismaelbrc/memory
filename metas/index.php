<?php
require_once 'config.php';

$currentPage = 'dashboard';
$pageTitle   = 'Dashboard';

$pdo = getDB();
$mes = (int)($_GET['mes'] ?? date('n'));
$ano = (int)($_GET['ano'] ?? date('Y'));
if ($mes < 1 || $mes > 12) $mes = (int)date('n');
if ($ano < 2020 || $ano > 2050) $ano = (int)date('Y');

// KPIs
$kpiColabs = $pdo->query("SELECT COUNT(*) FROM metas_colaboradores WHERE ativo=1")->fetchColumn();
$kpiMetas  = $pdo->prepare("SELECT COUNT(*) FROM metas_metas WHERE mes=? AND ano=? AND status='ativa'");
$kpiMetas->execute([$mes, $ano]);
$kpiMetas  = $kpiMetas->fetchColumn();

$kpiAreas  = $pdo->query("SELECT COUNT(*) FROM metas_areas")->fetchColumn();

// Calcular atingimento por colaborador no mês
$stmtColab = $pdo->prepare("
  SELECT c.id, c.nome, c.cargo, c.bonus_maximo, c.area_id,
         a.nome AS area_nome, a.cor AS area_cor
  FROM metas_colaboradores c
  LEFT JOIN metas_areas a ON a.id = c.area_id
  WHERE c.ativo = 1
  ORDER BY c.nome
");
$stmtColab->execute();
$colaboradores = $stmtColab->fetchAll();

// Para cada colaborador, calcular atingimento médio ponderado
$ranking = [];
foreach ($colaboradores as $c) {
    $stmtDist = $pdo->prepare("
        SELECT d.id, d.valor_alvo_individual, d.peso_individual,
               m.tipo,
               (SELECT p.valor_realizado FROM metas_progresso p
                WHERE p.distribuicao_id = d.id
                ORDER BY p.registrado_em DESC LIMIT 1) AS ultimo_valor
        FROM metas_distribuicao d
        JOIN metas_metas m ON m.id = d.meta_id
        WHERE d.colaborador_id = ? AND m.mes = ? AND m.ano = ? AND m.status = 'ativa'
    ");
    $stmtDist->execute([$c['id'], $mes, $ano]);
    $atribuicoes = $stmtDist->fetchAll();

    $somaPesos = 0;
    $somaAtingimento = 0;
    foreach ($atribuicoes as $a) {
        $alvo = (float)$a['valor_alvo_individual'];
        $real = (float)($a['ultimo_valor'] ?? 0);
        $peso = (float)$a['peso_individual'];
        if ($alvo > 0) {
            $pct = min(100, ($real / $alvo) * 100);
        } elseif ($a['tipo'] === 'booleano') {
            $pct = $real > 0 ? 100 : 0;
        } else {
            $pct = 0;
        }
        $somaAtingimento += $pct * $peso;
        $somaPesos       += $peso;
    }
    $mediaAtingimento = $somaPesos > 0 ? $somaAtingimento / $somaPesos : 0;
    $bonusEstimado    = $c['bonus_maximo'] * ($mediaAtingimento / 100);

    $ranking[] = [
        'id'           => $c['id'],
        'nome'         => $c['nome'],
        'cargo'        => $c['cargo'],
        'area_nome'    => $c['area_nome'],
        'area_cor'     => $c['area_cor'],
        'bonus_maximo' => $c['bonus_maximo'],
        'atingimento'  => round($mediaAtingimento, 1),
        'bonus_est'    => round($bonusEstimado, 2),
        'num_metas'    => count($atribuicoes),
    ];
}

// Ordenar por atingimento desc
usort($ranking, fn($a, $b) => $b['atingimento'] <=> $a['atingimento']);

$mediaGeral = count($ranking) > 0
    ? round(array_sum(array_column($ranking, 'atingimento')) / count($ranking), 1)
    : 0;

// Progresso por área
$stmtAreas = $pdo->prepare("
    SELECT a.id, a.nome, a.cor, a.icone,
           COUNT(DISTINCT m.id) AS total_metas
    FROM metas_areas a
    LEFT JOIN metas_metas m ON m.area_id = a.id AND m.mes = ? AND m.ano = ? AND m.status = 'ativa'
    GROUP BY a.id
");
$stmtAreas->execute([$mes, $ano]);
$areas = $stmtAreas->fetchAll();

require '_header.php';
?>

<!-- Filtros -->
<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
  <div>
    <h4 class="mb-0 fw-bold"><i class="bi bi-speedometer2 text-primary me-2"></i>Dashboard</h4>
    <small class="text-secondary"><?= nomeMes($mes) ?> / <?= $ano ?></small>
  </div>
  <form class="d-flex gap-2 align-items-center">
    <select name="mes" class="form-select form-select-sm" style="width:120px">
      <?php for ($m = 1; $m <= 12; $m++): ?>
        <option value="<?= $m ?>" <?= $m === $mes ? 'selected' : '' ?>><?= nomeMes($m) ?></option>
      <?php endfor; ?>
    </select>
    <select name="ano" class="form-select form-select-sm" style="width:90px">
      <?php for ($y = date('Y') - 2; $y <= date('Y') + 1; $y++): ?>
        <option value="<?= $y ?>" <?= $y === $ano ? 'selected' : '' ?>><?= $y ?></option>
      <?php endfor; ?>
    </select>
    <button class="btn btn-sm btn-primary"><i class="bi bi-funnel"></i> Filtrar</button>
  </form>
</div>

<!-- KPI Cards -->
<div class="row g-3 mb-4">
  <div class="col-6 col-md-3">
    <div class="card stat-card">
      <div class="card-body text-center py-4">
        <i class="bi bi-people-fill text-primary fs-2 mb-2 d-block"></i>
        <div class="kpi-value text-primary"><?= $kpiColabs ?></div>
        <small class="text-secondary">Colaboradores Ativos</small>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="card stat-card">
      <div class="card-body text-center py-4">
        <i class="bi bi-bullseye text-warning fs-2 mb-2 d-block"></i>
        <div class="kpi-value text-warning"><?= $kpiMetas ?></div>
        <small class="text-secondary">Metas Ativas no Mês</small>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="card stat-card">
      <div class="card-body text-center py-4">
        <i class="bi bi-diagram-3-fill text-info fs-2 mb-2 d-block"></i>
        <div class="kpi-value text-info"><?= $kpiAreas ?></div>
        <small class="text-secondary">Áreas Cadastradas</small>
      </div>
    </div>
  </div>
  <div class="col-6 col-md-3">
    <div class="card stat-card">
      <div class="card-body text-center py-4">
        <i class="bi bi-graph-up-arrow fs-2 mb-2 d-block" style="color:<?= $mediaGeral >= 80 ? '#198754' : ($mediaGeral >= 50 ? '#ffc107' : '#dc3545') ?>"></i>
        <div class="kpi-value" style="color:<?= $mediaGeral >= 80 ? '#198754' : ($mediaGeral >= 50 ? '#ffc107' : '#dc3545') ?>"><?= $mediaGeral ?>%</div>
        <small class="text-secondary">Média de Atingimento</small>
      </div>
    </div>
  </div>
</div>

<div class="row g-4">
  <!-- Leaderboard -->
  <div class="col-lg-8">
    <div class="card h-100">
      <div class="card-header d-flex align-items-center justify-content-between">
        <h6 class="mb-0"><i class="bi bi-trophy-fill text-warning me-2"></i>Ranking de Colaboradores — <?= nomeMes($mes) ?>/<?= $ano ?></h6>
      </div>
      <div class="card-body p-0">
        <?php if (empty($ranking)): ?>
          <div class="text-center text-secondary py-5">
            <i class="bi bi-inbox fs-1 d-block mb-2"></i>
            Nenhum colaborador com metas neste período
          </div>
        <?php else: ?>
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead>
                <tr>
                  <th class="px-3" style="width:50px">#</th>
                  <th>Colaborador</th>
                  <th>Metas</th>
                  <th style="width:200px">Atingimento</th>
                  <th>Bônus Est.</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($ranking as $i => $r): ?>
                  <tr>
                    <td class="px-3">
                      <?php if ($i === 0): ?>
                        <span class="badge badge-rank-1 px-2">🥇 1º</span>
                      <?php elseif ($i === 1): ?>
                        <span class="badge badge-rank-2 px-2">🥈 2º</span>
                      <?php elseif ($i === 2): ?>
                        <span class="badge badge-rank-3 px-2">🥉 3º</span>
                      <?php else: ?>
                        <span class="text-secondary"><?= $i + 1 ?>º</span>
                      <?php endif; ?>
                    </td>
                    <td>
                      <div class="fw-semibold"><?= htmlspecialchars($r['nome']) ?></div>
                      <small class="text-secondary"><?= htmlspecialchars($r['cargo'] ?? '') ?></small>
                      <?php if ($r['area_nome']): ?>
                        <br><span class="badge" style="background:<?= htmlspecialchars($r['area_cor']) ?>22;color:<?= htmlspecialchars($r['area_cor']) ?>;border:1px solid <?= htmlspecialchars($r['area_cor']) ?>40;font-size:.7rem;">
                          <?= htmlspecialchars($r['area_nome']) ?>
                        </span>
                      <?php endif; ?>
                    </td>
                    <td><span class="badge bg-secondary"><?= $r['num_metas'] ?></span></td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="progress flex-grow-1" style="height:16px;">
                          <div class="progress-bar bg-<?= corProgresso($r['atingimento']) ?> progress-bar-striped progress-bar-animated"
                               style="width:<?= $r['atingimento'] ?>%">
                            <?= $r['atingimento'] ?>%
                          </div>
                        </div>
                      </div>
                      <div class="mt-1"><?= estrelasProgresso($r['atingimento']) ?></div>
                    </td>
                    <td>
                      <div class="fw-bold text-<?= corProgresso($r['atingimento']) ?>"><?= formatMoeda($r['bonus_est']) ?></div>
                      <small class="text-secondary">de <?= formatMoeda($r['bonus_maximo']) ?></small>
                    </td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </div>

  <!-- Progresso por Área -->
  <div class="col-lg-4">
    <div class="card h-100">
      <div class="card-header">
        <h6 class="mb-0"><i class="bi bi-diagram-3 text-info me-2"></i>Metas por Área</h6>
      </div>
      <div class="card-body">
        <?php if (empty($areas)): ?>
          <p class="text-secondary text-center">Nenhuma área cadastrada</p>
        <?php else: ?>
          <?php foreach ($areas as $a): ?>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span class="d-flex align-items-center gap-1">
                  <i class="bi <?= htmlspecialchars($a['icone']) ?>" style="color:<?= htmlspecialchars($a['cor']) ?>"></i>
                  <span class="fw-semibold" style="font-size:.85rem;"><?= htmlspecialchars($a['nome']) ?></span>
                </span>
                <span class="badge bg-secondary"><?= $a['total_metas'] ?> metas</span>
              </div>
              <!-- Calcular atingimento médio da área -->
              <?php
              $pctArea = 0;
              $membros = array_filter($ranking, fn($r) => $r['area_nome'] === $a['nome']);
              if (count($membros) > 0) {
                  $pctArea = round(array_sum(array_column($membros, 'atingimento')) / count($membros), 1);
              }
              ?>
              <div class="progress" style="height:12px">
                <div class="progress-bar bg-<?= corProgresso($pctArea) ?>"
                     style="width:<?= $pctArea ?>%; height:12px"
                     title="<?= $pctArea ?>%"></div>
              </div>
              <small class="text-secondary"><?= $pctArea ?>% atingimento médio</small>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>

        <div class="mt-4 pt-3 border-top border-secondary">
          <h6 class="text-secondary mb-3"><i class="bi bi-info-circle me-1"></i>Legenda</h6>
          <div class="d-flex flex-column gap-2">
            <div class="d-flex align-items-center gap-2">
              <div class="bg-success rounded" style="width:16px;height:8px"></div>
              <small>≥ 80% — Atingido / Superado</small>
            </div>
            <div class="d-flex align-items-center gap-2">
              <div class="bg-warning rounded" style="width:16px;height:8px"></div>
              <small>50–79% — Em andamento</small>
            </div>
            <div class="d-flex align-items-center gap-2">
              <div class="bg-danger rounded" style="width:16px;height:8px"></div>
              <small>&lt; 50% — Crítico</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<?php require '_footer.php'; ?>
