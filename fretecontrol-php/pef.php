<?php
require_once 'config.php';
require_once 'layout.php';

$items = [];
$ciots = [];
try {
    $pdo = getPDO();
    $items = $pdo->query("
        SELECT p.*, c.numero AS ciot_numero, t.nome AS transportador_nome
        FROM pef_lancamentos p
        JOIN ciots c ON c.id = p.ciot_id
        JOIN transportadores t ON t.id = c.transportador_id
        ORDER BY p.data_lancamento DESC, p.created_at DESC
    ")->fetchAll();
    $ciots = $pdo->query("
        SELECT c.id, CONCAT(c.numero, ' - ', t.nome) AS label
        FROM ciots c
        JOIN transportadores t ON t.id = c.transportador_id
        WHERE c.status IN ('ativo','pendente')
        ORDER BY c.numero
    ")->fetchAll();
} catch (PDOException $e) {
    $items = [];
}

$totalPef = array_sum(array_column($items, 'valor'));

renderHead('PEF / Pagamentos');
renderSidebar('pef');
?>
<div class="main-content">
    <div class="page-header">
        <div>
            <h1><i class="bi bi-cash-stack me-2" style="color:#34d399"></i>PEF / Pagamentos</h1>
            <div style="color:#6b7280; font-size:0.85rem; margin-top:0.25rem;">Lançamentos de Pagamento de Frete</div>
        </div>
        <div class="d-flex align-items-center gap-3">
            <div style="text-align:right">
                <div style="font-size:0.75rem; color:#6b7280;">Total Lançado</div>
                <div style="font-size:1.2rem; font-weight:700; color:#34d399;">R$ <?= number_format($totalPef, 2, ',', '.') ?></div>
            </div>
            <button class="btn btn-accent" onclick="openModal()">
                <i class="bi bi-plus-lg me-1"></i>Novo Lançamento
            </button>
        </div>
    </div>

    <!-- Type summary -->
    <?php
    $byTipo = [];
    foreach ($items as $r) {
        $byTipo[$r['tipo']] = ($byTipo[$r['tipo']] ?? 0) + $r['valor'];
    }
    ?>
    <div class="row g-3 mb-4">
        <?php foreach (['adiantamento' => '#60a5fa', 'saldo' => '#34d399', 'pedagio' => '#fbbf24', 'outros' => '#a78bfa'] as $tipo => $color): ?>
        <div class="col-6 col-md-3">
            <div class="stat-card">
                <div style="font-size:0.75rem; text-transform:uppercase; color:#4b5563; margin-bottom:0.5rem"><?= ucfirst($tipo) ?></div>
                <div style="font-size:1.4rem; font-weight:800; color:<?= $color ?>">
                    R$ <?= number_format($byTipo[$tipo] ?? 0, 2, ',', '.') ?>
                </div>
            </div>
        </div>
        <?php endforeach; ?>
    </div>

    <div class="table-card">
        <div class="table-card-header">
            <div style="font-weight:600; color:#f9fafb;">
                <i class="bi bi-list me-2"></i><?= count($items) ?> lançamentos
            </div>
            <input type="text" class="form-control form-control-sm" style="width:220px" placeholder="Buscar..." oninput="filterTable(this.value)">
        </div>
        <div class="table-responsive">
            <table class="table" id="mainTable">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>CIOT</th>
                        <th>Transportador</th>
                        <th>Tipo</th>
                        <th>Valor</th>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($items)): ?>
                    <tr><td colspan="8" class="text-center text-muted py-4">Nenhum lançamento PEF</td></tr>
                    <?php else: foreach ($items as $row): ?>
                    <tr>
                        <td style="color:#4b5563"><?= $row['id'] ?></td>
                        <td><span style="font-family:monospace; color:#f59e0b; font-weight:600"><?= htmlspecialchars($row['ciot_numero']) ?></span></td>
                        <td style="font-size:0.85rem"><?= htmlspecialchars($row['transportador_nome']) ?></td>
                        <td><?= statusBadge($row['tipo']) ?></td>
                        <td style="color:#34d399; font-weight:700">R$ <?= number_format($row['valor'], 2, ',', '.') ?></td>
                        <td style="color:#9ca3af; font-size:0.85rem"><?= date('d/m/Y', strtotime($row['data_lancamento'])) ?></td>
                        <td style="font-size:0.8rem; color:#6b7280; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
                            <?= htmlspecialchars($row['descricao'] ?? '') ?>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-warning" onclick='editItem(<?= json_encode($row) ?>)'>
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(<?= $row['id'] ?>)">
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
                <h5 class="modal-title" id="modalTitle">Novo Lançamento PEF</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="itemForm">
                    <input type="hidden" id="itemId">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label">CIOT *</label>
                            <select class="form-select" id="f_ciot_id" required>
                                <option value="">-- Selecione o CIOT --</option>
                                <?php foreach ($ciots as $c): ?>
                                <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['label']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Tipo *</label>
                            <select class="form-select" id="f_tipo">
                                <option value="adiantamento">Adiantamento</option>
                                <option value="saldo">Saldo</option>
                                <option value="pedagio">Pedágio</option>
                                <option value="outros">Outros</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Valor *</label>
                            <input type="number" class="form-control" id="f_valor" step="0.01" min="0" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Data Lançamento *</label>
                            <input type="date" class="form-control" id="f_data_lancamento" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Descrição</label>
                            <textarea class="form-control" id="f_descricao" rows="2"></textarea>
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

<div id="toastContainer" class="alert-toast"></div>

<script>
const modal = new bootstrap.Modal(document.getElementById('itemModal'));

function openModal() {
    document.getElementById('modalTitle').textContent = 'Novo Lançamento PEF';
    document.getElementById('itemId').value = '';
    document.getElementById('itemForm').reset();
    document.getElementById('f_data_lancamento').value = new Date().toISOString().split('T')[0];
    modal.show();
}

function editItem(data) {
    document.getElementById('modalTitle').textContent = 'Editar Lançamento PEF';
    document.getElementById('itemId').value = data.id;
    document.getElementById('f_ciot_id').value = data.ciot_id || '';
    document.getElementById('f_tipo').value = data.tipo || 'adiantamento';
    document.getElementById('f_valor').value = data.valor || '';
    document.getElementById('f_data_lancamento').value = data.data_lancamento || '';
    document.getElementById('f_descricao').value = data.descricao || '';
    modal.show();
}

function saveItem() {
    const id = document.getElementById('itemId').value;
    const body = {
        action: id ? 'update' : 'create',
        entity: 'pef',
        id,
        ciot_id: document.getElementById('f_ciot_id').value,
        tipo: document.getElementById('f_tipo').value,
        valor: document.getElementById('f_valor').value,
        data_lancamento: document.getElementById('f_data_lancamento').value,
        descricao: document.getElementById('f_descricao').value,
    };
    fetch('api.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
        .then(r => r.json()).then(res => {
            if (res.success) { modal.hide(); showToast('success', res.message); setTimeout(()=>location.reload(),1000); }
            else showToast('danger', res.message);
        }).catch(() => showToast('danger', 'Erro de conexão'));
}

function deleteItem(id) {
    if (!confirm('Excluir este lançamento PEF?')) return;
    fetch('api.php', { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({action:'delete', entity:'pef', id}) })
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
