<?php
require_once __DIR__ . '/config.php';

$pdo = db();

// ── Estatísticas ─────────────────────────────────────────────
$stats = $pdo->query("
    SELECT
        COUNT(*)                        AS total,
        SUM(status = 'pendente')        AS pendente,
        SUM(status = 'aprovado')        AS aprovado,
        SUM(status = 'reprovado')       AS reprovado,
        SUM(status = 'concluido')       AS concluido
    FROM solicitacoes
")->fetch();

// ── Lista completa ───────────────────────────────────────────
$solicitacoes = $pdo->query("
    SELECT  s.*,
            a.gestor_nome,
            d.nome  AS diarista_nome,
            d.id    AS diarista_id
    FROM solicitacoes s
    LEFT JOIN aprovacoes a ON a.solicitacao_id = s.id
    LEFT JOIN diaristas  d ON d.solicitacao_id = s.id
    ORDER BY s.criado_em DESC
")->fetchAll();

$msg = $_GET['msg'] ?? '';
?>
<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sistema de Diaristas</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<style>
  :root {
    --neon: #6366f1;
    --gold: #fbbf24;
  }
  body { background: #080818; }
  .navbar-custom {
    background: linear-gradient(90deg, #0f0f23, #1a1a3e);
    border-bottom: 1px solid rgba(99,102,241,.4);
    box-shadow: 0 2px 20px rgba(99,102,241,.2);
  }
  .brand-glow { color: var(--neon); text-shadow: 0 0 20px rgba(99,102,241,.8); }
  .stat-card {
    background: linear-gradient(135deg, #111827, #1e293b);
    border: 1px solid rgba(99,102,241,.25);
    border-radius: 16px;
    transition: transform .2s, box-shadow .2s;
  }
  .stat-card:hover { transform: translateY(-6px); box-shadow: 0 8px 30px rgba(99,102,241,.3); }
  .stat-icon { font-size: 2.2rem; }
  .stat-number { font-size: 2.8rem; font-weight: 900; line-height: 1; }
  .table-dark { --bs-table-bg: #0f172a; }
  .table-dark tbody tr:hover { background: rgba(99,102,241,.08) !important; }
  .step-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: .75rem; padding: .3rem .6rem; border-radius: 999px;
  }
  .kanban-col {
    background: #111827;
    border: 1px solid rgba(99,102,241,.2);
    border-radius: 12px;
    min-height: 200px;
  }
  .kanban-col-header {
    padding: .6rem 1rem;
    border-radius: 12px 12px 0 0;
    font-weight: 700;
    font-size: .85rem;
    letter-spacing: .05em;
  }
  .kanban-card {
    background: #1e293b;
    border: 1px solid rgba(255,255,255,.06);
    border-radius: 8px;
    font-size: .85rem;
    transition: transform .15s;
  }
  .kanban-card:hover { transform: scale(1.02); }
  .alert-flash {
    border: none;
    background: linear-gradient(90deg, #064e3b, #0f4c81);
    border-left: 4px solid #10b981;
  }
</style>
</head>
<body>

<!-- NAV -->
<nav class="navbar navbar-custom navbar-expand-lg">
  <div class="container-fluid px-4">
    <a class="navbar-brand fw-bold brand-glow fs-5" href="index.php">🧹 DiaristaPRO</a>
    <div class="d-flex gap-2">
      <a href="supervisor.php" class="btn btn-sm btn-outline-primary">
        ＋ Nova Solicitação
      </a>
    </div>
  </div>
</nav>

<div class="container-xl py-4">

  <?php if ($msg === 'solicitacao_criada'): ?>
  <div class="alert alert-flash text-white mb-4">
    ✅ Solicitação criada com sucesso! Aguardando aprovação do gestor.
  </div>
  <?php elseif ($msg === 'aprovado'): ?>
  <div class="alert alert-flash text-white mb-4">
    ✅ Decisão registrada! Solicitação encaminhada ao fornecedor.
  </div>
  <?php elseif ($msg === 'concluido'): ?>
  <div class="alert alert-flash text-white mb-4">
    🏆 Dados do diarista salvos! O card foi gerado com sucesso.
  </div>
  <?php endif; ?>

  <!-- ── FLUXO GAMIFICADO ─────────────────────────────────── -->
  <div class="d-flex align-items-center gap-2 mb-4 flex-wrap">
    <span class="badge bg-warning text-dark px-3 py-2 fs-6">1 Supervisor</span>
    <span class="text-muted">→</span>
    <span class="badge bg-success px-3 py-2 fs-6">2 Gestor</span>
    <span class="text-muted">→</span>
    <span class="badge bg-primary px-3 py-2 fs-6">3 Fornecedor</span>
    <span class="text-muted">→</span>
    <span class="badge bg-info text-dark px-3 py-2 fs-6">4 Card Gerado 🃏</span>
  </div>

  <!-- ── STATS ─────────────────────────────────────────────── -->
  <div class="row g-3 mb-4">
    <?php
    $cards = [
      ['label' => 'Total',      'val' => $stats['total'],      'color' => '#6366f1', 'icon' => '📊'],
      ['label' => 'Pendentes',  'val' => $stats['pendente'],   'color' => '#f59e0b', 'icon' => '⏳'],
      ['label' => 'Aprovados',  'val' => $stats['aprovado'],   'color' => '#10b981', 'icon' => '✅'],
      ['label' => 'Reprovados', 'val' => $stats['reprovado'],  'color' => '#ef4444', 'icon' => '❌'],
      ['label' => 'Concluídos', 'val' => $stats['concluido'],  'color' => '#06b6d4', 'icon' => '🏆'],
    ];
    foreach ($cards as $c): ?>
    <div class="col-6 col-sm-4 col-lg">
      <div class="stat-card p-3 text-center h-100">
        <div class="stat-icon"><?= $c['icon'] ?></div>
        <div class="stat-number mt-1" style="color:<?= $c['color'] ?>"><?= (int)($c['val'] ?? 0) ?></div>
        <div class="text-muted small mt-1"><?= $c['label'] ?></div>
      </div>
    </div>
    <?php endforeach; ?>
  </div>

  <!-- ── KANBAN ─────────────────────────────────────────────── -->
  <div class="row g-3 mb-4">
    <?php
    $cols = [
      ['key' => 'pendente',  'label' => '⏳ Pendentes',  'color' => '#d97706'],
      ['key' => 'aprovado',  'label' => '✅ Aprovados',  'color' => '#059669'],
      ['key' => 'reprovado', 'label' => '❌ Reprovados', 'color' => '#dc2626'],
      ['key' => 'concluido', 'label' => '🏆 Concluídos', 'color' => '#0891b2'],
    ];
    foreach ($cols as $col):
      $items = array_filter($solicitacoes, fn($s) => $s['status'] === $col['key']);
    ?>
    <div class="col-12 col-md-6 col-xl-3">
      <div class="kanban-col">
        <div class="kanban-col-header" style="background:<?= $col['color'] ?>22; color:<?= $col['color'] ?>; border-bottom:2px solid <?= $col['color'] ?>44">
          <?= $col['label'] ?> <span class="badge" style="background:<?= $col['color'] ?>"><?= count($items) ?></span>
        </div>
        <div class="p-2 d-flex flex-column gap-2">
          <?php if (empty($items)): ?>
          <p class="text-muted text-center small py-3 mb-0">Nenhuma</p>
          <?php endif; ?>
          <?php foreach ($items as $s): ?>
          <div class="kanban-card p-2">
            <div class="fw-semibold text-white">#<?= $s['id'] ?> <?= htmlspecialchars($s['supervisor_nome']) ?></div>
            <div class="text-muted" style="font-size:.75rem">
              📍 <?= htmlspecialchars(mb_strimwidth($s['local_servico'], 0, 28, '..')) ?><br>
              📅 <?= date('d/m/Y', strtotime($s['data_servico'])) ?>
            </div>
            <div class="mt-1">
              <?php if ($s['status'] === 'pendente'): ?>
                <a href="gestor.php?id=<?= $s['id'] ?>" class="btn btn-warning btn-sm w-100" style="font-size:.75rem">👔 Avaliar</a>
              <?php elseif ($s['status'] === 'aprovado'): ?>
                <a href="fornecedor.php?id=<?= $s['id'] ?>" class="btn btn-success btn-sm w-100" style="font-size:.75rem">📝 Preencher</a>
              <?php elseif ($s['status'] === 'concluido'): ?>
                <a href="card.php?id=<?= $s['id'] ?>" class="btn btn-info btn-sm w-100 text-dark" style="font-size:.75rem">🃏 Ver Card</a>
              <?php else: ?>
                <span class="text-danger small">Reprovado</span>
              <?php endif; ?>
            </div>
          </div>
          <?php endforeach; ?>
        </div>
      </div>
    </div>
    <?php endforeach; ?>
  </div>

  <!-- ── TABELA COMPLETA ───────────────────────────────────── -->
  <div class="card" style="background:#0f172a; border-color:rgba(99,102,241,.2);">
    <div class="card-header d-flex justify-content-between align-items-center" style="border-color:rgba(99,102,241,.2)">
      <h6 class="mb-0 text-white">📋 Todas as Solicitações</h6>
    </div>
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-dark table-hover align-middle mb-0">
          <thead style="background:#1e293b">
            <tr>
              <th class="ps-3">#</th>
              <th>Supervisor</th>
              <th>Local / Data</th>
              <th>Horário</th>
              <th>Status</th>
              <th>Diarista</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            <?php if (empty($solicitacoes)): ?>
            <tr>
              <td colspan="7" class="text-center text-muted py-5">
                Nenhuma solicitação ainda.
                <a href="supervisor.php" class="text-primary">Criar a primeira!</a>
              </td>
            </tr>
            <?php else: ?>
            <?php foreach ($solicitacoes as $s): ?>
            <tr>
              <td class="ps-3">
                <span class="badge bg-secondary">#<?= $s['id'] ?></span>
              </td>
              <td>
                <div class="fw-semibold"><?= htmlspecialchars($s['supervisor_nome']) ?></div>
                <div class="text-muted small"><?= htmlspecialchars($s['supervisor_email']) ?></div>
              </td>
              <td>
                <div><?= htmlspecialchars(mb_strimwidth($s['local_servico'], 0, 30, '..')) ?></div>
                <div class="text-muted small"><?= date('d/m/Y', strtotime($s['data_servico'])) ?></div>
              </td>
              <td class="text-muted small">
                <?= substr($s['horario_inicio'], 0, 5) ?> – <?= substr($s['horario_fim'], 0, 5) ?>
              </td>
              <td><?= statusBadge($s['status']) ?></td>
              <td>
                <?php if ($s['diarista_nome']): ?>
                  <span class="text-success fw-semibold small"><?= htmlspecialchars($s['diarista_nome']) ?></span>
                <?php else: ?>
                  <span class="text-muted small">—</span>
                <?php endif; ?>
              </td>
              <td>
                <?php if ($s['status'] === 'pendente'): ?>
                  <a href="gestor.php?id=<?= $s['id'] ?>" class="btn btn-warning btn-sm">👔 Avaliar</a>
                <?php elseif ($s['status'] === 'aprovado'): ?>
                  <a href="fornecedor.php?id=<?= $s['id'] ?>" class="btn btn-success btn-sm">📝 Preencher</a>
                <?php elseif ($s['status'] === 'concluido'): ?>
                  <a href="card.php?id=<?= $s['id'] ?>" class="btn btn-info btn-sm text-dark">🃏 Card</a>
                <?php else: ?>
                  <span class="text-danger small">—</span>
                <?php endif; ?>
              </td>
            </tr>
            <?php endforeach; ?>
            <?php endif; ?>
          </tbody>
        </table>
      </div>
    </div>
  </div>

</div><!-- /container -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
