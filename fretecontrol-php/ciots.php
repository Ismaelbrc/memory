<?php
require_once 'config.php';
require_once 'layout.php';

$items = [];
$transportadores = [];
$contratantes = [];
try {
    $pdo = getPDO();
    $items = $pdo->query("
        SELECT c.*, t.nome AS transportador_nome, ct.nome AS contratante_nome
        FROM ciots c
        JOIN transportadores t ON t.id = c.transportador_id
        JOIN contratantes ct ON ct.id = c.contratante_id
        ORDER BY c.created_at DESC
    ")->fetchAll();
    $transportadores = $pdo->query("SELECT id, nome FROM transportadores WHERE status='ativo' ORDER BY nome")->fetchAll();
    $contratantes = $pdo->query("SELECT id, nome FROM contratantes WHERE status='ativo' ORDER BY nome")->fetchAll();
} catch (PDOException $e) {
    $items = [];
}

renderHead('CIOTs');
renderSidebar('ciots');
?>
<div class="main-content">
    <div class="page-header">
        <div>
            <h1><i class="bi bi-file-earmark-text me-2" style="color:#34d399"></i>CIOTs</h1>
            <div style="color:#6b7280; font-size:0.85rem; margin-top:0.25rem;">Controle Interno de Operações de Transporte</div>
        </div>
        <button class="btn btn-accent" onclick="openModal()">
            <i class="bi bi-plus-lg me-1"></i>Novo CIOT
        </button>
    </div>

    <!-- Summary badges -->
    <div class="d-flex gap-2 mb-3 flex-wrap">
        <?php
        $counts = ['pendente'=>0,'ativo'=>0,'encerrado'=>0,'cancelado'=>0];
        foreach ($items as $r) $counts[$r['status']] = ($counts[$r['status']] ?? 0) + 1;
        foreach ($counts as $s => $c):
        ?>
        <span class="status-badge badge-<?= $s ?>" style="font-size:0.8rem; padding:0.4rem 0.8rem; cursor:pointer" onclick="filterByStatus('<?= $s ?>')">
            <?= ucfirst($s) ?>: <?= $c ?>
        </span>
        <?php endforeach; ?>
        <span class="status-badge" style="font-size:0.8rem; padding:0.4rem 0.8rem; background:rgba(255,255,255,0.05); color:#9ca3af; cursor:pointer" onclick="filterByStatus('')">
            Todos
        </span>
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
                        <th>Número</th>
                        <th>Transportador</th>
                        <th>Contratante</th>
                        <th>Origem → Destino</th>
                        <th>Valor</th>
                        <th>Emissão</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($items)): ?>
                    <tr><td colspan="8" class="text-center text-muted py-4">Nenhum CIOT cadastrado</td></tr>
                    <?php else: foreach ($items as $row): ?>
                    <tr data-status="<?= $row['status'] ?>">
                        <td><span style="font-family:monospace; color:#f59e0b; font-weight:600"><?= htmlspecialchars($row['numero']) ?></span></td>
                        <td><?= htmlspecialchars($row['transportador_nome']) ?></td>
                        <td><?= htmlspecialchars($row['contratante_nome']) ?></td>
                        <td style="font-size:0.8rem">
                            <span style="color:#60a5fa"><?= htmlspecialchars($row['origem']) ?></span>
                            <i class="bi bi-arrow-right mx-1" style="color:#4b5563"></i>
                            <span style="color:#34d399"><?= htmlspecialchars($row['destino']) ?></span>
                        </td>
                        <td style="color:#34d399; font-weight:600">R$ <?= number_format($row['valor_frete'], 2, ',', '.') ?></td>
                        <td style="font-size:0.8rem; color:#9ca3af"><?= date('d/m/Y', strtotime($row['data_emissao'])) ?></td>
                        <td><?= statusBadge($row['status']) ?></td>
                        <td>
                            <button class="btn btn-sm btn-outline-warning" onclick='editItem(<?= json_encode($row) ?>)'>
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(<?= $row['id'] ?>, '<?= htmlspecialchars($row['numero'], ENT_QUOTES) ?>')">
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
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTitle">Novo CIOT</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="itemForm">
                    <input type="hidden" id="itemId">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Número CIOT *</label>
                            <input type="text" class="form-control" id="f_numero" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Data Emissão *</label>
                            <input type="date" class="form-control" id="f_data_emissao" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Data Validade</label>
                            <input type="date" class="form-control" id="f_data_validade">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Transportador *</label>
                            <select class="form-select" id="f_transportador_id" required>
                                <option value="">-- Selecione --</option>
                                <?php foreach ($transportadores as $t): ?>
                                <option value="<?= $t['id'] ?>"><?= htmlspecialchars($t['nome']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Contratante *</label>
                            <select class="form-select" id="f_contratante_id" required>
                                <option value="">-- Selecione --</option>
                                <?php foreach ($contratantes as $c): ?>
                                <option value="<?= $c['id'] ?>"><?= htmlspecialchars($c['nome']) ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-5">
                            <label class="form-label">Origem *</label>
                            <input type="text" class="form-control" id="f_origem" required>
                        </div>
                        <div class="col-md-5">
                            <label class="form-label">Destino *</label>
                            <input type="text" class="form-control" id="f_destino" required>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Valor Frete *</label>
                            <input type="number" class="form-control" id="f_valor_frete" step="0.01" min="0" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="f_status">
                                <option value="pendente">Pendente</option>
                                <option value="ativo">Ativo</option>
                                <option value="encerrado">Encerrado</option>
                                <option value="cancelado">Cancelado</option>
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

<div id="toastContainer" class="alert-toast"></div>

<script>
const modal = new bootstrap.Modal(document.getElementById('itemModal'));

function openModal() {
    document.getElementById('modalTitle').textContent = 'Novo CIOT';
    document.getElementById('itemId').value = '';
    document.getElementById('itemForm').reset();
    document.getElementById('f_data_emissao').value = new Date().toISOString().split('T')[0];
    modal.show();
}

function editItem(data) {
    document.getElementById('modalTitle').textContent = 'Editar CIOT';
    document.getElementById('itemId').value = data.id;
    document.getElementById('f_numero').value = data.numero || '';
    document.getElementById('f_data_emissao').value = data.data_emissao || '';
    document.getElementById('f_data_validade').value = data.data_validade || '';
    document.getElementById('f_transportador_id').value = data.transportador_id || '';
    document.getElementById('f_contratante_id').value = data.contratante_id || '';
    document.getElementById('f_origem').value = data.origem || '';
    document.getElementById('f_destino').value = data.destino || '';
    document.getElementById('f_valor_frete').value = data.valor_frete || '';
    document.getElementById('f_status').value = data.status || 'pendente';
    modal.show();
}

function saveItem() {
    const id = document.getElementById('itemId').value;
    const body = {
        action: id ? 'update' : 'create',
        entity: 'ciots',
        id,
        numero: document.getElementById('f_numero').value,
        data_emissao: document.getElementById('f_data_emissao').value,
        data_validade: document.getElementById('f_data_validade').value || null,
        transportador_id: document.getElementById('f_transportador_id').value,
        contratante_id: document.getElementById('f_contratante_id').value,
        origem: document.getElementById('f_origem').value,
        destino: document.getElementById('f_destino').value,
        valor_frete: document.getElementById('f_valor_frete').value,
        status: document.getElementById('f_status').value,
    };
    fetch('api.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) })
        .then(r => r.json()).then(res => {
            if (res.success) { modal.hide(); showToast('success', res.message); setTimeout(()=>location.reload(),1000); }
            else showToast('danger', res.message);
        }).catch(() => showToast('danger', 'Erro de conexão'));
}

function deleteItem(id, numero) {
    if (!confirm(`Excluir CIOT "${numero}"? Todos os lançamentos PEF vinculados serão removidos.`)) return;
    fetch('api.php', { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({action:'delete', entity:'ciots', id}) })
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

function filterByStatus(status) {
    document.querySelectorAll('#mainTable tbody tr').forEach(tr => {
        if (!status || tr.dataset.status === status) tr.style.display = '';
        else tr.style.display = 'none';
    });
}
</script>
<?php renderFooter(); ?>
