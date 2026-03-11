<?php
// config.php — Conexão com o banco de dados via PDO

define('DB_HOST', 'mysql.ligecom.com.br');
define('DB_NAME', 'ligecom20');
define('DB_USER', 'ligecom20');
define('DB_PASS', 'hlHJSA836BDJZk');
define('DB_CHARSET', 'utf8mb4');

define('APP_NAME', 'Sistema de Metas');
define('APP_VERSION', '1.0.0');

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            die(json_encode(['error' => 'Falha na conexão com o banco: ' . $e->getMessage()]));
        }
    }
    return $pdo;
}

// Helpers
function nomeMes(int $mes): string {
    $meses = [
        1 => 'Janeiro', 2 => 'Fevereiro', 3 => 'Março', 4 => 'Abril',
        5 => 'Maio', 6 => 'Junho', 7 => 'Julho', 8 => 'Agosto',
        9 => 'Setembro', 10 => 'Outubro', 11 => 'Novembro', 12 => 'Dezembro'
    ];
    return $meses[$mes] ?? '';
}

function corProgresso(float $pct): string {
    if ($pct >= 80) return 'success';
    if ($pct >= 50) return 'warning';
    return 'danger';
}

function badgeProgresso(float $pct): string {
    if ($pct >= 100) return '<span class="badge bg-success">Superou!</span>';
    if ($pct >= 80)  return '<span class="badge bg-success">Atingiu</span>';
    if ($pct >= 50)  return '<span class="badge bg-warning text-dark">Em andamento</span>';
    return '<span class="badge bg-danger">Crítico</span>';
}

function estrelasProgresso(float $pct): string {
    $cor = corProgresso($pct);
    if ($pct >= 80) {
        return '<i class="bi bi-star-fill text-warning"></i><i class="bi bi-star-fill text-warning"></i><i class="bi bi-star-fill text-warning"></i>';
    }
    if ($pct >= 50) {
        return '<i class="bi bi-star-fill text-warning"></i><i class="bi bi-star-fill text-warning"></i><i class="bi bi-star text-secondary"></i>';
    }
    return '<i class="bi bi-star-fill text-warning"></i><i class="bi bi-star text-secondary"></i><i class="bi bi-star text-secondary"></i>';
}

function formatMoeda(float $valor): string {
    return 'R$ ' . number_format($valor, 2, ',', '.');
}
