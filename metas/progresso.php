<?php
require_once 'config.php';

$currentPage = 'progresso';
$pageTitle   = 'Progresso';
$pdo = getDB();

$msg = '';
$msgType = 'success';

// POST — Registrar progresso
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'registrar') {
    $distId   = (int)($_POST['distribuicao_id'] ?? 0);
    $valor    = (float)($_POST['valor_realizado'] ?? 0);
    $obs      = trim($_POST['observacao'] ?? '');

    if ($distId <= 0) {
        $msg = 'Distribuição inválida.';
        $msgType = 'danger';
    } else {
        $stmt = $pdo->prepare("INSERT INTO metas_progresso (distribuicao_id, valor_realizado, observacao) VALUES (?, ?, ?)");
        $stmt->execute([$distId, $valor, $obs ?: null]);
        $msg = 'Progresso registrado com sucesso!';
    }
}

$mes           = (int)($_GET['mes'] ?? date('n'));
$ano           = (int)($_GET['ano'] ?? date('Y'));
$colaboradorId = (int)($_GET['colaborador_id'] ?? 0);

$colaboradores = $pdo->query("SELECT * FROM metas_colaboradores WHERE ativo=1 ORDER BY nome")->fetchAll();

// Buscar atribuições do colaborador selecionado
$atribuicoes = [];
if ($colaboradorId > 0) {
    $stmtAtrib = $pdo->prepare("
        SELECT d.id AS dist_id, d.valor_alvo_individual, d.peso_individual,
               m.titulo, m.tipo, m.valor_alvo, m.unidade,
               a.nome AS area_nome, a.cor AS area_cor, a.icone AS area_icone,
               c.bonus_maximo
        FROM metas_distribuicao d
        JOIN metas_metas m ON m.id = d.meta_id
        JOIN metas_areas a ON a.id = m.area_id
        JOIN metas_colaboradores c ON c.id = d.colaborador_id
        WHERE d.colaborador_id = ? AND m.mes = ? AND m.ano = ? AND m.status = 'ativa'
        ORDER BY m.peso DESC, m.titulo
    ");
    $stmtAtrib->execute([$colaboradorId, $mes, $ano]);
    $atribuicoes = $stmtAtrib->fetchAll();
}

require '_header.php';
?>

<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
  <div>
    <h4 class="mb-0 fw-bold"><i class="bi bi-bar-chart-line text-success me-2"></i>Progresso</h4>
    <small class="text-secondary">Registre e acompanhe o progresso individual</small>
  </div>
</div>

<?php if ($msg): ?>
  <div class="alert alert-<?= $msgType ?> alert-dismissible fade show">
    <?= htmlspecialchars($msg) ?>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>
<?php endif; ?>

<!-- Filtros -->
<div class="card mb-4">
  <div class="card-body py-2">
    <form class="d-flex gap-2 flex-wrap align-items-end">
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
      <div class="flex-grow-1">
        <label class="form-label fw-semibold mb-1 d-block" style="font-size:.8rem">Colaborador</label>
        <select name="colaborador_id" class="form-select">
          <option value="0">— Selecione o colaborador —</option>
          <?php foreach ($colaboradores as $c): ?>
            <option value="<?= $c['id'] ?>" <?= $c['id'] === $colaboradorId ? 'selected' : '' ?>>
              <?= htmlspecialchars($c['nome']) ?><?= $c['cargo'] ? ' — ' . htmlspecialchars($c['cargo']) : '' ?>
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      <button class="btn btn-primary"><i class="bi bi-funnel me-1"></i>Carregar</button>
    </form>
  </div>
</div>

<?php if ($colaboradorId > 0 && empty($atribuicoes)): ?>
  <div class="alert alert-warning">
    <i class="bi bi-exclamation-triangle me-2"></i>
    Nenhuma meta atribuída a este colaborador em <?= nomeMes($mes) ?>/<?= $ano ?>.
    <a href="distribuicao.php?mes=<?= $mes ?>&ano=<?= $ano ?>" class="alert-link">Distribuir metas</a>
  </div>
<?php endif; ?>

<?php if (!empty($atribuicoes)): ?>
  <!-- Resumo do colaborador -->
  <?php
  $somaPesos = 0;
  $somaAtingimento = 0;
  foreach ($atribuicoes as $at) {
      // Calcular progresso atual
      $stmtLast = $pdo->prepare("SELECT valor_realizado FROM metas_progresso WHERE distribuicao_id=? ORDER BY registrado_em DESC LIMIT 1");
      $stmtLast->execute([$at['dist_id']]);
      $ultimoValor = (float)($stmtLast->fetchColumn() ?? 0);
      $alvo = (float)$at['valor_alvo_individual'];
      $pctAt = ($alvo > 0) ? min(100, ($ultimoValor / $alvo) * 100) : ($at['tipo'] === 'booleano' && $ultimoValor > 0 ? 100 : 0);
      $somaAtingimento += $pctAt * (float)$at['peso_individual'];
      $somaPesos += (float)$at['peso_individual'];
  }
  $mediaGeral = $somaPesos > 0 ? $somaAtingimento / $somaPesos : 0;
  $bonusAtual = count($atribuicoes) > 0 ? $atribuicoes[0]['bonus_maximo'] * ($mediaGeral / 100) : 0;
  ?>
  <div class="row g-3 mb-4">
    <div class="col-md-4">
      <div class="card stat-card text-center py-3">
        <div class="kpi-value text-<?= corProgresso($mediaGeral) ?>"><?= round($mediaGeral, 1) ?>%</div>
        <small class="text-secondary">Atingimento Médio Ponderado</small>
        <div class="mt-1"><?= estrelasProgresso($mediaGeral) ?></div>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card stat-card text-center py-3">
        <div class="kpi-value text-success"><?= formatMoeda($bonusAtual) ?></div>
        <small class="text-secondary">Bônus Estimado</small>
        <small class="text-secondary d-block">de <?= formatMoeda($atribuicoes[0]['bonus_maximo']) ?></small>
      </div>
    </div>
    <div class="col-md-4">
      <div class="card stat-card text-center py-3">
        <div class="kpi-value text-info"><?= count($atribuicoes) ?></div>
        <small class="text-secondary">Metas Atribuídas</small>
        <small class="text-secondary d-block"><?= nomeMes($mes) ?>/<?= $ano ?></small>
      </div>
    </div>
  </div>

  <!-- Cards de Progresso por Meta -->
  <div class="row g-3">
    <?php foreach ($atribuicoes as $at): ?>
      <?php
      // Buscar último progresso e histórico
      $stmtLast = $pdo->prepare("SELECT valor_realizado FROM metas_progresso WHERE distribuicao_id=? ORDER BY registrado_em DESC LIMIT 1");
      $stmtLast->execute([$at['dist_id']]);
      $ultimoValor = (float)($stmtLast->fetchColumn() ?? 0);

      $stmtHist = $pdo->prepare("SELECT * FROM metas_progresso WHERE distribuicao_id=? ORDER BY registrado_em DESC LIMIT 5");
      $stmtHist->execute([$at['dist_id']]);
      $historico = $stmtHist->fetchAll();

      $alvo = (float)$at['valor_alvo_individual'];
      $pct = ($alvo > 0) ? min(100, ($ultimoValor / $alvo) * 100)
                         : ($at['tipo'] === 'booleano' && $ultimoValor > 0 ? 100 : 0);
      ?>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header d-flex align-items-center justify-content-between py-2">
            <div class="d-flex align-items-center gap-2">
              <i class="bi <?= htmlspecialchars($at['area_icone']) ?>" style="color:<?= htmlspecialchars($at['area_cor']) ?>"></i>
              <span class="fw-semibold" style="font-size:.9rem;"><?= htmlspecialchars($at['titulo']) ?></span>
            </div>
            <?= badgeProgresso($pct) ?>
          </div>
          <div class="card-body">
            <!-- Progresso -->
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <small class="text-secondary">Realizado: <strong class="text-<?= corProgresso($pct) ?>"><?= $at['tipo'] === 'booleano' ? ($ultimoValor > 0 ? 'Sim' : 'Não') : number_format($ultimoValor, 2, ',', '.') . ' ' . ($at['unidade'] ?? '') ?></strong></small>
                <small class="text-secondary">Alvo: <?= $at['tipo'] === 'booleano' ? 'Sim/Não' : number_format($alvo, 2, ',', '.') . ' ' . ($at['unidade'] ?? '') ?></small>
              </div>
              <div class="progress" style="height:20px">
                <div class="progress-bar bg-<?= corProgresso($pct) ?> progress-bar-striped"
                     style="width:<?= min(100, round($pct)) ?>%">
                  <?= round($pct, 1) ?>%
                </div>
              </div>
              <small class="text-secondary">Peso: <?= number_format($at['peso_individual'], 2) ?>x</small>
            </div>

            <!-- Formulário de atualização -->
            <form method="post" class="border-top border-secondary pt-3">
              <input type="hidden" name="action" value="registrar">
              <input type="hidden" name="distribuicao_id" value="<?= $at['dist_id'] ?>">
              <input type="hidden" name="colaborador_id" value="<?= $colaboradorId ?>">
              <input type="hidden" name="mes" value="<?= $mes ?>">
              <input type="hidden" name="ano" value="<?= $ano ?>">
              <div class="row g-2">
                <div class="col">
                  <?php if ($at['tipo'] === 'booleano'): ?>
                    <select name="valor_realizado" class="form-select form-select-sm">
                      <option value="0" <?= $ultimoValor == 0 ? 'selected' : '' ?>>Não atingido</option>
                      <option value="1" <?= $ultimoValor > 0 ? 'selected' : '' ?>>Atingido</option>
                    </select>
                  <?php else: ?>
                    <input type="number" name="valor_realizado" class="form-control form-control-sm"
                           placeholder="Novo valor..." step="0.01" min="0"
                           value="<?= $ultimoValor ?>">
                  <?php endif; ?>
                </div>
                <div class="col-auto">
                  <button type="submit" class="btn btn-sm btn-success">
                    <i class="bi bi-check-lg"></i> Atualizar
                  </button>
                </div>
              </div>
              <div class="mt-2">
                <input type="text" name="observacao" class="form-control form-control-sm"
                       placeholder="Observação (opcional)..." maxlength="200">
              </div>
            </form>

            <!-- Histórico -->
            <?php if (!empty($historico)): ?>
              <div class="mt-3">
                <small class="text-secondary fw-semibold d-block mb-1">Últimos registros:</small>
                <?php foreach ($historico as $h): ?>
                  <div class="d-flex justify-content-between align-items-center py-1 border-bottom border-secondary" style="font-size:.8rem">
                    <span class="text-<?= corProgresso(($alvo > 0 ? min(100, ($h['valor_realizado'] / $alvo) * 100) : 0)) ?>">
                      <?= $at['tipo'] === 'booleano' ? ($h['valor_realizado'] > 0 ? 'Atingido' : 'Não atingido') : number_format($h['valor_realizado'], 2, ',', '.') ?>
                    </span>
                    <?php if ($h['observacao']): ?>
                      <span class="text-secondary"><?= htmlspecialchars(mb_substr($h['observacao'], 0, 30)) ?></span>
                    <?php endif; ?>
                    <span class="text-secondary"><?= date('d/m H:i', strtotime($h['registrado_em'])) ?></span>
                  </div>
                <?php endforeach; ?>
              </div>
            <?php endif; ?>
          </div>
        </div>
      </div>
    <?php endforeach; ?>
  </div>

<?php elseif ($colaboradorId === 0): ?>
  <div class="text-center text-secondary py-5">
    <i class="bi bi-person-check fs-1 d-block mb-2"></i>
    Selecione um colaborador para visualizar e atualizar o progresso
  </div>
<?php endif; ?>

<?php require '_footer.php'; ?>
