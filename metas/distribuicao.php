<?php
require_once 'config.php';

$currentPage = 'distribuicao';
$pageTitle   = 'Distribuição de Metas';
$pdo = getDB();

$msg = '';
$msgType = 'success';

// POST — Salvar atribuição
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'add') {
        $metaId       = (int)($_POST['meta_id'] ?? 0);
        $colaboradorId = (int)($_POST['colaborador_id'] ?? 0);
        $alvoInd      = (float)($_POST['valor_alvo_individual'] ?? 0);
        $pesoInd      = max(0.01, (float)($_POST['peso_individual'] ?? 1));

        if ($metaId <= 0 || $colaboradorId <= 0) {
            $msg = 'Meta e colaborador são obrigatórios.';
            $msgType = 'danger';
        } else {
            try {
                $stmt = $pdo->prepare("
                    INSERT INTO metas_distribuicao (meta_id, colaborador_id, valor_alvo_individual, peso_individual)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE valor_alvo_individual=VALUES(valor_alvo_individual), peso_individual=VALUES(peso_individual)
                ");
                $stmt->execute([$metaId, $colaboradorId, $alvoInd, $pesoInd]);
                $msg = 'Colaborador atribuído com sucesso!';
            } catch (PDOException $e) {
                $msg = 'Erro ao atribuir: ' . $e->getMessage();
                $msgType = 'danger';
            }
        }
    }
}

// Meta selecionada
$metaId = (int)($_GET['meta_id'] ?? $_POST['meta_id'] ?? 0);

// Buscar todas as metas para o select
$mes = (int)($_GET['mes'] ?? date('n'));
$ano = (int)($_GET['ano'] ?? date('Y'));

$todasMetas = $pdo->prepare("
    SELECT m.*, a.nome AS area_nome, a.cor AS area_cor
    FROM metas_metas m
    JOIN metas_areas a ON a.id = m.area_id
    WHERE m.mes = ? AND m.ano = ?
    ORDER BY a.nome, m.titulo
");
$todasMetas->execute([$mes, $ano]);
$todasMetas = $todasMetas->fetchAll();

$metaAtual = null;
$atribuicoes = [];
$colaboradoresDisponiveis = [];

if ($metaId > 0) {
    $stmtMeta = $pdo->prepare("
        SELECT m.*, a.nome AS area_nome, a.cor AS area_cor, a.icone AS area_icone
        FROM metas_metas m
        JOIN metas_areas a ON a.id = m.area_id
        WHERE m.id = ?
    ");
    $stmtMeta->execute([$metaId]);
    $metaAtual = $stmtMeta->fetch();

    // Buscar atribuições existentes
    $stmtAtrib = $pdo->prepare("
        SELECT d.*, c.nome AS colab_nome, c.cargo, a.nome AS area_nome, a.cor AS area_cor,
               (SELECT p.valor_realizado FROM metas_progresso p WHERE p.distribuicao_id = d.id ORDER BY p.registrado_em DESC LIMIT 1) AS ultimo_progresso
        FROM metas_distribuicao d
        JOIN metas_colaboradores c ON c.id = d.colaborador_id
        LEFT JOIN metas_areas a ON a.id = c.area_id
        WHERE d.meta_id = ?
        ORDER BY c.nome
    ");
    $stmtAtrib->execute([$metaId]);
    $atribuicoes = $stmtAtrib->fetchAll();

    // IDs já atribuídos
    $idsAtribuidos = array_column($atribuicoes, 'colaborador_id');

    // Colaboradores ainda não atribuídos
    $stmtDisp = $pdo->prepare("
        SELECT c.*, a.nome AS area_nome, a.cor AS area_cor
        FROM metas_colaboradores c
        LEFT JOIN metas_areas a ON a.id = c.area_id
        WHERE c.ativo = 1" . ($idsAtribuidos ? " AND c.id NOT IN (" . implode(',', array_fill(0, count($idsAtribuidos), '?')) . ")" : "") . "
        ORDER BY c.nome
    ");
    $stmtDisp->execute($idsAtribuidos);
    $colaboradoresDisponiveis = $stmtDisp->fetchAll();
}

require '_header.php';
?>

<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
  <div>
    <h4 class="mb-0 fw-bold"><i class="bi bi-share text-info me-2"></i>Distribuição de Metas</h4>
    <small class="text-secondary">Atribua metas a colaboradores com alvos individuais</small>
  </div>
</div>

<?php if ($msg): ?>
  <div class="alert alert-<?= $msgType ?> alert-dismissible fade show">
    <?= htmlspecialchars($msg) ?>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>
<?php endif; ?>

<!-- Seletor de Meta -->
<div class="card mb-4">
  <div class="card-body">
    <form class="d-flex gap-2 flex-wrap align-items-end">
      <div>
        <label class="form-label fw-semibold mb-1">Período</label>
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
        <label class="form-label fw-semibold mb-1">Meta</label>
        <select name="meta_id" class="form-select">
          <option value="0">— Selecione uma meta —</option>
          <?php foreach ($todasMetas as $tm): ?>
            <option value="<?= $tm['id'] ?>" <?= $tm['id'] === $metaId ? 'selected' : '' ?>>
              [<?= htmlspecialchars($tm['area_nome']) ?>] <?= htmlspecialchars($tm['titulo']) ?> (peso: <?= $tm['peso'] ?>)
            </option>
          <?php endforeach; ?>
        </select>
      </div>
      <button class="btn btn-primary"><i class="bi bi-eye me-1"></i>Visualizar</button>
    </form>
  </div>
</div>

<?php if ($metaAtual): ?>
  <!-- Info da Meta -->
  <div class="card mb-4" style="border-left: 4px solid <?= htmlspecialchars($metaAtual['area_cor']) ?>">
    <div class="card-body">
      <div class="d-flex flex-wrap gap-3 align-items-start">
        <div class="flex-grow-1">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span class="badge area-badge" style="background:<?= htmlspecialchars($metaAtual['area_cor']) ?>22;color:<?= htmlspecialchars($metaAtual['area_cor']) ?>;border:1px solid <?= htmlspecialchars($metaAtual['area_cor']) ?>40">
              <i class="bi <?= htmlspecialchars($metaAtual['area_icone']) ?>"></i>
              <?= htmlspecialchars($metaAtual['area_nome']) ?>
            </span>
            <span class="badge bg-info text-dark">Peso: <?= $metaAtual['peso'] ?>x</span>
            <span class="badge bg-<?= $metaAtual['status'] === 'ativa' ? 'primary' : 'secondary' ?>"><?= ucfirst($metaAtual['status']) ?></span>
          </div>
          <h5 class="mb-1"><?= htmlspecialchars($metaAtual['titulo']) ?></h5>
          <?php if ($metaAtual['descricao']): ?>
            <p class="text-secondary mb-0" style="font-size:.875rem"><?= htmlspecialchars($metaAtual['descricao']) ?></p>
          <?php endif; ?>
        </div>
        <div class="text-end">
          <div class="fw-bold fs-5">
            <?php if ($metaAtual['tipo'] === 'booleano'): ?>
              Sim/Não
            <?php elseif ($metaAtual['tipo'] === 'monetario'): ?>
              <?= formatMoeda($metaAtual['valor_alvo']) ?>
            <?php else: ?>
              <?= number_format($metaAtual['valor_alvo'], 0, ',', '.') ?> <?= htmlspecialchars($metaAtual['unidade'] ?? '') ?>
            <?php endif; ?>
          </div>
          <small class="text-secondary">Alvo geral — <?= nomeMes($metaAtual['mes']) ?>/<?= $metaAtual['ano'] ?></small>
        </div>
      </div>
    </div>
  </div>

  <div class="row g-4">
    <!-- Atribuições existentes -->
    <div class="col-lg-8">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h6 class="mb-0"><i class="bi bi-people me-2"></i>Colaboradores Atribuídos (<?= count($atribuicoes) ?>)</h6>
        </div>
        <div class="card-body p-0">
          <?php if (empty($atribuicoes)): ?>
            <div class="text-center text-secondary py-4">
              <i class="bi bi-people fs-2 d-block mb-2"></i>
              Nenhum colaborador atribuído ainda.
            </div>
          <?php else: ?>
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th class="px-3">Colaborador</th>
                    <th>Alvo Individual</th>
                    <th>Peso</th>
                    <th>Último Progresso</th>
                    <th class="text-end px-3">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <?php foreach ($atribuicoes as $at): ?>
                    <?php
                    $progPct = 0;
                    if ($at['valor_alvo_individual'] > 0 && $at['ultimo_progresso'] !== null) {
                        $progPct = min(100, ($at['ultimo_progresso'] / $at['valor_alvo_individual']) * 100);
                    } elseif ($metaAtual['tipo'] === 'booleano' && $at['ultimo_progresso'] > 0) {
                        $progPct = 100;
                    }
                    ?>
                    <tr>
                      <td class="px-3">
                        <div class="fw-semibold"><?= htmlspecialchars($at['colab_nome']) ?></div>
                        <?php if ($at['cargo']): ?><small class="text-secondary"><?= htmlspecialchars($at['cargo']) ?></small><?php endif; ?>
                        <?php if ($at['area_nome']): ?>
                          <br><span class="badge" style="background:<?= htmlspecialchars($at['area_cor']) ?>22;color:<?= htmlspecialchars($at['area_cor']) ?>;border:1px solid <?= htmlspecialchars($at['area_cor']) ?>40;font-size:.7rem">
                            <?= htmlspecialchars($at['area_nome']) ?>
                          </span>
                        <?php endif; ?>
                      </td>
                      <td>
                        <?php if ($metaAtual['tipo'] === 'booleano'): ?>
                          <span class="text-secondary">Sim/Não</span>
                        <?php elseif ($metaAtual['tipo'] === 'monetario'): ?>
                          <?= formatMoeda($at['valor_alvo_individual']) ?>
                        <?php else: ?>
                          <?= number_format($at['valor_alvo_individual'], 0, ',', '.') ?> <?= htmlspecialchars($metaAtual['unidade'] ?? '') ?>
                        <?php endif; ?>
                      </td>
                      <td><span class="badge bg-info text-dark"><?= number_format($at['peso_individual'], 2) ?>x</span></td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="progress flex-grow-1" style="height:12px; min-width:80px">
                            <div class="progress-bar bg-<?= corProgresso($progPct) ?>"
                                 style="width:<?= round($progPct) ?>%"></div>
                          </div>
                          <small class="text-<?= corProgresso($progPct) ?> fw-bold"><?= round($progPct) ?>%</small>
                        </div>
                      </td>
                      <td class="text-end px-3">
                        <button class="btn btn-sm btn-outline-warning me-1"
                                onclick="editarAtrib(<?= $at['id'] ?>, <?= (float)$at['valor_alvo_individual'] ?>, <?= (float)$at['peso_individual'] ?>)"
                                title="Editar alvo">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger"
                                onclick="confirmDelete('api.php?action=delete_distribuicao&id=<?= $at['id'] ?>', 'Remover «<?= addslashes($at['colab_nome']) ?>» desta meta?')">
                          <i class="bi bi-x-lg"></i>
                        </button>
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

    <!-- Adicionar colaborador -->
    <div class="col-lg-4">
      <div class="card">
        <div class="card-header">
          <h6 class="mb-0"><i class="bi bi-person-plus me-2"></i>Adicionar Colaborador</h6>
        </div>
        <div class="card-body">
          <?php if (empty($colaboradoresDisponiveis)): ?>
            <p class="text-secondary text-center">Todos os colaboradores ativos já foram atribuídos.</p>
          <?php else: ?>
            <form method="post">
              <input type="hidden" name="action" value="add">
              <input type="hidden" name="meta_id" value="<?= $metaId ?>">
              <input type="hidden" name="mes" value="<?= $mes ?>">
              <input type="hidden" name="ano" value="<?= $ano ?>">
              <div class="mb-3">
                <label class="form-label fw-semibold">Colaborador</label>
                <select name="colaborador_id" class="form-select" required>
                  <option value="">Selecione...</option>
                  <?php foreach ($colaboradoresDisponiveis as $cd): ?>
                    <option value="<?= $cd['id'] ?>"><?= htmlspecialchars($cd['nome']) ?><?= $cd['area_nome'] ? ' (' . htmlspecialchars($cd['area_nome']) . ')' : '' ?></option>
                  <?php endforeach; ?>
                </select>
              </div>
              <?php if ($metaAtual['tipo'] !== 'booleano'): ?>
              <div class="mb-3">
                <label class="form-label fw-semibold">Alvo Individual
                  <?php if ($metaAtual['tipo'] === 'monetario'): ?>(R$)<?php elseif ($metaAtual['tipo'] === 'percentual'): ?>(%)<?php endif; ?>
                </label>
                <input type="number" name="valor_alvo_individual" class="form-control" placeholder="Alvo do colaborador" step="0.01" min="0" value="<?= $metaAtual['valor_alvo'] ?>">
              </div>
              <?php else: ?>
              <input type="hidden" name="valor_alvo_individual" value="1">
              <?php endif; ?>
              <div class="mb-3">
                <label class="form-label fw-semibold">Peso Individual <span class="text-info">ℹ</span></label>
                <input type="number" name="peso_individual" class="form-control" placeholder="1.00" step="0.01" min="0.01" value="1.00">
              </div>
              <button type="submit" class="btn btn-success w-100"><i class="bi bi-plus-lg me-1"></i>Atribuir</button>
            </form>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </div>

<?php elseif (!empty($todasMetas)): ?>
  <div class="text-center text-secondary py-5">
    <i class="bi bi-arrow-up-circle fs-1 d-block mb-2"></i>
    Selecione uma meta acima para gerenciar sua distribuição
  </div>
<?php else: ?>
  <div class="alert alert-warning">
    <i class="bi bi-exclamation-triangle me-2"></i>
    Nenhuma meta cadastrada para <?= nomeMes($mes) ?>/<?= $ano ?>.
    <a href="metas.php" class="alert-link">Criar metas</a>
  </div>
<?php endif; ?>

<!-- Modal editar atribuição -->
<div class="modal fade" id="modalEditAtrib" tabindex="-1">
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
      <form method="post" action="api.php" id="formEditAtrib">
        <input type="hidden" name="action" value="edit_distribuicao">
        <input type="hidden" name="id" id="eaId">
        <input type="hidden" name="meta_id" value="<?= $metaId ?>">
        <input type="hidden" name="mes" value="<?= $mes ?>">
        <input type="hidden" name="ano" value="<?= $ano ?>">
        <div class="modal-header">
          <h5 class="modal-title">Editar Alvo</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label fw-semibold">Alvo Individual</label>
            <input type="number" name="valor_alvo_individual" id="eaAlvo" class="form-control" step="0.01" min="0">
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Peso Individual</label>
            <input type="number" name="peso_individual" id="eaPeso" class="form-control" step="0.01" min="0.01">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-primary btn-sm">Salvar</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
function editarAtrib(id, alvo, peso) {
  document.getElementById('eaId').value = id;
  document.getElementById('eaAlvo').value = alvo;
  document.getElementById('eaPeso').value = peso;
  new bootstrap.Modal(document.getElementById('modalEditAtrib')).show();
}
// Redirect form to api.php then back
document.getElementById('formEditAtrib')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const data = new FormData(this);
  fetch('api.php', { method: 'POST', body: data })
    .then(r => r.json())
    .then(d => { if (d.success) location.reload(); else alert(d.error || 'Erro'); });
});
</script>

<?php require '_footer.php'; ?>
