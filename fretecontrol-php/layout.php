<?php
function renderHead(string $title): void {
    echo <<<HTML
<!DOCTYPE html>
<html lang="pt-BR" data-bs-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$title} - FreteControl</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        :root {
            --sidebar-bg: #1a1f2e;
            --sidebar-hover: #252d42;
            --accent: #f59e0b;
            --accent-hover: #d97706;
        }
        body { background: #0f1117; min-height: 100vh; }
        .sidebar {
            width: 260px;
            min-height: 100vh;
            background: var(--sidebar-bg);
            position: fixed;
            top: 0; left: 0;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            border-right: 1px solid #2d3348;
        }
        .sidebar-brand {
            padding: 1.5rem 1.25rem;
            border-bottom: 1px solid #2d3348;
        }
        .sidebar-brand .brand-icon {
            width: 40px; height: 40px;
            background: var(--accent);
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: #000;
            font-size: 1.2rem;
            font-weight: bold;
        }
        .sidebar-brand .brand-name {
            font-size: 1.2rem;
            font-weight: 700;
            color: #fff;
            margin-left: 0.75rem;
        }
        .sidebar-brand .brand-sub {
            font-size: 0.7rem;
            color: #6b7280;
            margin-left: 0.75rem;
        }
        .sidebar-nav { padding: 1rem 0; flex: 1; }
        .nav-section-title {
            font-size: 0.65rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #4b5563;
            padding: 0.5rem 1.25rem;
            margin-top: 0.5rem;
        }
        .nav-link-custom {
            display: flex;
            align-items: center;
            padding: 0.6rem 1.25rem;
            color: #9ca3af;
            text-decoration: none;
            border-radius: 0;
            transition: all 0.2s;
            font-size: 0.9rem;
        }
        .nav-link-custom i { width: 20px; margin-right: 0.75rem; font-size: 1rem; }
        .nav-link-custom:hover {
            color: #fff;
            background: var(--sidebar-hover);
        }
        .nav-link-custom.active {
            color: var(--accent);
            background: rgba(245,158,11,0.1);
            border-left: 3px solid var(--accent);
        }
        .main-content {
            margin-left: 260px;
            padding: 1.5rem;
            min-height: 100vh;
        }
        .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #2d3348;
        }
        .page-header h1 {
            font-size: 1.5rem;
            font-weight: 700;
            margin: 0;
            color: #f9fafb;
        }
        .stat-card {
            background: #1a1f2e;
            border: 1px solid #2d3348;
            border-radius: 12px;
            padding: 1.25rem;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        }
        .stat-icon {
            width: 48px; height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.4rem;
        }
        .table-card {
            background: #1a1f2e;
            border: 1px solid #2d3348;
            border-radius: 12px;
            overflow: hidden;
        }
        .table-card .table {
            margin: 0;
        }
        .table-card .table thead th {
            background: #13172280;
            border-color: #2d3348;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            padding: 0.875rem 1rem;
        }
        .table-card .table tbody td {
            border-color: #2d3348;
            vertical-align: middle;
            padding: 0.75rem 1rem;
            color: #d1d5db;
            font-size: 0.875rem;
        }
        .table-card .table tbody tr:hover td {
            background: rgba(255,255,255,0.03);
        }
        .table-card-header {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid #2d3348;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .badge-pendente   { background: rgba(251,191,36,0.15); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }
        .badge-ativo      { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
        .badge-encerrado  { background: rgba(107,114,128,0.2); color: #9ca3af; border: 1px solid rgba(107,114,128,0.3); }
        .badge-cancelado  { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
        .badge-inativo    { background: rgba(107,114,128,0.2); color: #9ca3af; border: 1px solid rgba(107,114,128,0.3); }
        .badge-adiantamento { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
        .badge-saldo      { background: rgba(52,211,153,0.15); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
        .badge-pedagio    { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.3); }
        .badge-outros     { background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3); }
        .badge-PF         { background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); }
        .badge-PJ         { background: rgba(139,92,246,0.15); color: #a78bfa; border: 1px solid rgba(139,92,246,0.3); }
        .status-badge { border-radius: 6px; padding: 0.25rem 0.6rem; font-size: 0.72rem; font-weight: 600; }
        .btn-accent { background: var(--accent); color: #000; border: none; font-weight: 600; }
        .btn-accent:hover { background: var(--accent-hover); color: #000; }
        .modal-content { background: #1a1f2e; border: 1px solid #2d3348; }
        .modal-header { border-bottom: 1px solid #2d3348; }
        .modal-footer { border-top: 1px solid #2d3348; }
        .form-control, .form-select {
            background: #0f1117;
            border-color: #2d3348;
            color: #d1d5db;
        }
        .form-control:focus, .form-select:focus {
            background: #0f1117;
            border-color: var(--accent);
            color: #fff;
            box-shadow: 0 0 0 0.2rem rgba(245,158,11,0.2);
        }
        .form-label { color: #9ca3af; font-size: 0.85rem; font-weight: 500; }
        .alert-toast {
            position: fixed;
            top: 1.5rem;
            right: 1.5rem;
            z-index: 9999;
            min-width: 300px;
        }
        @media (max-width: 768px) {
            .sidebar { transform: translateX(-100%); transition: transform 0.3s; }
            .sidebar.show { transform: translateX(0); }
            .main-content { margin-left: 0; }
        }
    </style>
</head>
<body>
HTML;
}

function renderSidebar(string $activePage): void {
    $pages = [
        'index'           => ['icon' => 'bi-speedometer2',   'label' => 'Dashboard'],
        'transportadores' => ['icon' => 'bi-person-badge',   'label' => 'Transportadores'],
        'veiculos'        => ['icon' => 'bi-truck',          'label' => 'Veículos'],
        'contratantes'    => ['icon' => 'bi-building',       'label' => 'Contratantes'],
        'ciots'           => ['icon' => 'bi-file-earmark-text', 'label' => 'CIOTs'],
        'pef'             => ['icon' => 'bi-cash-stack',     'label' => 'PEF / Pagamentos'],
    ];
    echo '<div class="sidebar">';
    echo '<div class="sidebar-brand d-flex align-items-center">';
    echo '<div class="brand-icon"><i class="bi bi-truck-front-fill"></i></div>';
    echo '<div><div class="brand-name">FreteControl</div><div class="brand-sub">Gestão de Fretes</div></div>';
    echo '</div>';
    echo '<nav class="sidebar-nav">';
    echo '<div class="nav-section-title">Menu Principal</div>';
    foreach ($pages as $page => $info) {
        $href = $page === 'index' ? 'index.php' : $page . '.php';
        $activeClass = ($activePage === $page) ? ' active' : '';
        echo "<a href=\"{$href}\" class=\"nav-link-custom{$activeClass}\"><i class=\"{$info['icon']}\"></i>{$info['label']}</a>";
    }
    echo '</nav>';
    echo '<div style="padding:1rem 1.25rem; border-top:1px solid #2d3348; font-size:0.72rem; color:#4b5563;">FreteControl v1.0 &copy; ' . date('Y') . '</div>';
    echo '</div>';
}

function renderFooter(): void {
    echo <<<HTML
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
HTML;
}

function statusBadge(string $status): string {
    $labels = [
        'ativo'       => 'Ativo',
        'inativo'     => 'Inativo',
        'pendente'    => 'Pendente',
        'encerrado'   => 'Encerrado',
        'cancelado'   => 'Cancelado',
        'adiantamento'=> 'Adiantamento',
        'saldo'       => 'Saldo',
        'pedagio'     => 'Pedágio',
        'outros'      => 'Outros',
        'PF'          => 'Pessoa Física',
        'PJ'          => 'Pessoa Jurídica',
    ];
    $label = $labels[$status] ?? ucfirst($status);
    return "<span class=\"status-badge badge-{$status}\">{$label}</span>";
}
