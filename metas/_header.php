<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?= htmlspecialchars($pageTitle ?? APP_NAME) ?> — <?= APP_NAME ?></title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <style>
    body { background: #0d1117; min-height: 100vh; }
    .sidebar {
      min-height: 100vh;
      background: #161b22;
      border-right: 1px solid #30363d;
      width: 220px;
      min-width: 220px;
    }
    .sidebar .nav-link {
      color: #8b949e;
      border-radius: 8px;
      margin: 2px 8px;
      padding: 8px 12px;
      transition: all .2s;
    }
    .sidebar .nav-link:hover,
    .sidebar .nav-link.active {
      background: #21262d;
      color: #58a6ff;
    }
    .sidebar .nav-link i { width: 20px; }
    .sidebar-brand {
      padding: 20px 16px 12px;
      border-bottom: 1px solid #30363d;
      margin-bottom: 8px;
    }
    .main-content { flex: 1; padding: 24px; overflow-x: auto; }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
    }
    .card-header {
      background: #21262d;
      border-bottom: 1px solid #30363d;
      border-radius: 12px 12px 0 0 !important;
    }
    .table { --bs-table-bg: transparent; }
    .progress { height: 20px; border-radius: 10px; }
    .progress-bar { font-size: 11px; font-weight: 600; }
    .badge-rank-1 { background: linear-gradient(135deg, #ffd700, #ff8c00); color: #000; }
    .badge-rank-2 { background: linear-gradient(135deg, #c0c0c0, #808080); color: #000; }
    .badge-rank-3 { background: linear-gradient(135deg, #cd7f32, #8b4513); color: #fff; }
    .stat-card { transition: transform .2s; cursor: default; }
    .stat-card:hover { transform: translateY(-3px); }
    .kpi-value { font-size: 2rem; font-weight: 700; }
    .modal-content { background: #161b22; border: 1px solid #30363d; }
    .form-control, .form-select {
      background: #0d1117;
      border-color: #30363d;
      color: #e6edf3;
    }
    .form-control:focus, .form-select:focus {
      background: #0d1117;
      border-color: #58a6ff;
      color: #e6edf3;
      box-shadow: 0 0 0 3px rgba(88,166,255,.15);
    }
    .btn-outline-secondary { border-color: #30363d; color: #8b949e; }
    .area-badge { display: inline-flex; align-items: center; gap: 6px; }
    @media (max-width: 768px) {
      .sidebar { display: none !important; }
      .main-content { padding: 16px; }
    }
  </style>
</head>
<body>
<div class="d-flex">
  <!-- Sidebar -->
  <nav class="sidebar d-flex flex-column">
    <div class="sidebar-brand">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-bullseye text-primary fs-4"></i>
        <div>
          <div class="fw-bold text-white" style="font-size:.9rem;">Sistema de Metas</div>
          <div class="text-secondary" style="font-size:.7rem;">Gestão de Performance</div>
        </div>
      </div>
    </div>
    <ul class="nav flex-column flex-grow-1 pb-3">
      <li class="nav-item">
        <a class="nav-link <?= ($currentPage ?? '') === 'dashboard' ? 'active' : '' ?>" href="index.php">
          <i class="bi bi-speedometer2"></i> Dashboard
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link <?= ($currentPage ?? '') === 'areas' ? 'active' : '' ?>" href="areas.php">
          <i class="bi bi-diagram-3"></i> Áreas
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link <?= ($currentPage ?? '') === 'colaboradores' ? 'active' : '' ?>" href="colaboradores.php">
          <i class="bi bi-people"></i> Colaboradores
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link <?= ($currentPage ?? '') === 'metas' ? 'active' : '' ?>" href="metas.php">
          <i class="bi bi-bullseye"></i> Metas
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link <?= ($currentPage ?? '') === 'distribuicao' ? 'active' : '' ?>" href="distribuicao.php">
          <i class="bi bi-share"></i> Distribuição
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link <?= ($currentPage ?? '') === 'progresso' ? 'active' : '' ?>" href="progresso.php">
          <i class="bi bi-bar-chart-line"></i> Progresso
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link <?= ($currentPage ?? '') === 'pagamentos' ? 'active' : '' ?>" href="pagamentos.php">
          <i class="bi bi-cash-coin"></i> Pagamentos
        </a>
      </li>
    </ul>
    <div class="px-3 pb-3">
      <small class="text-secondary">v<?= APP_VERSION ?></small>
    </div>
  </nav>
  <!-- Main Content -->
  <div class="main-content">
