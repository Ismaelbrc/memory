<?php
require_once 'config.php';
require_once 'layout.php';

$stats = [];
try {
    $pdo = getPDO();
    $stats['transportadores'] = $pdo->query("SELECT COUNT(*) FROM transportadores WHERE status='ativo'")->fetchColumn();
    $stats['veiculos']        = $pdo->query("SELECT COUNT(*) FROM veiculos WHERE status='ativo'")->fetchColumn();
    $stats['contratantes']    = $pdo->query("SELECT COUNT(*) FROM contratantes WHERE status='ativo'")->fetchColumn();
    $stats['ciots_ativos']    = $pdo->query("SELECT COUNT(*) FROM ciots WHERE status='ativo'")->fetchColumn();
    $stats['ciots_pendentes'] = $pdo->query("SELECT COUNT(*) FROM ciots WHERE status='pendente'")->fetchColumn();
    $stats['valor_fretes']    = $pdo->query("SELECT COALESCE(SUM(valor_frete),0) FROM ciots WHERE status IN ('ativo','encerrado')")->fetchColumn();
    $stats['pef_total']       = $pdo->query("SELECT COALESCE(SUM(valor),0) FROM pef_lancamentos")->fetchColumn();
    $stats['pef_mes']         = $pdo->query("SELECT COALESCE(SUM(valor),0) FROM pef_lancamentos WHERE YEAR(data_lancamento)=YEAR(CURDATE()) AND MONTH(data_lancamento)=MONTH(CURDATE())")->fetchColumn();

    $recentCiots = $pdo->query("
        SELECT c.numero, c.status, c.valor_frete, c.data_emissao,
               t.nome AS transportador, ct.nome AS contratante
        FROM ciots c
        JOIN transportadores t ON t.id = c.transportador_id
        JOIN contratantes ct ON ct.id = c.contratante_id
        ORDER BY c.created_at DESC LIMIT 8
    ")->fetchAll();

    $recentPef = $pdo->query("
        SELECT p.tipo, p.valor, p.data_lancamento, p.descricao, c.numero AS ciot_numero
        FROM pef_lancamentos p
        JOIN ciots c ON c.id = p.ciot_id
        ORDER BY p.created_at DESC LIMIT 8
    ")->fetchAll();

} catch (PDOException $e) {
    $stats = array_fill_keys(['transportadores','veiculos','contratantes','ciots_ativos','ciots_pendentes','valor_fretes','pef_total','pef_mes'], 0);
    $recentCiots = [];
    $recentPef = [];
}

renderHead('Dashboard');
renderSidebar('index');
?>
<div class="main-content">
    <div class="page-header">
        <div>
            <h1><i class="bi bi-speedometer2 me-2" style="color:#f59e0b"></i>Dashboard</h1>
            <div style="color:#6b7280; font-size:0.85rem; margin-top:0.25rem;">Visão geral do sistema de fretes</div>
        </div>
        <div style="color:#4b5563; font-size:0.8rem;"><?= date('d/m/Y H:i') ?></div>
    </div>

    <!-- Stats Row 1 -->
    <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
            <div class="stat-card">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="stat-icon" style="background:rgba(245,158,11,0.15)">
                        <i class="bi bi-person-badge" style="color:#f59e0b"></i>
                    </div>
                    <span style="font-size:0.7rem;color:#4b5563;">ATIVOS</span>
                </div>
                <div style="font-size:2rem; font-weight:800; color:#f9fafb;"><?= $stats['transportadores'] ?></div>
                <div style="font-size:0.8rem; color:#6b7280;">Transportadores</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-card">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="stat-icon" style="background:rgba(59,130,246,0.15)">
                        <i class="bi bi-truck" style="color:#60a5fa"></i>
                    </div>
                    <span style="font-size:0.7rem;color:#4b5563;">ATIVOS</span>
                </div>
                <div style="font-size:2rem; font-weight:800; color:#f9fafb;"><?= $stats['veiculos'] ?></div>
                <div style="font-size:0.8rem; color:#6b7280;">Veículos</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-card">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="stat-icon" style="background:rgba(139,92,246,0.15)">
                        <i class="bi bi-building" style="color:#a78bfa"></i>
                    </div>
                    <span style="font-size:0.7rem;color:#4b5563;">ATIVOS</span>
                </div>
                <div style="font-size:2rem; font-weight:800; color:#f9fafb;"><?= $stats['contratantes'] ?></div>
                <div style="font-size:0.8rem; color:#6b7280;">Contratantes</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-card">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="stat-icon" style="background:rgba(52,211,153,0.15)">
                        <i class="bi bi-file-earmark-text" style="color:#34d399"></i>
                    </div>
                    <span style="font-size:0.7rem;color:#4b5563;">ATIVOS</span>
                </div>
                <div style="font-size:2rem; font-weight:800; color:#f9fafb;"><?= $stats['ciots_ativos'] ?></div>
                <div style="font-size:0.8rem; color:#6b7280;">CIOTs Ativos</div>
            </div>
        </div>
    </div>

    <!-- Stats Row 2 -->
    <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
            <div class="stat-card">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="stat-icon" style="background:rgba(251,191,36,0.15)">
                        <i class="bi bi-hourglass-split" style="color:#fbbf24"></i>
                    </div>
                    <span style="font-size:0.7rem;color:#4b5563;">PENDENTE</span>
                </div>
                <div style="font-size:2rem; font-weight:800; color:#f9fafb;"><?= $stats['ciots_pendentes'] ?></div>
                <div style="font-size:0.8rem; color:#6b7280;">CIOTs Pendentes</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-card">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="stat-icon" style="background:rgba(52,211,153,0.15)">
                        <i class="bi bi-cash-coin" style="color:#34d399"></i>
                    </div>
                    <span style="font-size:0.7rem;color:#4b5563;">TOTAL</span>
                </div>
                <div style="font-size:1.4rem; font-weight:800; color:#f9fafb;">R$ <?= number_format($stats['valor_fretes'], 2, ',', '.') ?></div>
                <div style="font-size:0.8rem; color:#6b7280;">Valor em Fretes</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-card">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="stat-icon" style="background:rgba(245,158,11,0.15)">
                        <i class="bi bi-cash-stack" style="color:#f59e0b"></i>
                    </div>
                    <span style="font-size:0.7rem;color:#4b5563;">TOTAL PEF</span>
                </div>
                <div style="font-size:1.4rem; font-weight:800; color:#f9fafb;">R$ <?= number_format($stats['pef_total'], 2, ',', '.') ?></div>
                <div style="font-size:0.8rem; color:#6b7280;">Lançamentos PEF</div>
            </div>
        </div>
        <div class="col-6 col-md-3">
            <div class="stat-card">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="stat-icon" style="background:rgba(59,130,246,0.15)">
                        <i class="bi bi-calendar-month" style="color:#60a5fa"></i>
                    </div>
                    <span style="font-size:0.7rem;color:#4b5563;">MÊS ATUAL</span>
                </div>
                <div style="font-size:1.4rem; font-weight:800; color:#f9fafb;">R$ <?= number_format($stats['pef_mes'], 2, ',', '.') ?></div>
                <div style="font-size:0.8rem; color:#6b7280;">PEF Este Mês</div>
            </div>
        </div>
    </div>

    <!-- Recent Tables -->
    <div class="row g-3">
        <div class="col-12 col-lg-7">
            <div class="table-card">
                <div class="table-card-header">
                    <div style="font-weight:600; color:#f9fafb;"><i class="bi bi-file-earmark-text me-2" style="color:#f59e0b"></i>CIOTs Recentes</div>
                    <a href="ciots.php" class="btn btn-sm btn-accent">Ver todos</a>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Transportador</th>
                                <th>Valor</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($recentCiots)): ?>
                            <tr><td colspan="4" class="text-center text-muted py-3">Nenhum CIOT cadastrado</td></tr>
                            <?php else: foreach ($recentCiots as $c): ?>
                            <tr>
                                <td><span style="font-family:monospace;color:#f59e0b"><?= htmlspecialchars($c['numero']) ?></span></td>
                                <td><?= htmlspecialchars($c['transportador']) ?></td>
                                <td>R$ <?= number_format($c['valor_frete'], 2, ',', '.') ?></td>
                                <td><?= statusBadge($c['status']) ?></td>
                            </tr>
                            <?php endforeach; endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <div class="col-12 col-lg-5">
            <div class="table-card">
                <div class="table-card-header">
                    <div style="font-weight:600; color:#f9fafb;"><i class="bi bi-cash-stack me-2" style="color:#34d399"></i>PEF Recentes</div>
                    <a href="pef.php" class="btn btn-sm btn-accent">Ver todos</a>
                </div>
                <div class="table-responsive">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>CIOT</th>
                                <th>Tipo</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (empty($recentPef)): ?>
                            <tr><td colspan="3" class="text-center text-muted py-3">Nenhum lançamento PEF</td></tr>
                            <?php else: foreach ($recentPef as $p): ?>
                            <tr>
                                <td><span style="font-family:monospace;color:#f59e0b"><?= htmlspecialchars($p['ciot_numero']) ?></span></td>
                                <td><?= statusBadge($p['tipo']) ?></td>
                                <td>R$ <?= number_format($p['valor'], 2, ',', '.') ?></td>
                            </tr>
                            <?php endforeach; endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>
<?php renderFooter(); ?>
