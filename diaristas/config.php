<?php
// ── Banco de dados ─────────────────────────────────────────────────────────
define('DB_HOST',    'mysql.ligecom.com.br');
define('DB_NAME',    'ligecom20');
define('DB_USER',    'ligecom20');
define('DB_PASS',    'hlHJSA836BDJZk');
define('UPLOAD_DIR', __DIR__ . '/uploads/');

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER, DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            die('<div style="font-family:monospace;color:#f87171;background:#0f172a;padding:2rem;border-radius:8px;margin:2rem">'
                . '<b>Erro de conexão com o banco de dados:</b><br>'
                . htmlspecialchars($e->getMessage())
                . '</div>');
        }
    }
    return $pdo;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function validaCPF(string $cpf): bool {
    $cpf = preg_replace('/\D/', '', $cpf);
    if (strlen($cpf) !== 11 || preg_match('/^(.)\1{10}$/', $cpf)) {
        return false;
    }
    for ($t = 9; $t < 11; $t++) {
        $d = 0;
        for ($c = 0; $c < $t; $c++) {
            $d += (int)$cpf[$c] * ($t + 1 - $c);
        }
        $d = ((10 * $d) % 11) % 10;
        if ((int)$cpf[$t] !== $d) {
            return false;
        }
    }
    return true;
}

function formatCPF(string $cpf): string {
    $cpf = preg_replace('/\D/', '', $cpf);
    if (strlen($cpf) !== 11) return $cpf;
    return substr($cpf, 0, 3) . '.' . substr($cpf, 3, 3) . '.'
         . substr($cpf, 6, 3) . '-' . substr($cpf, 9, 2);
}

function statusBadge(string $status): string {
    return match($status) {
        'pendente'  => '<span class="badge bg-warning text-dark">⏳ Pendente</span>',
        'aprovado'  => '<span class="badge bg-success">✅ Aprovado</span>',
        'reprovado' => '<span class="badge bg-danger">❌ Reprovado</span>',
        'concluido' => '<span class="badge bg-info text-dark">🏆 Concluído</span>',
        default     => '<span class="badge bg-secondary">' . htmlspecialchars($status) . '</span>',
    };
}

// Cria o diretório de uploads se não existir
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}
