<?php
require_once 'config.php';

$currentPage = 'metas';
$pageTitle   = 'Metas';
$pdo = getDB();

$msg = '';
$msgType = 'success';

// POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $areaId  = (int)($_POST['area_id'] ?? 0);
    $titulo  = trim($_POST['titulo'] ?? '');
    $desc    = trim($_POST['descricao'] ?? '');
    $tipo    = in_array($_POST['tipo'] ?? '', ['numero','percentual','monetario','booleano']) ? $_POST['tipo'] : 'numero';
    $alvo    = (float)($_POST['valor_alvo'] ?? 0);
    $unidade = trim($_POST['unidade'] ?? '');
    $peso    = max(0.01, (float)($_POST['peso'] ?? 1));
    $mes     = (int)($_POST['mes'] ?? date('n'));
    $ano     = (int)($_POST['ano'] ?? date('Y'));
    $status  = in_array($_POST['status'] ?? '', ['ativa','concluida','cancelada']) ? $_POST['status'] : 'ativa';

    if ($titulo === '' || $areaId <= 0) {
        $msg = 'Título e área são obrigatórios.';
        $msgType = 'danger';
    } elseif ($alvo <= 0 && $tipo !== 'booleano') {
        $msg = 'O valor alvo deve ser maior que zero.';
        $msgType = 'danger';
    } else {
        if ($_POST['action'] === 'create') {
            $stmt = $pdo->prepare("INSERT INTO metas_metas (area_id, titulo, descricao, tipo, valor_alvo, unidade, peso, mes, ano, status) VALUES (?,?,?,?,?,?,?,?,?,?)");
            $stmt->execute([$areaId, $titulo, $desc ?: null, $tipo, $alvo, $unidade ?: null, $peso, $mes, $ano, $status]);
            $msg = 'Meta criada com sucesso!';
        } elseif ($_POST['action'] === 'edit' && !empty($_POST['id'])) {
            $stmt = $pdo->prepare("UPDATE metas_metas SET area_id=?, titulo=?, descricao=?, tipo=?, valor_alvo=?, unidade=?, peso=?, mes=?, ano=?, status=? WHERE id=?");
            $stmt->execute([$areaId, $titulo, $desc ?: null, $tipo, $alvo, $unidade ?: null, $peso, $mes, $ano, $status, (int)$_POST['id']]);
            $msg = 'Meta atualizada!';
        }
    }
}

$filtroMes  = (int)($_GET['mes'] ?? date('n'));
$filtroAno  = (int)($_GET['ano'] ?? date('Y'));
$filtroArea = (int)($_GET['area_id'] ?? 0);

$where = ['1=1'];
$params = [];
if ($filtroMes > 0) { $where[] = 'm.mes = ?'; $params[] = $filtroMes; }
if ($filtroAno > 0) { $where[] = 'm.ano = ?'; $params[] = $filtroAno; }
if ($filtroArea > 0) { $where[] = 'm.area_id = ?'; $params[] = $filtroArea; }
$whereStr = implode(' AND ', $where);

$stmt = $pdo->prepare("
    SELECT m.*, a.nome AS area_nome, a.cor AS area_cor, a.icone AS area_icone,
           COUNT(DISTINCT d.id) AS total_atribuicoes
    FROM metas_metas m
    JOIN metas_areas a ON a.id = m.area_id
    LEFT JOIN metas_distribuicao d ON d.meta_id = m.id
    WHERE $whereStr
    GROUP BY m.id
    ORDER BY m.peso DESC, m.titulo
");
$stmt->execute($params);
$metas = $stmt->fetchAll();

$areas = $pdo->query("SELECT * FROM metas_areas ORDER BY nome")->fetchAll();

$tipoLabels = ['numero' => 'Número', 'percentual' => 'Percentual', 'monetario' => 'Monetário', 'booleano' => 'Sim/Não'];
$statusColors = ['ativa' => 'primary', 'concluida' => 'success', 'cancelada' => 'secondary'];

require '_header.php';
?>

<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
  <div>
    <h4 class="mb-0 fw-bold"><i class="bi bi-bullseye text-warning me-2"></i>Metas</h4>
    <small class="text-secondary">Gerencie as metas mensais por área</small>
  </div>
  <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalMeta">
    <i class="bi bi-plus-lg me-1"></i>Nova Meta
  </button>
</div>

<!-- Filtros -->
<div class="card mb-4">
  <div class="card-body py-2">
    <form class="d-flex gap-2 flex-wrap align-items-center">
      <select name="mes" class="form-select form-select-sm" style="width:130px">
        <?php for ($m = 1; $m <= 12; $m++): ?>
          <option value="<?= $m ?>" <?= $m === $filtroMes ? 'selected' : '' ?>><?= nomeMes($m) ?></option>
        <?php endfor; ?>
      </select>
      <select name="ano" class="form-select form-select-sm" style="width:90px">
        <?php for ($y = date('Y') - 2; $y <= date('Y') + 1; $y++): ?>
          <option value="<?= $y ?>" <?= $y === $filtroAno ? 'selected' : '' ?>><?= $y ?></option>
        <?php endfor; ?>
      </select>
      <select name="area_id" class="form-select form-select-sm" style="width:160px">
        <option value="0">Todas as áreas</option>
        <?php foreach ($areas as $a): ?>
          <option value="<?= $a['id'] ?>" <?= $filtroArea === $a['id'] ? 'selected' : '' ?>><?= htmlspecialchars($a['nome']) ?></option>
        <?php endforeach; ?>
      </select>
      <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-funnel me-1"></i>Filtrar</button>
    </form>
  </div>
</div>

<?php if ($msg): ?>
  <div class="alert alert-<?= $msgType ?> alert-dismissible fade show">
    <?= htmlspecialchars($msg) ?>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>
<?php endif; ?>

<div class="card">
  <div class="card-body p-0">
    <?php if (empty($metas)): ?>
      <div class="text-center text-secondary py-5">
        <i class="bi bi-bullseye fs-1 d-block mb-2"></i>
        Nenhuma meta cadastrada para este período.
        <br><button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#modalMeta">Criar primeira meta</button>
      </div>
    <?php else: ?>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th class="px-3">Meta</th>
              <th>Área</th>
              <th>Tipo</th>
              <th>Alvo</th>
              <th>Peso</th>
              <th>Período</th>
              <th>Colaboradores</th>
              <th>Status</th>
              <th class="text-end px-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($metas as $m): ?>
              <tr>
                <td class="px-3">
                  <div class="fw-semibold"><?= htmlspecialchars($m['titulo']) ?></div>
                  <?php if ($m['descricao']): ?>
                    <small class="text-secondary"><?= htmlspecialchars(mb_substr($m['descricao'], 0, 60)) . (mb_strlen($m['descricao']) > 60 ? '...' : '') ?></small>
                  <?php endif; ?>
                </td>
                <td>
                  <span class="badge area-badge" style="background:<?= htmlspecialchars($m['area_cor']) ?>22;color:<?= htmlspecialchars($m['area_cor']) ?>;border:1px solid <?= htmlspecialchars($m['area_cor']) ?>40">
                    <i class="bi <?= htmlspecialchars($m['area_icone']) ?>"></i>
                    <?= htmlspecialchars($m['area_nome']) ?>
                  </span>
                </td>
                <td><span class="badge bg-secondary"><?= $tipoLabels[$m['tipo']] ?></span></td>
                <td>
                  <?php if ($m['tipo'] === 'booleano'): ?>
                    <span class="text-secondary">Sim/Não</span>
                  <?php elseif ($m['tipo'] === 'monetario'): ?>
                    <span class="fw-bold"><?= formatMoeda($m['valor_alvo']) ?></span>
                  <?php else: ?>
                    <span class="fw-bold"><?= number_format($m['valor_alvo'], 0, ',', '.') ?> <?= htmlspecialchars($m['unidade'] ?? '') ?></span>
                  <?php endif; ?>
                </td>
                <td>
                  <span class="badge bg-info text-dark fw-bold"><?= number_format($m['peso'], 2) ?>x</span>
                </td>
                <td><small><?= nomeMes($m['mes']) ?>/<?= $m['ano'] ?></small></td>
                <td>
                  <a href="distribuicao.php?meta_id=<?= $m['id'] ?>" class="badge bg-primary text-decoration-none">
                    <?= $m['total_atribuicoes'] ?> <i class="bi bi-people ms-1"></i>
                  </a>
                </td>
                <td>
                  <span class="badge bg-<?= $statusColors[$m['status']] ?>">
                    <?= ucfirst($m['status']) ?>
                  </span>
                </td>
                <td class="text-end px-3">
                  <a href="distribuicao.php?meta_id=<?= $m['id'] ?>" class="btn btn-sm btn-outline-info me-1" title="Distribuir">
                    <i class="bi bi-share"></i>
                  </a>
                  <button class="btn btn-sm btn-outline-secondary me-1" onclick="editarMeta(<?= htmlspecialchars(json_encode($m)) ?>)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete('api.php?action=delete_meta&id=<?= $m['id'] ?>', 'Excluir a meta «<?= addslashes($m['titulo']) ?>»?')">
                    <i class="bi bi-trash"></i>
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

<!-- Modal -->
<div class="modal fade" id="modalMeta" tabindex="-1">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <form method="post">
        <input type="hidden" name="action" id="mAction" value="create">
        <input type="hidden" name="id" id="mId" value="">
        <div class="modal-header">
          <h5 class="modal-title" id="mTitle"><i class="bi bi-plus-circle me-2"></i>Nova Meta</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label fw-semibold">Título <span class="text-danger">*</span></label>
              <input type="text" name="titulo" id="mTitulo" class="form-control" placeholder="Ex: Atingir R$ 500k em vendas" maxlength="200" required>
            </div>
            <div class="col-12">
              <label class="form-label fw-semibold">Descrição</label>
              <textarea name="descricao" id="mDesc" class="form-control" rows="2" placeholder="Descrição opcional..."></textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Área <span class="text-danger">*</span></label>
              <select name="area_id" id="mArea" class="form-select" required>
                <option value="">Selecione a área</option>
                <?php foreach ($areas as $a): ?>
                  <option value="<?= $a['id'] ?>" <?= $filtroArea === $a['id'] ? 'selected' : '' ?>><?= htmlspecialchars($a['nome']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Tipo de Métrica</label>
              <select name="tipo" id="mTipo" class="form-select" onchange="toggleTipo()">
                <option value="numero">Número</option>
                <option value="percentual">Percentual (%)</option>
                <option value="monetario">Monetário (R$)</option>
                <option value="booleano">Sim/Não</option>
              </select>
            </div>
            <div class="col-md-4" id="mAlvoGroup">
              <label class="form-label fw-semibold">Valor Alvo <span class="text-danger">*</span></label>
              <input type="number" name="valor_alvo" id="mAlvo" class="form-control" placeholder="0" step="0.01" min="0" value="0">
            </div>
            <div class="col-md-4" id="mUnidadeGroup">
              <label class="form-label fw-semibold">Unidade</label>
              <input type="text" name="unidade" id="mUnidade" class="form-control" placeholder="Ex: vendas, leads, %" maxlength="50">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Peso <span class="text-info" title="Impacto no cálculo do bônus">ℹ</span></label>
              <input type="number" name="peso" id="mPeso" class="form-control" placeholder="1.00" step="0.01" min="0.01" value="1.00">
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Mês</label>
              <select name="mes" id="mMes" class="form-select">
                <?php for ($mm = 1; $mm <= 12; $mm++): ?>
                  <option value="<?= $mm ?>" <?= $mm === $filtroMes ? 'selected' : '' ?>><?= nomeMes($mm) ?></option>
                <?php endfor; ?>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label fw-semibold">Ano</label>
              <select name="ano" id="mAno" class="form-select">
                <?php for ($yy = date('Y') - 1; $yy <= date('Y') + 1; $yy++): ?>
                  <option value="<?= $yy ?>" <?= $yy === $filtroAno ? 'selected' : '' ?>><?= $yy ?></option>
                <?php endfor; ?>
              </select>
            </div>
            <div class="col-md-4" id="mStatusGroup" style="display:none">
              <label class="form-label fw-semibold">Status</label>
              <select name="status" id="mStatus" class="form-select">
                <option value="ativa">Ativa</option>
                <option value="concluida">Concluída</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
          <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg me-1"></i>Salvar</button>
        </div>
      </form>
    </div>
  </div>
</div>

<script>
function toggleTipo() {
  const tipo = document.getElementById('mTipo').value;
  const alvoGroup = document.getElementById('mAlvoGroup');
  const unidadeGroup = document.getElementById('mUnidadeGroup');
  if (tipo === 'booleano') {
    alvoGroup.style.display = 'none';
    unidadeGroup.style.display = 'none';
    document.getElementById('mAlvo').value = 1;
  } else {
    alvoGroup.style.display = 'block';
    unidadeGroup.style.display = tipo === 'monetario' || tipo === 'percentual' ? 'none' : 'block';
  }
}

function editarMeta(m) {
  document.getElementById('mAction').value = 'edit';
  document.getElementById('mId').value = m.id;
  document.getElementById('mTitulo').value = m.titulo;
  document.getElementById('mDesc').value = m.descricao || '';
  document.getElementById('mArea').value = m.area_id;
  document.getElementById('mTipo').value = m.tipo;
  document.getElementById('mAlvo').value = m.valor_alvo;
  document.getElementById('mUnidade').value = m.unidade || '';
  document.getElementById('mPeso').value = m.peso;
  document.getElementById('mMes').value = m.mes;
  document.getElementById('mAno').value = m.ano;
  document.getElementById('mStatus').value = m.status;
  document.getElementById('mStatusGroup').style.display = 'block';
  document.getElementById('mTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Meta';
  toggleTipo();
  new bootstrap.Modal(document.getElementById('modalMeta')).show();
}

document.getElementById('modalMeta').addEventListener('hidden.bs.modal', () => {
  document.getElementById('mAction').value = 'create';
  document.getElementById('mId').value = '';
  document.getElementById('mStatusGroup').style.display = 'none';
  document.getElementById('mTitle').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Nova Meta';
  document.querySelector('#modalMeta form').reset();
  toggleTipo();
});
</script>

<?php require '_footer.php'; ?>
