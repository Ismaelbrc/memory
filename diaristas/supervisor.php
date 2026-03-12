<?php
require_once __DIR__ . '/config.php';

$errors  = [];
$success = false;

// ── POST: salva solicitação ──────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nome  = trim($_POST['supervisor_nome']  ?? '');
    $email = trim($_POST['supervisor_email'] ?? '');
    $local = trim($_POST['local_servico']    ?? '');
    $data  = $_POST['data_servico']          ?? '';
    $hi    = $_POST['horario_inicio']        ?? '';
    $hf    = $_POST['horario_fim']           ?? '';
    $desc  = trim($_POST['descricao']        ?? '');

    if (!$nome)                                          $errors[] = 'Nome do supervisor é obrigatório.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))      $errors[] = 'E-mail inválido.';
    if (!$local)                                         $errors[] = 'Local do serviço é obrigatório.';
    if (!$data || !strtotime($data))                     $errors[] = 'Data inválida.';
    if (!$hi)                                            $errors[] = 'Horário de início obrigatório.';
    if (!$hf)                                            $errors[] = 'Horário de fim obrigatório.';
    if ($hi && $hf && $hf <= $hi)                        $errors[] = 'Horário de fim deve ser após o início.';

    if (empty($errors)) {
        try {
            $stmt = db()->prepare("
                INSERT INTO solicitacoes
                    (supervisor_nome, supervisor_email, local_servico,
                     data_servico, horario_inicio, horario_fim, descricao)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([$nome, $email, $local, $data, $hi, $hf, $desc ?: null]);
            header('Location: index.php?msg=solicitacao_criada');
            exit;
        } catch (PDOException $e) {
            $errors[] = 'Erro ao salvar no banco: ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Nova Solicitação – DiaristaPRO</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<style>
  body { background: #080818; }
  .navbar-custom {
    background: linear-gradient(90deg,#0f0f23,#1a1a3e);
    border-bottom: 1px solid rgba(99,102,241,.4);
  }
  .form-card {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    border: 1px solid rgba(99,102,241,.3);
    border-radius: 20px;
    box-shadow: 0 0 40px rgba(99,102,241,.15);
  }
  .form-label { color: #a5b4fc; font-weight: 600; font-size: .85rem; letter-spacing: .03em; }
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
  .quest-badge {
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 999px;
    padding: .4rem 1.2rem;
    font-size: .8rem;
    font-weight: 700;
    letter-spacing: .05em;
  }
  .btn-submit {
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 1rem;
    padding: .75rem 2rem;
    transition: opacity .2s, transform .15s;
  }
  .btn-submit:hover { opacity: .9; transform: translateY(-2px); }
</style>
</head>
<body>

<nav class="navbar navbar-custom">
  <div class="container">
    <a class="navbar-brand fw-bold text-primary" href="index.php">🧹 DiaristaPRO</a>
    <span class="quest-badge text-white">QUEST: Nova Solicitação</span>
  </div>
</nav>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-8">

      <!-- Step indicator -->
      <div class="d-flex align-items-center gap-3 mb-4">
        <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold"
             style="width:48px;height:48px;background:#6366f1;font-size:1.3rem">1</div>
        <div>
          <div class="fw-bold text-white fs-5">Solicitação do Supervisor</div>
          <div class="text-muted small">Preencha os dados para solicitar a diarista</div>
        </div>
      </div>

      <?php if (!empty($errors)): ?>
      <div class="alert alert-danger rounded-3">
        <strong>⚠️ Corrija os erros abaixo:</strong>
        <ul class="mb-0 mt-2">
          <?php foreach ($errors as $e): ?>
          <li><?= htmlspecialchars($e) ?></li>
          <?php endforeach; ?>
        </ul>
      </div>
      <?php endif; ?>

      <div class="form-card p-4 p-md-5">
        <form method="POST" novalidate>

          <div class="row g-4">
            <!-- Supervisor nome -->
            <div class="col-12 col-md-6">
              <label class="form-label">👤 Nome do Supervisor *</label>
              <input type="text" name="supervisor_nome" class="form-control"
                     placeholder="Ex: Carlos Mendes"
                     value="<?= htmlspecialchars($_POST['supervisor_nome'] ?? '') ?>"
                     required maxlength="100">
            </div>

            <!-- Supervisor email -->
            <div class="col-12 col-md-6">
              <label class="form-label">✉️ E-mail do Supervisor *</label>
              <input type="email" name="supervisor_email" class="form-control"
                     placeholder="supervisor@empresa.com"
                     value="<?= htmlspecialchars($_POST['supervisor_email'] ?? '') ?>"
                     required maxlength="150">
            </div>

            <!-- Local -->
            <div class="col-12">
              <label class="form-label">📍 Local do Serviço *</label>
              <input type="text" name="local_servico" class="form-control"
                     placeholder="Ex: Sala de Reuniões – Andar 3, Bloco B"
                     value="<?= htmlspecialchars($_POST['local_servico'] ?? '') ?>"
                     required maxlength="200">
            </div>

            <!-- Data -->
            <div class="col-12 col-md-4">
              <label class="form-label">📅 Data do Serviço *</label>
              <input type="date" name="data_servico" class="form-control"
                     value="<?= htmlspecialchars($_POST['data_servico'] ?? '') ?>"
                     min="<?= date('Y-m-d') ?>" required>
            </div>

            <!-- Horário início -->
            <div class="col-12 col-md-4">
              <label class="form-label">⏰ Horário de Início *</label>
              <input type="time" name="horario_inicio" class="form-control"
                     value="<?= htmlspecialchars($_POST['horario_inicio'] ?? '') ?>"
                     required>
            </div>

            <!-- Horário fim -->
            <div class="col-12 col-md-4">
              <label class="form-label">⏰ Horário de Fim *</label>
              <input type="time" name="horario_fim" class="form-control"
                     value="<?= htmlspecialchars($_POST['horario_fim'] ?? '') ?>"
                     required>
            </div>

            <!-- Descrição -->
            <div class="col-12">
              <label class="form-label">📝 Observações / Descrição</label>
              <textarea name="descricao" class="form-control" rows="4"
                        placeholder="Descreva o serviço, áreas específicas, materiais necessários…"
                        maxlength="2000"><?= htmlspecialchars($_POST['descricao'] ?? '') ?></textarea>
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-4 pt-3"
               style="border-top:1px solid rgba(99,102,241,.2)">
            <a href="index.php" class="btn btn-outline-secondary rounded-3">← Voltar</a>
            <button type="submit" class="btn-submit btn btn-primary text-white">
              🚀 Enviar Solicitação
            </button>
          </div>

        </form>
      </div>

    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
