<?php
require_once __DIR__ . '/config.php';

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) {
    header('Location: index.php');
    exit;
}

$pdo    = db();
$errors = [];

// ── Carrega a solicitação ────────────────────────────────────
$stmt = $pdo->prepare("SELECT * FROM solicitacoes WHERE id = ?");
$stmt->execute([$id]);
$sol = $stmt->fetch();

if (!$sol) {
    http_response_code(404);
    die('<p class="text-center mt-5 text-danger">Solicitação não encontrada.</p>');
}

// Só pendente pode ser avaliada
if ($sol['status'] !== 'pendente') {
    header('Location: index.php');
    exit;
}

// ── POST: salva decisão ──────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $gNome    = trim($_POST['gestor_nome']    ?? '');
    $gEmail   = trim($_POST['gestor_email']   ?? '');
    $decisao  = $_POST['decisao']             ?? '';
    $observ   = trim($_POST['observacao']     ?? '');

    if (!$gNome)                                        $errors[] = 'Nome do gestor é obrigatório.';
    if (!filter_var($gEmail, FILTER_VALIDATE_EMAIL))    $errors[] = 'E-mail inválido.';
    if (!in_array($decisao, ['aprovado', 'reprovado'])) $errors[] = 'Decisão inválida.';

    if (empty($errors)) {
        try {
            // Salva aprovação
            $pdo->prepare("
                INSERT INTO aprovacoes (solicitacao_id, gestor_nome, gestor_email, decisao, observacao)
                VALUES (?, ?, ?, ?, ?)
            ")->execute([$id, $gNome, $gEmail, $decisao, $observ ?: null]);

            // Atualiza status da solicitação
            $novoStatus = $decisao; // 'aprovado' ou 'reprovado'
            $pdo->prepare("UPDATE solicitacoes SET status = ? WHERE id = ?")
                ->execute([$novoStatus, $id]);

            header('Location: index.php?msg=aprovado');
            exit;
        } catch (PDOException $e) {
            $errors[] = 'Erro ao salvar: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Aprovação #<?= $id ?> – DiaristaPRO</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<style>
  body { background: #080818; }
  .navbar-custom {
    background: linear-gradient(90deg,#0f0f23,#1a1a3e);
    border-bottom: 1px solid rgba(99,102,241,.4);
  }
  .detail-card {
    background: linear-gradient(135deg,#111827,#1e293b);
    border: 1px solid rgba(99,102,241,.25);
    border-radius: 16px;
  }
  .form-card {
    background: linear-gradient(135deg,#0f172a,#1a2744);
    border: 1px solid rgba(251,191,36,.25);
    border-radius: 16px;
  }
  .form-label  { color:#a5b4fc; font-weight:600; font-size:.85rem; letter-spacing:.03em; }
  .form-control, .form-select {
    background: #111827 !important;
    border-color: rgba(99,102,241,.3) !important;
    color: #e2e8f0 !important;
    border-radius: 10px;
  }
  .form-control:focus, .form-select:focus {
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 3px rgba(99,102,241,.25) !important;
  }
  .info-row { display: flex; gap: .5rem; align-items: baseline; padding: .4rem 0; border-bottom: 1px solid rgba(255,255,255,.05); }
  .info-label { color: #64748b; font-size: .8rem; min-width: 110px; }
  .info-value { color: #e2e8f0; font-size: .9rem; }
  .btn-approve  { background: linear-gradient(90deg,#059669,#10b981); border:none; border-radius:10px; font-weight:700; }
  .btn-reject   { background: linear-gradient(90deg,#dc2626,#ef4444); border:none; border-radius:10px; font-weight:700; }
  .btn-approve:hover, .btn-reject:hover { opacity:.88; transform:translateY(-1px); }
</style>
</head>
<body>

<nav class="navbar navbar-custom">
  <div class="container">
    <a class="navbar-brand fw-bold text-primary" href="index.php">🧹 DiaristaPRO</a>
    <span class="badge bg-warning text-dark fs-6 px-3">QUEST: Aprovação #<?= $id ?></span>
  </div>
</nav>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-9">

      <!-- Step indicator -->
      <div class="d-flex align-items-center gap-3 mb-4">
        <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark"
             style="width:48px;height:48px;background:#f59e0b;font-size:1.3rem">2</div>
        <div>
          <div class="fw-bold text-white fs-5">Avaliação do Gestor</div>
          <div class="text-muted small">Revise a solicitação e registre sua decisão</div>
        </div>
      </div>

      <?php if (!empty($errors)): ?>
      <div class="alert alert-danger rounded-3">
        <strong>⚠️ Corrija os erros abaixo:</strong>
        <ul class="mb-0 mt-2"><?php foreach ($errors as $e): ?>
          <li><?= htmlspecialchars($e) ?></li>
        <?php endforeach; ?></ul>
      </div>
      <?php endif; ?>

      <!-- Detalhes da solicitação -->
      <div class="detail-card p-4 mb-4">
        <h6 class="text-primary fw-bold mb-3">📋 Detalhes da Solicitação</h6>
        <div class="info-row"><span class="info-label">Supervisor</span><span class="info-value fw-semibold"><?= htmlspecialchars($sol['supervisor_nome']) ?></span></div>
        <div class="info-row"><span class="info-label">E-mail</span><span class="info-value"><?= htmlspecialchars($sol['supervisor_email']) ?></span></div>
        <div class="info-row"><span class="info-label">Local</span><span class="info-value"><?= htmlspecialchars($sol['local_servico']) ?></span></div>
        <div class="info-row"><span class="info-label">Data</span><span class="info-value"><?= date('d/m/Y', strtotime($sol['data_servico'])) ?></span></div>
        <div class="info-row"><span class="info-label">Horário</span><span class="info-value"><?= substr($sol['horario_inicio'],0,5) ?> – <?= substr($sol['horario_fim'],0,5) ?></span></div>
        <?php if ($sol['descricao']): ?>
        <div class="info-row"><span class="info-label">Observações</span><span class="info-value"><?= nl2br(htmlspecialchars($sol['descricao'])) ?></span></div>
        <?php endif; ?>
        <div class="info-row"><span class="info-label">Criado em</span><span class="info-value text-muted small"><?= date('d/m/Y H:i', strtotime($sol['criado_em'])) ?></span></div>
      </div>

      <!-- Formulário de aprovação -->
      <div class="form-card p-4 p-md-5">
        <h6 class="text-warning fw-bold mb-4">👔 Registrar Decisão</h6>
        <form method="POST" novalidate>

          <div class="row g-4">
            <div class="col-12 col-md-6">
              <label class="form-label">👤 Nome do Gestor *</label>
              <input type="text" name="gestor_nome" class="form-control"
                     placeholder="Ex: Amanda Costa"
                     value="<?= htmlspecialchars($_POST['gestor_nome'] ?? '') ?>"
                     required maxlength="100">
            </div>
            <div class="col-12 col-md-6">
              <label class="form-label">✉️ E-mail do Gestor *</label>
              <input type="email" name="gestor_email" class="form-control"
                     placeholder="gestor@empresa.com"
                     value="<?= htmlspecialchars($_POST['gestor_email'] ?? '') ?>"
                     required maxlength="150">
            </div>

            <div class="col-12">
              <label class="form-label">📝 Observação (opcional)</label>
              <textarea name="observacao" class="form-control" rows="3"
                        placeholder="Justificativa, ajustes solicitados, etc."
                        maxlength="2000"><?= htmlspecialchars($_POST['observacao'] ?? '') ?></textarea>
            </div>
          </div>

          <!-- Botões de decisão -->
          <div class="mt-4 pt-3" style="border-top:1px solid rgba(251,191,36,.15)">
            <p class="text-muted small mb-3">Selecione sua decisão:</p>
            <div class="d-flex gap-3 flex-wrap">
              <button type="submit" name="decisao" value="aprovado"
                      class="btn btn-approve btn-lg text-white px-5">
                ✅ APROVAR
              </button>
              <button type="submit" name="decisao" value="reprovado"
                      class="btn btn-reject btn-lg text-white px-5">
                ❌ REPROVAR
              </button>
              <a href="index.php" class="btn btn-outline-secondary btn-lg ms-auto">← Voltar</a>
            </div>
          </div>

        </form>
      </div>

    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
