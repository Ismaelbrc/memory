<?php
require_once 'config.php';

$currentPage = 'areas';
$pageTitle   = 'Áreas';
$pdo = getDB();

$msg = '';
$msgType = 'success';

// POST — Criar ou editar área
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    $nome   = trim($_POST['nome'] ?? '');
    $desc   = trim($_POST['descricao'] ?? '');
    $cor    = preg_match('/^#[0-9a-fA-F]{6}$/', $_POST['cor'] ?? '') ? $_POST['cor'] : '#0d6efd';
    $icone  = preg_match('/^bi-[a-z0-9\-]+$/', $_POST['icone'] ?? '') ? $_POST['icone'] : 'bi-briefcase';

    if ($nome === '') {
        $msg = 'O nome da área é obrigatório.';
        $msgType = 'danger';
    } else {
        if ($_POST['action'] === 'create') {
            $stmt = $pdo->prepare("INSERT INTO metas_areas (nome, descricao, cor, icone) VALUES (?, ?, ?, ?)");
            $stmt->execute([$nome, $desc, $cor, $icone]);
            $msg = 'Área criada com sucesso!';
        } elseif ($_POST['action'] === 'edit' && !empty($_POST['id'])) {
            $stmt = $pdo->prepare("UPDATE metas_areas SET nome=?, descricao=?, cor=?, icone=? WHERE id=?");
            $stmt->execute([$nome, $desc, $cor, $icone, (int)$_POST['id']]);
            $msg = 'Área atualizada com sucesso!';
        }
    }
}

// Buscar áreas com contagem de metas e colaboradores
$areas = $pdo->query("
    SELECT a.*,
           COUNT(DISTINCT c.id) AS total_colabs,
           COUNT(DISTINCT m.id) AS total_metas
    FROM metas_areas a
    LEFT JOIN metas_colaboradores c ON c.area_id = a.id
    LEFT JOIN metas_metas m ON m.area_id = a.id AND m.status='ativa'
    GROUP BY a.id
    ORDER BY a.nome
")->fetchAll();

require '_header.php';
?>

<div class="d-flex align-items-center justify-content-between mb-4">
  <div>
    <h4 class="mb-0 fw-bold"><i class="bi bi-diagram-3 text-info me-2"></i>Áreas</h4>
    <small class="text-secondary">Gerencie os departamentos da empresa</small>
  </div>
  <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modalArea">
    <i class="bi bi-plus-lg me-1"></i>Nova Área
  </button>
</div>

<?php if ($msg): ?>
  <div class="alert alert-<?= $msgType ?> alert-dismissible fade show" role="alert">
    <?= htmlspecialchars($msg) ?>
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>
<?php endif; ?>

<div class="row g-3">
  <?php if (empty($areas)): ?>
    <div class="col-12">
      <div class="card">
        <div class="card-body text-center py-5 text-secondary">
          <i class="bi bi-diagram-3 fs-1 d-block mb-2"></i>
          Nenhuma área cadastrada ainda.
          <br><button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#modalArea">Criar primeira área</button>
        </div>
      </div>
    </div>
  <?php else: ?>
    <?php foreach ($areas as $a): ?>
      <div class="col-sm-6 col-lg-4">
        <div class="card h-100" style="border-left: 4px solid <?= htmlspecialchars($a['cor']) ?>">
          <div class="card-body">
            <div class="d-flex align-items-start justify-content-between mb-3">
              <div class="d-flex align-items-center gap-2">
                <div class="rounded-circle d-flex align-items-center justify-content-center"
                     style="width:44px;height:44px;background:<?= htmlspecialchars($a['cor']) ?>22;border:2px solid <?= htmlspecialchars($a['cor']) ?>40">
                  <i class="bi <?= htmlspecialchars($a['icone']) ?> fs-5" style="color:<?= htmlspecialchars($a['cor']) ?>"></i>
                </div>
                <div>
                  <div class="fw-semibold"><?= htmlspecialchars($a['nome']) ?></div>
                  <small class="text-secondary"><?= htmlspecialchars($a['descricao'] ?? '') ?></small>
                </div>
              </div>
            </div>
            <div class="d-flex gap-3 mb-3">
              <div class="text-center">
                <div class="fw-bold text-primary"><?= $a['total_colabs'] ?></div>
                <small class="text-secondary">Colaboradores</small>
              </div>
              <div class="text-center">
                <div class="fw-bold text-warning"><?= $a['total_metas'] ?></div>
                <small class="text-secondary">Metas ativas</small>
              </div>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary flex-grow-1"
                      onclick="editarArea(<?= htmlspecialchars(json_encode($a)) ?>)">
                <i class="bi bi-pencil"></i> Editar
              </button>
              <button class="btn btn-sm btn-outline-danger"
                      onclick="confirmDelete('api.php?action=delete_area&id=<?= $a['id'] ?>', 'Excluir a área «<?= addslashes($a['nome']) ?>»? Isso afetará todas as metas vinculadas.')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    <?php endforeach; ?>
  <?php endif; ?>
</div>

<!-- Modal Criar/Editar Área -->
<div class="modal fade" id="modalArea" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <form method="post">
        <input type="hidden" name="action" id="formAction" value="create">
        <input type="hidden" name="id" id="formId" value="">
        <div class="modal-header">
          <h5 class="modal-title" id="modalTitle"><i class="bi bi-plus-circle me-2"></i>Nova Área</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-3">
            <label class="form-label fw-semibold">Nome <span class="text-danger">*</span></label>
            <input type="text" name="nome" id="formNome" class="form-control" placeholder="Ex: Vendas, Marketing..." maxlength="100" required>
          </div>
          <div class="mb-3">
            <label class="form-label fw-semibold">Descrição</label>
            <textarea name="descricao" id="formDesc" class="form-control" rows="2" placeholder="Descrição opcional..."></textarea>
          </div>
          <div class="row g-3">
            <div class="col-6">
              <label class="form-label fw-semibold">Cor</label>
              <div class="d-flex gap-2 align-items-center">
                <input type="color" name="cor" id="formCor" class="form-control form-control-color" value="#0d6efd" title="Escolha a cor">
                <span class="text-secondary" style="font-size:.8rem;">Cor da área</span>
              </div>
            </div>
            <div class="col-6">
              <label class="form-label fw-semibold">Ícone Bootstrap</label>
              <select name="icone" id="formIcone" class="form-select">
                <option value="bi-briefcase">💼 Negócios</option>
                <option value="bi-graph-up-arrow">📈 Vendas</option>
                <option value="bi-megaphone-fill">📣 Marketing</option>
                <option value="bi-heart-fill">❤️ Customer Success</option>
                <option value="bi-cpu-fill">💻 Tecnologia</option>
                <option value="bi-people-fill">👥 RH / Pessoas</option>
                <option value="bi-cash-coin">💰 Financeiro</option>
                <option value="bi-tools">🔧 Operações</option>
                <option value="bi-shield-check">🛡️ Qualidade</option>
                <option value="bi-box-seam">📦 Logística</option>
                <option value="bi-headset">🎧 Suporte</option>
                <option value="bi-mortarboard">🎓 Treinamento</option>
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
function editarArea(a) {
  document.getElementById('formAction').value = 'edit';
  document.getElementById('formId').value = a.id;
  document.getElementById('formNome').value = a.nome;
  document.getElementById('formDesc').value = a.descricao || '';
  document.getElementById('formCor').value = a.cor;
  document.getElementById('formIcone').value = a.icone;
  document.getElementById('modalTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i>Editar Área';
  new bootstrap.Modal(document.getElementById('modalArea')).show();
}
document.getElementById('modalArea').addEventListener('hidden.bs.modal', () => {
  document.getElementById('formAction').value = 'create';
  document.getElementById('formId').value = '';
  document.getElementById('modalTitle').innerHTML = '<i class="bi bi-plus-circle me-2"></i>Nova Área';
  document.querySelector('#modalArea form').reset();
});
</script>

<?php require '_footer.php'; ?>
