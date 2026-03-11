<?php
require_once 'config.php';

$currentPage = 'colaboradores';
$pageTitle   = 'Colaboradores';
$pdo = getDB();

$msg = '';
$msgType = 'success';

// POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $nome    = trim($_POST['nome'] ?? '');
    $cargo   = trim($_POST['cargo'] ?? '');
    $areaId  = !empty($_POST['area_id']) ? (int)$_POST['area_id'] : null;
    $bonus   = (float)($_POST['bonus_maximo'] ?? 0);
    $email   = trim($_POST['email'] ?? '');
    $ativo   = isset($_POST['ativo']) ? 1 : 0;

    if ($nome === '') {
        $msg = 'O nome do colaborador é obrigatório.';
        $msgType = 'danger';
    } else {
        if ($_POST['action'] === 'create') {
            $stmt = $pdo->prepare("INSERT INTO metas_colaboradores (nome, cargo, area_id, bonus_maximo, email, ativo) VALUES (?,?,?,?,?,?)");
            $stmt->execute([$nome, $cargo ?: null, $areaId, $bonus, $email ?: null, 1]);
            $msg = 'Colaborador criado com sucesso!';
        } elseif ($_POST['action'] === 'edit' && !empty($_POST['id'])) {
            $stmt = $pdo->prepare("UPDATE metas_colaboradores SET nome=?, cargo=?, area_id=?, bonus_maximo=?, email=?, ativo=? WHERE id=?");
            $stmt->execute([$nome, $cargo ?: null, $areaId, $bonus, $email ?: null, $ativo, (int)$_POST['id']]);
            $msg = 'Colaborador atualizado!';
        }
    }
}

$filtroArea  = (int)($_GET['area_id'] ?? 0);
$filtroAtivo = $_GET['ativo'] ?? '1';

$where  = [];
$params = [];
if ($filtroArea > 0) { $where[] = 'c.area_id = ?'; $params[] = $filtroArea; }
if ($filtroAtivo !== 'todos') { $where[] = 'c.ativo = ?'; $params[] = (int)$filtroAtivo; }
$whereStr = $where ? 'WHERE ' . implode(' AND ', $where) : '';

$stmt = $pdo->prepare("
    SELECT c.*, a.nome AS area_nome, a.cor AS area_cor, a.icone AS area_icone
    FROM metas_colaboradores c
    LEFT JOIN metas_areas a ON a.id = c.area_id
    $whereStr
    ORDER BY c.nome
");
$stmt->execute($params);
$colaboradores = $stmt->fetchAll();

$areas = $pdo->query("SELECT * FROM metas_areas ORDER BY nome")->fetchAll();

require '_header.php';
?>

<div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
  <div>
    <h4 class="mb-0 fw-bold"><i class="bi bi-people text-primary me-2"></i>Colaboradores</h4>
    <small class="text-secondary">Gerencie os membros da equipe</small>
  </div>
  <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalColab">
    <i class="bi bi-plus-lg me-1"></i>Novo Colaborador
  </button>
</div>

<!-- Filtros -->
<div class="card mb-4">
  <div class="card-body py-2">
    <form class="d-flex gap-2 flex-wrap align-items-center">
      <select name="area_id" class="form-select form-select-sm" style="width:160px">
        <option value="0">Todas as áreas</option>
        <?php foreach ($areas as $a): ?>
          <option value="<?= $a['id'] ?>" <?= $filtroArea === $a['id'] ? 'selected' : '' ?>><?= htmlspecialchars($a['nome']) ?></option>
        <?php endforeach; ?>
      </select>
      <select name="ativo" class="form-select form-select-sm" style="width:130px">
        <option value="1" <?= $filtroAtivo === '1' ? 'selected' : '' ?>>Ativos</option>
        <option value="0" <?= $filtroAtivo === '0' ? 'selected' : '' ?>>Inativos</option>
        <option value="todos" <?= $filtroAtivo === 'todos' ? 'selected' : '' ?>>Todos</option>
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
    <?php if (empty($colaboradores)): ?>
      <div class="text-center text-secondary py-5">
        <i class="bi bi-people fs-1 d-block mb-2"></i>
        Nenhum colaborador encontrado.
      </div>
    <?php else: ?>
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr>
              <th class="px-3">Colaborador</th>
              <th>Área</th>
              <th>Bônus Máximo</th>
              <th>Status</th>
              <th class="text-end px-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            <?php foreach ($colaboradores as $c): ?>
              <tr>
                <td class="px-3">
                  <div class="fw-semibold"><?= htmlspecialchars($c['nome']) ?></div>
                  <?php if ($c['cargo']): ?>
                    <small class="text-secondary"><?= htmlspecialchars($c['cargo']) ?></small>
                  <?php endif; ?>
                  <?php if ($c['email']): ?>
                    <br><small class="text-secondary"><i class="bi bi-envelope me-1"></i><?= htmlspecialchars($c['email']) ?></small>
                  <?php endif; ?>
                </td>
                <td>
                  <?php if ($c['area_nome']): ?>
                    <span class="badge area-badge" style="background:<?= htmlspecialchars($c['area_cor']) ?>22;color:<?= htmlspecialchars($c['area_cor']) ?>;border:1px solid <?= htmlspecialchars($c['area_cor']) ?>40">
                      <i class="bi <?= htmlspecialchars($c['area_icone']) ?>"></i>
                      <?= htmlspecialchars($c['area_nome']) ?>
                    </span>
                  <?php else: ?>
                    <span class="text-secondary">—</span>
                  <?php endif; ?>
                </td>
                <td>
                  <span class="fw-bold text-success"><?= formatMoeda($c['bonus_maximo']) ?></span>
                </td>
                <td>
                  <?php if ($c['ativo']): ?>
                    <span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Ativo</span>
                  <?php else: ?>
                    <span class="badge bg-secondary"><i class="bi bi-x-circle me-1"></i>Inativo</span>
                  <?php endif; ?>
                </td>
                <td class="text-end px-3">
                  <button class="btn btn-sm btn-outline-secondary me-1"
                          onclick="editarColab(<?= htmlspecialchars(json_encode($c)) ?>)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger"
                          onclick="confirmDelete('api.php?action=delete_colaborador&id=<?= $c['id'] ?>', 'Excluir o colaborador «<?= addslashes($c['nome']) ?>»?')">
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
<div class="modal fade" id="modalColab" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <form method="post">
        <input type="hidden" name="action" id="cAction" value="create">
        <input type="hidden" name="id" id="cId" value="">
        <div class="modal-header">
          <h5 class="modal-title" id="cTitle"><i class="bi bi-person-plus me-2"></i>Novo Colaborador</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3">
            <div class="col-12">
              <label class="form-label fw-semibold">Nome <span class="text-danger">*</span></label>
              <input type="text" name="nome" id="cNome" class="form-control" placeholder="Nome completo" maxlength="100" required>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Cargo</label>
              <input type="text" name="cargo" id="cCargo" class="form-control" placeholder="Ex: Analista, SDR..." maxlength="100">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Área</label>
              <select name="area_id" id="cArea" class="form-select">
                <option value="">Sem área</option>
                <?php foreach ($areas as $a): ?>
                  <option value="<?= $a['id'] ?>"><?= htmlspecialchars($a['nome']) ?></option>
                <?php endforeach; ?>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">Bônus Máximo (R$)</label>
              <input type="number" name="bonus_maximo" id="cBonus" class="form-control" placeholder="0.00" step="0.01" min="0" value="0">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-semibold">E-mail</label>
              <input type="email" name="email" id="cEmail" class="form-control" placeholder="email@empresa.com" maxlength="150">
            </div>
            <div class="col-12" id="cAtivoRow" style="display:none">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" name="ativo" id="cAtivo" checked>
                <label class="form-check-label" for="cAtivo">Colaborador ativo</label>
              </div>
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
function editarColab(c) {
  document.getElementById('cAction').value = 'edit';
  document.getElementById('cId').value = c.id;
  document.getElementById('cNome').value = c.nome;
  document.getElementById('cCargo').value = c.cargo || '';
  document.getElementById('cArea').value = c.area_id || '';
  document.getElementById('cBonus').value = c.bonus_maximo;
  document.getElementById('cEmail').value = c.email || '';
  document.getElementById('cAtivo').checked = c.ativo == 1;
  document.getElementById('cAtivoRow').style.display = 'block';
  document.getElementById('cTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Colaborador';
  new bootstrap.Modal(document.getElementById('modalColab')).show();
}
document.getElementById('modalColab').addEventListener('hidden.bs.modal', () => {
  document.getElementById('cAction').value = 'create';
  document.getElementById('cId').value = '';
  document.getElementById('cAtivoRow').style.display = 'none';
  document.getElementById('cTitle').innerHTML = '<i class="bi bi-person-plus me-2"></i>Novo Colaborador';
  document.querySelector('#modalColab form').reset();
});
</script>

<?php require '_footer.php'; ?>
