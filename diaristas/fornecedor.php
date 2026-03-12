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
$stmt = $pdo->prepare("
    SELECT s.*, a.gestor_nome, a.decisao, a.observacao AS gestor_obs
    FROM solicitacoes s
    LEFT JOIN aprovacoes a ON a.solicitacao_id = s.id
    WHERE s.id = ?
");
$stmt->execute([$id]);
$sol = $stmt->fetch();

if (!$sol || $sol['status'] !== 'aprovado') {
    header('Location: index.php');
    exit;
}

// ── POST: salva dados do diarista ────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $dNome      = trim($_POST['diarista_nome']     ?? '');
    $dCPF       = trim($_POST['cpf']               ?? '');
    $fNome      = trim($_POST['fornecedor_nome']   ?? '');
    $fEmail     = trim($_POST['fornecedor_email']  ?? '');

    if (!$dNome)                                        $errors[] = 'Nome da diarista é obrigatório.';
    if (!validaCPF($dCPF))                              $errors[] = 'CPF inválido.';
    if (!$fNome)                                        $errors[] = 'Nome do fornecedor é obrigatório.';
    if ($fEmail && !filter_var($fEmail, FILTER_VALIDATE_EMAIL)) $errors[] = 'E-mail do fornecedor inválido.';

    // Upload de foto
    $fotoNome = null;
    if (isset($_FILES['foto']) && $_FILES['foto']['error'] === UPLOAD_ERR_OK) {
        $tmpPath  = $_FILES['foto']['tmp_name'];
        $origName = $_FILES['foto']['name'];
        $ext      = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
            $errors[] = 'Formato de imagem inválido. Use JPG, PNG, GIF ou WEBP.';
        } elseif ($_FILES['foto']['size'] > 5 * 1024 * 1024) {
            $errors[] = 'Imagem muito grande. Máximo 5 MB.';
        } else {
            $fotoNome = 'foto_' . $id . '_' . time() . '.' . $ext;
            if (!move_uploaded_file($tmpPath, UPLOAD_DIR . $fotoNome)) {
                $errors[] = 'Falha ao salvar imagem. Verifique as permissões do diretório.';
                $fotoNome = null;
            }
        }
    } else {
        $errors[] = 'Foto da diarista é obrigatória.';
    }

    if (empty($errors)) {
        try {
            $pdo->prepare("
                INSERT INTO diaristas
                    (solicitacao_id, nome, cpf, foto, fornecedor_nome, fornecedor_email)
                VALUES (?, ?, ?, ?, ?, ?)
            ")->execute([
                $id,
                $dNome,
                formatCPF($dCPF),
                $fotoNome,
                $fNome,
                $fEmail ?: null,
            ]);

            $pdo->prepare("UPDATE solicitacoes SET status = 'concluido' WHERE id = ?")
                ->execute([$id]);

            header('Location: card.php?id=' . $id);
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
<title>Dados da Diarista #<?= $id ?> – DiaristaPRO</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<style>
  body { background: #080818; }
  .navbar-custom {
    background: linear-gradient(90deg,#0f0f23,#1a1a3e);
    border-bottom: 1px solid rgba(99,102,241,.4);
  }
  .detail-card {
    background: linear-gradient(135deg,#111827,#1e293b);
    border: 1px solid rgba(16,185,129,.25);
    border-radius: 16px;
  }
  .form-card {
    background: linear-gradient(135deg,#0f172a,#14271f);
    border: 1px solid rgba(16,185,129,.3);
    border-radius: 16px;
    box-shadow: 0 0 40px rgba(16,185,129,.1);
  }
  .form-label  { color: #6ee7b7; font-weight:600; font-size:.85rem; letter-spacing:.03em; }
  .form-control, .form-select {
    background: #111827 !important;
    border-color: rgba(16,185,129,.3) !important;
    color: #e2e8f0 !important;
    border-radius: 10px;
  }
  .form-control:focus {
    border-color: #10b981 !important;
    box-shadow: 0 0 0 3px rgba(16,185,129,.25) !important;
  }
  .info-row { display:flex; gap:.5rem; align-items:baseline; padding:.4rem 0; border-bottom:1px solid rgba(255,255,255,.05); }
  .info-label { color:#64748b; font-size:.8rem; min-width:110px; }
  .info-value { color:#e2e8f0; font-size:.9rem; }
  .drop-zone {
    border: 2px dashed rgba(16,185,129,.4);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: border-color .2s, background .2s;
    position: relative;
  }
  .drop-zone:hover { border-color: #10b981; background: rgba(16,185,129,.05); }
  .drop-zone input[type=file] {
    position: absolute; inset: 0; opacity: 0; cursor: pointer; width:100%; height:100%;
  }
  #preview-img { max-height: 180px; border-radius: 10px; object-fit: cover; display:none; }
  .btn-submit {
    background: linear-gradient(90deg,#059669,#10b981);
    border:none; border-radius:12px; font-weight:700; font-size:1rem;
    padding:.75rem 2rem; transition:opacity .2s,transform .15s;
  }
  .btn-submit:hover { opacity:.9; transform:translateY(-2px); }
  /* Máscara CPF */
  input[name=cpf] { letter-spacing: .05em; }
</style>
</head>
<body>

<nav class="navbar navbar-custom">
  <div class="container">
    <a class="navbar-brand fw-bold text-primary" href="index.php">🧹 DiaristaPRO</a>
    <span class="badge bg-success fs-6 px-3">QUEST: Dados da Diarista #<?= $id ?></span>
  </div>
</nav>

<div class="container py-5">
  <div class="row justify-content-center">
    <div class="col-12 col-lg-9">

      <!-- Step indicator -->
      <div class="d-flex align-items-center gap-3 mb-4">
        <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark"
             style="width:48px;height:48px;background:#10b981;font-size:1.3rem">3</div>
        <div>
          <div class="fw-bold text-white fs-5">Dados do Fornecedor</div>
          <div class="text-muted small">Informe os dados da diarista que irá atender</div>
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

      <!-- Detalhes -->
      <div class="detail-card p-4 mb-4">
        <h6 class="text-success fw-bold mb-3">📋 Solicitação Aprovada</h6>
        <div class="info-row"><span class="info-label">Supervisor</span><span class="info-value"><?= htmlspecialchars($sol['supervisor_nome']) ?></span></div>
        <div class="info-row"><span class="info-label">Local</span><span class="info-value"><?= htmlspecialchars($sol['local_servico']) ?></span></div>
        <div class="info-row"><span class="info-label">Data</span><span class="info-value"><?= date('d/m/Y', strtotime($sol['data_servico'])) ?></span></div>
        <div class="info-row"><span class="info-label">Horário</span><span class="info-value"><?= substr($sol['horario_inicio'],0,5) ?> – <?= substr($sol['horario_fim'],0,5) ?></span></div>
        <?php if ($sol['gestor_nome']): ?>
        <div class="info-row"><span class="info-label">Aprovado por</span><span class="info-value text-success"><?= htmlspecialchars($sol['gestor_nome']) ?></span></div>
        <?php endif; ?>
        <?php if ($sol['gestor_obs']): ?>
        <div class="info-row"><span class="info-label">Obs. Gestor</span><span class="info-value text-muted"><?= htmlspecialchars($sol['gestor_obs']) ?></span></div>
        <?php endif; ?>
      </div>

      <!-- Formulário -->
      <div class="form-card p-4 p-md-5">
        <h6 class="fw-bold mb-4" style="color:#6ee7b7">🧹 Dados da Diarista</h6>
        <form method="POST" enctype="multipart/form-data" novalidate>

          <div class="row g-4">
            <!-- Nome da diarista -->
            <div class="col-12 col-md-7">
              <label class="form-label">👤 Nome Completo da Diarista *</label>
              <input type="text" name="diarista_nome" class="form-control"
                     placeholder="Ex: Maria dos Santos"
                     value="<?= htmlspecialchars($_POST['diarista_nome'] ?? '') ?>"
                     required maxlength="150">
            </div>

            <!-- CPF -->
            <div class="col-12 col-md-5">
              <label class="form-label">🪪 CPF da Diarista *</label>
              <input type="text" name="cpf" id="cpf" class="form-control"
                     placeholder="000.000.000-00"
                     value="<?= htmlspecialchars($_POST['cpf'] ?? '') ?>"
                     required maxlength="14">
            </div>

            <!-- Foto upload -->
            <div class="col-12">
              <label class="form-label">📷 Foto da Diarista *</label>
              <div class="drop-zone" id="dropZone">
                <input type="file" name="foto" id="fotoInput" accept="image/jpeg,image/png,image/gif,image/webp" required>
                <div id="dropText">
                  <div style="font-size:2.5rem">📸</div>
                  <div class="text-muted mt-2">Clique ou arraste a foto aqui</div>
                  <div class="text-muted small">JPG, PNG, GIF ou WEBP – máx. 5 MB</div>
                </div>
                <img id="preview-img" src="" alt="Preview">
              </div>
            </div>

            <!-- Separador -->
            <div class="col-12"><hr style="border-color:rgba(16,185,129,.2)"></div>

            <!-- Fornecedor nome -->
            <div class="col-12 col-md-6">
              <label class="form-label">🏢 Nome do Fornecedor *</label>
              <input type="text" name="fornecedor_nome" class="form-control"
                     placeholder="Ex: Clean Pro Serviços"
                     value="<?= htmlspecialchars($_POST['fornecedor_nome'] ?? '') ?>"
                     required maxlength="100">
            </div>

            <!-- Fornecedor email -->
            <div class="col-12 col-md-6">
              <label class="form-label">✉️ E-mail do Fornecedor</label>
              <input type="email" name="fornecedor_email" class="form-control"
                     placeholder="contato@fornecedor.com"
                     value="<?= htmlspecialchars($_POST['fornecedor_email'] ?? '') ?>"
                     maxlength="150">
            </div>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-4 pt-3"
               style="border-top:1px solid rgba(16,185,129,.15)">
            <a href="index.php" class="btn btn-outline-secondary rounded-3">← Voltar</a>
            <button type="submit" class="btn-submit btn btn-success text-white">
              🃏 Salvar e Gerar Card
            </button>
          </div>

        </form>
      </div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
// Máscara CPF
document.getElementById('cpf').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9)      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  this.value = v;
});

// Preview foto
document.getElementById('fotoInput').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('preview-img');
    img.src = e.target.result;
    img.style.display = 'block';
    document.getElementById('dropText').style.display = 'none';
  };
  reader.readAsDataURL(file);
});
</script>
</body>
</html>
