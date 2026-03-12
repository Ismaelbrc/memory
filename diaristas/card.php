<?php
require_once __DIR__ . '/config.php';

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) {
    header('Location: index.php');
    exit;
}

$pdo  = db();
$stmt = $pdo->prepare("
    SELECT s.id, s.supervisor_nome, s.local_servico, s.data_servico,
           s.horario_inicio, s.horario_fim, s.descricao,
           d.nome, d.cpf, d.foto, d.fornecedor_nome, d.fornecedor_email, d.id AS did
    FROM solicitacoes s
    INNER JOIN diaristas d ON d.solicitacao_id = s.id
    WHERE s.id = ? AND s.status = 'concluido'
");
$stmt->execute([$id]);
$row = $stmt->fetch();

if (!$row) {
    http_response_code(404);
    die('<p class="text-center mt-5 text-warning">Card ainda não disponível para esta solicitação.</p>');
}

// Stats deterministicamente baseadas no ID da diarista
mt_srand((int)$row['did'] * 13 + 77);
$stats = [
    ['label' => 'LIMPEZA',      'value' => mt_rand(88, 99), 'color' => '#10b981', 'icon' => '🧹'],
    ['label' => 'ORGANIZAÇÃO',  'value' => mt_rand(85, 98), 'color' => '#06b6d4', 'icon' => '📋'],
    ['label' => 'PONTUALIDADE', 'value' => mt_rand(83, 97), 'color' => '#6366f1', 'icon' => '⏱️'],
    ['label' => 'DEDICAÇÃO',    'value' => mt_rand(90, 99), 'color' => '#ec4899', 'icon' => '⭐'],
];

$dataFmt  = date('d/m/Y', strtotime($row['data_servico']));
$horaFmt  = substr($row['horario_inicio'], 0, 5) . ' – ' . substr($row['horario_fim'], 0, 5);
$fotoUrl  = !empty($row['foto']) ? 'uploads/' . rawurlencode($row['foto']) : '';
?>
<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Card – <?= htmlspecialchars($row['nome']) ?></title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --gold:    #fbbf24;
    --gold2:   #f59e0b;
    --neon:    #6366f1;
    --card-w:  360px;
    --card-h:  570px;
  }
  body { background: radial-gradient(ellipse at center, #0d1424 0%, #040408 100%); min-height: 100vh; }
  .navbar-custom {
    background: linear-gradient(90deg,#0f0f23,#1a1a3e);
    border-bottom: 1px solid rgba(99,102,241,.4);
  }

  /* ── SUPERTRUNFO CARD ─── */
  .st-wrapper {
    display: flex; justify-content: center; align-items: flex-start; padding: 1rem;
  }
  .st-card {
    width: var(--card-w);
    min-height: var(--card-h);
    background: linear-gradient(160deg, #08091a 0%, #0d1635 60%, #0a1020 100%);
    border-radius: 18px;
    border: 3px solid var(--gold);
    box-shadow:
      0 0 0 6px rgba(251,191,36,.12),
      0 0 60px rgba(251,191,36,.2),
      0 30px 80px rgba(0,0,0,.8);
    overflow: hidden;
    position: relative;
    font-family: 'Rajdhani', sans-serif;
  }
  /* Inner border */
  .st-card::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 1px solid rgba(251,191,36,.25);
    border-radius: 13px;
    pointer-events: none;
    z-index: 10;
  }

  /* Header */
  .st-header {
    background: linear-gradient(135deg, #b45309, #f59e0b, #fbbf24, #f59e0b);
    padding: .5rem 1rem .3rem;
    text-align: center;
    position: relative;
  }
  .st-series {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.7rem;
    color: #1c0a00;
    letter-spacing: .1em;
    line-height: 1;
    text-shadow: 0 1px 0 rgba(255,255,255,.3);
  }
  .st-subtitle {
    font-size: .65rem;
    font-weight: 700;
    letter-spacing: .2em;
    color: rgba(28,10,0,.7);
    text-transform: uppercase;
    margin-top: .1rem;
  }

  /* Category band */
  .st-category {
    background: linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8);
    padding: .25rem 1rem;
    text-align: center;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1rem;
    letter-spacing: .15em;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0,0,0,.5);
  }

  /* Photo */
  .st-photo-frame {
    margin: .6rem .6rem 0;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid rgba(251,191,36,.4);
    position: relative;
    aspect-ratio: 3/2.4;
    background: #0a1228;
  }
  .st-photo-frame img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .st-photo-placeholder {
    width: 100%; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #374151; font-size: 3rem; gap: .5rem;
  }
  /* Name overlay */
  .st-name-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, rgba(0,0,0,.92) 0%, transparent 100%);
    padding: 1.2rem .75rem .5rem;
  }
  .st-name {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.35rem;
    color: #fff;
    letter-spacing: .08em;
    line-height: 1.1;
    text-shadow: 0 2px 8px rgba(0,0,0,.8);
  }

  /* Body */
  .st-body {
    padding: .5rem .75rem .75rem;
  }
  .st-cpf {
    font-size: .7rem;
    color: #64748b;
    letter-spacing: .1em;
    text-align: center;
    margin-bottom: .4rem;
  }
  .st-divider {
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold2), transparent);
    margin: .4rem 0;
  }

  /* Stats */
  .st-stat-row {
    display: flex; align-items: center; gap: .5rem;
    margin-bottom: .3rem;
  }
  .st-stat-label {
    font-size: .65rem; font-weight: 700; letter-spacing: .08em;
    color: #94a3b8; min-width: 80px; text-transform: uppercase;
  }
  .st-stat-bar {
    flex: 1; height: 8px;
    background: rgba(255,255,255,.06);
    border-radius: 99px; overflow: hidden;
  }
  .st-stat-fill {
    height: 100%; border-radius: 99px;
    transition: width .8s cubic-bezier(.4,0,.2,1);
  }
  .st-stat-val {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.1rem; color: #fff; min-width: 28px; text-align: right;
  }

  /* Footer */
  .st-footer {
    padding: .4rem .75rem .6rem;
    border-top: 1px solid rgba(251,191,36,.1);
  }
  .st-detail-line {
    font-size: .65rem; color: #64748b; line-height: 1.6;
    display: flex; gap: .4rem; align-items: center;
  }
  .st-detail-line span { color: #94a3b8; }
  .st-stars {
    text-align: center;
    font-size: .75rem;
    color: var(--gold);
    letter-spacing: .2em;
    margin-top: .4rem;
    text-shadow: 0 0 8px rgba(251,191,36,.5);
  }

  /* Particles / glow effect */
  .glow-dot {
    position: absolute; border-radius: 50%;
    background: radial-gradient(circle, var(--gold) 0%, transparent 70%);
    opacity: .08; pointer-events: none;
  }

  /* ── SIDE PANEL ─── */
  .side-panel { max-width: 340px; }
  .action-card {
    background: linear-gradient(135deg,#111827,#1e293b);
    border: 1px solid rgba(99,102,241,.25);
    border-radius: 16px;
  }
  .btn-dl-png {
    background: linear-gradient(90deg,#6366f1,#8b5cf6);
    border:none; border-radius:10px; font-weight:700;
    width:100%; padding:.65rem; font-size:.95rem;
    transition: opacity .2s, transform .15s;
  }
  .btn-dl-png:hover { opacity:.9; transform:translateY(-2px); }
  .btn-dl-server {
    background: rgba(99,102,241,.15);
    border: 1px solid rgba(99,102,241,.3);
    border-radius:10px; font-weight:600;
    width:100%; padding:.6rem; font-size:.9rem; color:#a5b4fc;
    transition: background .2s;
  }
  .btn-dl-server:hover { background: rgba(99,102,241,.25); }
  .share-input {
    background:#111827 !important; border-color:rgba(99,102,241,.3) !important;
    color:#e2e8f0 !important; border-radius:8px 0 0 8px; font-size:.8rem;
  }
  .copy-btn { border-radius:0 8px 8px 0; border-color:rgba(99,102,241,.3); font-size:.8rem; }
  .loading-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,.7);
    display:none; align-items:center; justify-content:center;
    z-index:9999; flex-direction:column; gap:1rem;
  }
  .spinner { width:50px;height:50px; border:4px solid rgba(99,102,241,.3); border-top-color:#6366f1; border-radius:50%; animation:spin 1s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }
</style>
</head>
<body>

<div class="loading-overlay" id="loadingOverlay">
  <div class="spinner"></div>
  <div class="text-white fw-semibold">Gerando PNG…</div>
</div>

<nav class="navbar navbar-custom">
  <div class="container">
    <a class="navbar-brand fw-bold text-primary" href="index.php">🧹 DiaristaPRO</a>
    <span class="badge bg-info text-dark fs-6 px-3">🃏 Card Gerado!</span>
  </div>
</nav>

<div class="container py-4">

  <!-- Step indicator -->
  <div class="d-flex align-items-center gap-3 mb-4">
    <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark"
         style="width:48px;height:48px;background:#06b6d4;font-size:1.3rem">4</div>
    <div>
      <div class="fw-bold text-white fs-5">Card Compartilhável</div>
      <div class="text-muted small">Baixe ou compartilhe o card Super Trunfo da diarista</div>
    </div>
  </div>

  <div class="row g-4 justify-content-center">

    <!-- ── CARD ───────────────────────────────────────────── -->
    <div class="col-auto">
      <div class="st-wrapper">
        <div class="st-card" id="cardToCapture">

          <!-- Glow decorations -->
          <div class="glow-dot" style="width:200px;height:200px;top:-80px;right:-60px"></div>
          <div class="glow-dot" style="width:150px;height:150px;bottom:-60px;left:-40px"></div>

          <!-- Header -->
          <div class="st-header">
            <div class="st-series">⭐ SUPER TRUNFO ⭐</div>
            <div class="st-subtitle">Diaristas Profissionais</div>
          </div>

          <!-- Category -->
          <div class="st-category">✨ LIMPEZA &amp; ORGANIZAÇÃO ✨</div>

          <!-- Photo -->
          <div class="st-photo-frame">
            <?php if ($fotoUrl): ?>
              <img src="<?= htmlspecialchars($fotoUrl) ?>"
                   alt="<?= htmlspecialchars($row['nome']) ?>"
                   crossorigin="anonymous">
            <?php else: ?>
              <div class="st-photo-placeholder">
                <span>🧹</span>
                <span style="font-size:.9rem;color:#374151">Sem Foto</span>
              </div>
            <?php endif; ?>
            <div class="st-name-overlay">
              <div class="st-name"><?= htmlspecialchars(strtoupper($row['nome'])) ?></div>
            </div>
          </div>

          <!-- Body -->
          <div class="st-body">
            <div class="st-cpf">CPF: <?= htmlspecialchars(formatCPF($row['cpf'])) ?></div>
            <div class="st-divider"></div>

            <!-- Stats -->
            <?php foreach ($stats as $s): ?>
            <div class="st-stat-row">
              <div class="st-stat-label"><?= $s['icon'] ?> <?= $s['label'] ?></div>
              <div class="st-stat-bar">
                <div class="st-stat-fill" style="width:<?= $s['value'] ?>%;background:<?= $s['color'] ?>"></div>
              </div>
              <div class="st-stat-val"><?= $s['value'] ?></div>
            </div>
            <?php endforeach; ?>
          </div>

          <!-- Footer -->
          <div class="st-footer">
            <div class="st-divider"></div>
            <div class="st-detail-line">📍 <span><?= htmlspecialchars(mb_strimwidth($row['local_servico'], 0, 38, '..')) ?></span></div>
            <div class="st-detail-line">📅 <span><?= $dataFmt ?></span> &nbsp; ⏰ <span><?= $horaFmt ?></span></div>
            <div class="st-detail-line">🏢 <span><?= htmlspecialchars(mb_strimwidth($row['fornecedor_nome'], 0, 30, '..')) ?></span></div>
            <div class="st-stars">★ ★ ★ ★ ★</div>
          </div>
        </div><!-- /st-card -->
      </div>
    </div>

    <!-- ── PAINEL LATERAL ─────────────────────────────────── -->
    <div class="col-12 col-md-auto side-panel">

      <div class="action-card p-4 mb-3">
        <h6 class="text-white fw-bold mb-3">📥 Baixar Card</h6>

        <button class="btn-dl-png btn text-white mb-3" onclick="downloadPNG()">
          📸 Download PNG (Alta Qualidade)
        </button>

        <a href="card_image.php?id=<?= $id ?>" target="_blank"
           class="btn btn-dl-server text-decoration-none d-block text-center">
          🖼️ Abrir PNG (Servidor)
        </a>

        <p class="text-muted small mt-2 mb-0">
          O PNG é gerado com html2canvas (alta fidelidade) ou pelo servidor como fallback.
        </p>
      </div>

      <div class="action-card p-4 mb-3">
        <h6 class="text-white fw-bold mb-3">🔗 Compartilhar Link</h6>
        <div class="input-group">
          <input type="text" class="form-control share-input" id="shareUrl"
                 value="<?= htmlspecialchars('http://' . ($_SERVER['HTTP_HOST'] ?? '') . $_SERVER['REQUEST_URI']) ?>"
                 readonly>
          <button class="btn btn-outline-secondary copy-btn" onclick="copyLink()">Copiar</button>
        </div>
        <p class="text-muted small mt-2 mb-0" id="copyMsg"></p>
      </div>

      <div class="action-card p-4">
        <h6 class="text-white fw-bold mb-3">📋 Resumo</h6>
        <div style="font-size:.82rem">
          <div class="d-flex justify-content-between py-1" style="border-bottom:1px solid rgba(255,255,255,.05)">
            <span class="text-muted">Diarista</span>
            <span class="text-white fw-semibold"><?= htmlspecialchars($row['nome']) ?></span>
          </div>
          <div class="d-flex justify-content-between py-1" style="border-bottom:1px solid rgba(255,255,255,.05)">
            <span class="text-muted">CPF</span>
            <span class="text-white"><?= htmlspecialchars(formatCPF($row['cpf'])) ?></span>
          </div>
          <div class="d-flex justify-content-between py-1" style="border-bottom:1px solid rgba(255,255,255,.05)">
            <span class="text-muted">Data</span>
            <span class="text-white"><?= $dataFmt ?></span>
          </div>
          <div class="d-flex justify-content-between py-1" style="border-bottom:1px solid rgba(255,255,255,.05)">
            <span class="text-muted">Horário</span>
            <span class="text-white"><?= $horaFmt ?></span>
          </div>
          <div class="d-flex justify-content-between py-1">
            <span class="text-muted">Fornecedor</span>
            <span class="text-white"><?= htmlspecialchars(mb_strimwidth($row['fornecedor_nome'], 0, 20, '..')) ?></span>
          </div>
        </div>
      </div>

      <a href="index.php" class="btn btn-outline-secondary mt-3 w-100 rounded-3">← Voltar ao Dashboard</a>
    </div>
  </div>
</div>

<!-- html2canvas -->
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
function downloadPNG() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.style.display = 'flex';

  const card = document.getElementById('cardToCapture');
  html2canvas(card, {
    scale: 3,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
  }).then(canvas => {
    overlay.style.display = 'none';
    const link = document.createElement('a');
    link.download = 'diarista_card_<?= $id ?>.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }).catch(err => {
    overlay.style.display = 'none';
    alert('Erro ao gerar PNG. Use o botão "Abrir PNG (Servidor)" como alternativa.');
    console.error(err);
  });
}

function copyLink() {
  const input = document.getElementById('shareUrl');
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(input.value).then(() => {
    document.getElementById('copyMsg').textContent = '✅ Link copiado!';
    setTimeout(() => document.getElementById('copyMsg').textContent = '', 3000);
  });
}
</script>
</body>
</html>
