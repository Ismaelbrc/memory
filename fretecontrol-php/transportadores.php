<?php
require_once 'config.php';
require_once 'layout.php';

$items = [];
try {
    $pdo = getPDO();
    $items = $pdo->query("SELECT * FROM transportadores ORDER BY nome ASC")->fetchAll();
} catch (PDOException $e) {
    $items = [];
}

renderHead('Transportadores');
renderSidebar('transportadores');
?>
<div class="main-content">
    <div class="page-header">
        <div>
            <h1><i class="bi bi-person-badge me-2" style="color:#f59e0b"></i>Transportadores</h1>
            <div style="color:#6b7280; font-size:0.85rem; margin-top:0.25rem;">Gerenciar transportadores cadastrados</div>
        </div>
        <button class="btn btn-accent" onclick="openModal()">
            <i class="bi bi-plus-lg me-1"></i>Novo Transportador
        </button>
    </div>

    <div class="table-card">
        <div class="table-card-header">
            <div style="font-weight:600; color:#f9fafb;">
                <i class="bi bi-list me-2"></i><?= count($items) ?> registros
            </div>
            <input type="text" class="form-control form-control-sm" style="width:220px" placeholder="Buscar..." oninput="filterTable(this.value)">
        </div>
        <div class="table-responsive">
            <table class="table" id="mainTable">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nome</th>
                        <th>CPF/CNPJ</th>
                        <th>Tipo</th>
                        <th>Telefone</th>
                        <th>ANTT</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($items)): ?>
                    <tr><td colspan="8" class="text-center text-muted py-4">Nenhum transportador cadastrado</td></tr>
                    <?php else: foreach ($items as $row): ?>
                    <tr>
                        <td style="color:#4b5563"><?= $row['id'] ?></td>
                        <td style="color:#f9fafb; font-weight:500"><?= htmlspecialchars($row['nome']) ?></td>
                        <td style="font-family:monospace"><?= htmlspecialchars($row['cpf_cnpj']) ?></td>
                        <td><?= statusBadge($row['tipo']) ?></td>
                        <td><?= htmlspecialchars($row['telefone'] ?? '-') ?></td>
                        <td><?= htmlspecialchars($row['antt'] ?? '-') ?></td>
                        <td><?= statusBadge($row['status']) ?></td>
                        <td>
                            <button class="btn btn-sm btn-outline-warning" onclick='editItem(<?= json_encode($row) ?>)'>
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(<?= $row['id'] ?>, '<?= htmlspecialchars($row['nome'], ENT_QUOTES) ?>')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                    <?php endforeach; endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Modal -->
<div class="modal fade" id="itemModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTitle">Novo Transportador</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="itemForm">
                    <input type="hidden" id="itemId">
                    <div class="row g-3">
                        <div class="col-md-8">
                            <label class="form-label">Nome *</label>
                            <input type="text" class="form-control" id="f_nome" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Tipo *</label>
                            <select class="form-select" id="f_tipo">
                                <option value="PF">Pessoa Física</option>
                                <option value="PJ">Pessoa Jurídica</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">CPF / CNPJ *</label>
                            <input type="text" class="form-control" id="f_cpf_cnpj" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Telefone</label>
                            <input type="text" class="form-control" id="f_telefone">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">ANTT</label>
                            <input type="text" class="form-control" id="f_antt">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">E-mail</label>
                            <input type="email" class="form-control" id="f_email">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="f_status">
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-accent" onclick="saveItem()">
                    <i class="bi bi-check-lg me-1"></i>Salvar
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Toast -->
<div id="toastContainer" class="alert-toast"></div>

<script>
const modal = new bootstrap.Modal(document.getElementById('itemModal'));

function openModal() {
    document.getElementById('modalTitle').textContent = 'Novo Transportador';
    document.getElementById('itemId').value = '';
    document.getElementById('itemForm').reset();
    modal.show();
}

function editItem(data) {
    document.getElementById('modalTitle').textContent = 'Editar Transportador';
    document.getElementById('itemId').value = data.id;
    document.getElementById('f_nome').value = data.nome || '';
    document.getElementById('f_tipo').value = data.tipo || 'PF';
    document.getElementById('f_cpf_cnpj').value = data.cpf_cnpj || '';
    document.getElementById('f_telefone').value = data.telefone || '';
    document.getElementById('f_antt').value = data.antt || '';
    document.getElementById('f_email').value = data.email || '';
    document.getElementById('f_status').value = data.status || 'ativo';
    modal.show();
}

function saveItem() {
    const id = document.getElementById('itemId').value;
    const body = {
        action: id ? 'update' : 'create',
        entity: 'transportadores',
        id: id,
        nome: document.getElementById('f_nome').value,
        tipo: document.getElementById('f_tipo').value,
        cpf_cnpj: document.getElementById('f_cpf_cnpj').value,
        telefone: document.getElementById('f_telefone').value,
        antt: document.getElementById('f_antt').value,
        email: document.getElementById('f_email').value,
        status: document.getElementById('f_status').value,
    };
    fetch('api.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
        .then(r => r.json()).then(res => {
            if (res.success) { modal.hide(); showToast('success', res.message); setTimeout(()=>location.reload(),1000); }
            else showToast('danger', res.message);
        }).catch(() => showToast('danger', 'Erro de conexão'));
}

function deleteItem(id, nome) {
    if (!confirm(`Excluir "${nome}"?`)) return;
    fetch('api.php', { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({action:'delete', entity:'transportadores', id}) })
        .then(r => r.json()).then(res => {
            if (res.success) { showToast('success', res.message); setTimeout(()=>location.reload(),1000); }
            else showToast('danger', res.message);
        }).catch(() => showToast('danger', 'Erro de conexão'));
}

function showToast(type, msg) {
    const el = document.createElement('div');
    el.className = `alert alert-${type} alert-dismissible shadow`;
    el.innerHTML = msg + '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>';
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => el.remove(), 4000);
}

function filterTable(q) {
    q = q.toLowerCase();
    document.querySelectorAll('#mainTable tbody tr').forEach(tr => {
        tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}
</script>
<?php renderFooter(); ?>
