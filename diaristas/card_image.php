<?php
/**
 * card_image.php
 * Gera o card Super Trunfo da diarista como imagem PNG via GD.
 * Tenta usar fontes TTF (DejaVu/Ubuntu) se disponíveis; caso contrário
 * usa as fontes nativas do GD.
 */
require_once __DIR__ . '/config.php';

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) {
    http_response_code(404);
    exit('ID inválido');
}

$pdo  = db();
$stmt = $pdo->prepare("
    SELECT s.local_servico, s.data_servico, s.horario_inicio, s.horario_fim,
           d.id AS did, d.nome, d.cpf, d.foto, d.fornecedor_nome
    FROM solicitacoes s
    INNER JOIN diaristas d ON d.solicitacao_id = s.id
    WHERE s.id = ? AND s.status = 'concluido'
");
$stmt->execute([$id]);
$row = $stmt->fetch();

if (!$row) {
    http_response_code(404);
    exit('Card não disponível');
}

// ── Dimensões ────────────────────────────────────────────────
$W = 600;
$H = 900;

$img = imagecreatetruecolor($W, $H);
imagealphablending($img, true);
imagesavealpha($img, true);

// ── Paleta ──────────────────────────────────────────────────
$cBg1    = imagecolorallocate($img,   8,   8,  24);
$cBg2    = imagecolorallocate($img,  13,  22,  52);
$cGold1  = imagecolorallocate($img, 251, 191,  36);
$cGold2  = imagecolorallocate($img, 245, 158,  11);
$cGold3  = imagecolorallocate($img, 180, 120,   0);
$cDark   = imagecolorallocate($img,  28,  10,   0);
$cWhite  = imagecolorallocate($img, 255, 255, 255);
$cGray   = imagecolorallocate($img, 100, 116, 139);
$cGray2  = imagecolorallocate($img, 148, 163, 184);
$cGreen  = imagecolorallocate($img,  16, 185, 129);
$cCyan   = imagecolorallocate($img,   6, 182, 212);
$cPurple = imagecolorallocate($img,  99, 102, 241);
$cPink   = imagecolorallocate($img, 236,  72, 153);
$cBlue   = imagecolorallocate($img,  29, 78, 216);
$cBlue2  = imagecolorallocate($img,  59, 130, 246);

// ── Fundo degradê ────────────────────────────────────────────
for ($y = 0; $y < $H; $y++) {
    $t = $y / $H;
    $r = (int)(8  + $t * (13 - 8));
    $g = (int)(8  + $t * (22 - 8));
    $b = (int)(24 + $t * (52 - 24));
    $c = imagecolorallocate($img, $r, $g, $b);
    imageline($img, 0, $y, $W, $y, $c);
    imagecolordeallocate($img, $c);
}

// ── Bordas ──────────────────────────────────────────────────
imagerectangle($img, 0, 0, $W-1, $H-1, $cGold1);
imagerectangle($img, 2, 2, $W-3, $H-3, $cGold1);
imagerectangle($img, 7, 7, $W-8, $H-8, $cGold3);

// ── Fontes TTF ──────────────────────────────────────────────
$fontCandidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
];
$fontBold = null;
foreach ($fontCandidates as $f) {
    if (file_exists($f)) { $fontBold = $f; break; }
}
$fontRegCandidates = [
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
];
$fontReg = null;
foreach ($fontRegCandidates as $f) {
    if (file_exists($f)) { $fontReg = $f; break; }
}
$fontReg  = $fontReg  ?? $fontBold;
$hasTTF   = ($fontBold !== null) && function_exists('imagettftext');

// ── Helper: centraliza texto ─────────────────────────────────
function centerText(
    GdImage $img, float $size, string $font, string $text,
    int $y, int $color, bool $ttf, int $W
): void {
    if ($ttf && $font) {
        $bb = imagettfbbox($size, 0, $font, $text);
        $tw = $bb[2] - $bb[0];
        imagettftext($img, $size, 0, (int)(($W - $tw) / 2), $y, $color, $font, $text);
    } else {
        $gf = ($size >= 16) ? 5 : (($size >= 13) ? 4 : 3);
        $tw = strlen($text) * imagefontwidth($gf);
        $yb = $y - imagefontheight($gf);
        imagestring($img, $gf, (int)(($W - $tw) / 2), $yb < 0 ? 0 : $yb, $text, $color);
    }
}

// ── HEADER (gold) ────────────────────────────────────────────
for ($y = 0; $y < 88; $y++) {
    $t = $y / 88;
    $r = (int)(251 - $t * 20);
    $g = (int)(191 - $t * 40);
    $b = (int)(36  + $t * 0);
    $c = imagecolorallocate($img, $r, $g, $b);
    imageline($img, 0, $y, $W, $y, $c);
    imagecolordeallocate($img, $c);
}

centerText($img, 38, $fontBold ?? '', 'SUPER TRUNFO', 58, $cDark, $hasTTF, $W);
centerText($img, 13, $fontBold ?? '', '* DIARISTAS PROFISSIONAIS *', 80, imagecolorallocate($img, 60, 30, 0), $hasTTF, $W);

// ── CATEGORY BAND ────────────────────────────────────────────
imagefilledrectangle($img, 0, 88, $W, 126, $cBlue);
centerText($img, 16, $fontBold ?? '', 'LIMPEZA & ORGANIZACAO', 115, $cGold1, $hasTTF, $W);

// ── FOTO ────────────────────────────────────────────────────
$photoX = 15; $photoY = 132; $photoW = $W - 30; $photoH = 290;

// Frame dourado
imagefilledrectangle($img, $photoX - 4, $photoY - 4, $photoX + $photoW + 4, $photoY + $photoH + 4, $cGold2);
imagefilledrectangle($img, $photoX - 2, $photoY - 2, $photoX + $photoW + 2, $photoY + $photoH + 2, $cDark);

$srcImg   = null;
$photoPath = UPLOAD_DIR . ($row['foto'] ?? '');
if (!empty($row['foto']) && file_exists($photoPath)) {
    $ext = strtolower(pathinfo($photoPath, PATHINFO_EXTENSION));
    $srcImg = match($ext) {
        'jpg','jpeg' => @imagecreatefromjpeg($photoPath),
        'png'        => @imagecreatefrompng($photoPath),
        'gif'        => @imagecreatefromgif($photoPath),
        'webp'       => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($photoPath) : null,
        default      => null,
    };
}

if ($srcImg) {
    $sw = imagesx($srcImg); $sh = imagesy($srcImg);
    $srcRatio = $sw / $sh;  $dstRatio = $photoW / $photoH;

    if ($srcRatio > $dstRatio) {
        $cropH = $sh; $cropW = (int)($sh * $dstRatio);
        $cropX = (int)(($sw - $cropW) / 2); $cropY = 0;
    } else {
        $cropW = $sw; $cropH = (int)($sw / $dstRatio);
        $cropX = 0; $cropY = (int)(($sh - $cropH) / 2);
    }
    imagecopyresampled($img, $srcImg, $photoX, $photoY, $cropX, $cropY, $photoW, $photoH, $cropW, $cropH);
    imagedestroy($srcImg);
} else {
    // Placeholder
    imagefilledrectangle($img, $photoX, $photoY, $photoX + $photoW, $photoY + $photoH,
        imagecolorallocate($img, 15, 25, 55));
    centerText($img, 18, $fontBold ?? '', 'SEM FOTO', $photoY + $photoH / 2 + 10, $cGray, $hasTTF, $W);
}

// Overlay gradiente na parte inferior da foto
for ($y = $photoY + $photoH - 100; $y <= $photoY + $photoH; $y++) {
    $alpha = (int)(120 * ($y - ($photoY + $photoH - 100)) / 100);
    $ov = imagecolorallocatealpha($img, 0, 0, 10, 127 - min($alpha, 127));
    imagefilledrectangle($img, $photoX, $y, $photoX + $photoW, $y, $ov);
    imagecolordeallocate($img, $ov);
}

// Nome sobre a foto
$nome = mb_strtoupper(mb_strimwidth($row['nome'], 0, 26, '..'));
centerText($img, 26, $fontBold ?? '', $nome, $photoY + $photoH - 10, $cWhite, $hasTTF, $W);

// ── INFO: CPF ────────────────────────────────────────────────
$infoY = $photoY + $photoH + 18;
centerText($img, 14, $fontReg ?? '', 'CPF: ' . formatCPF($row['cpf']), $infoY, $cGray, $hasTTF, $W);
$infoY += 18;

// Divisor
imagefilledrectangle($img, 20, $infoY, $W - 20, $infoY + 2, $cGold3);
$infoY += 14;

// ── STATS ────────────────────────────────────────────────────
mt_srand((int)$row['did'] * 13 + 77);
$statsList = [
    ['label' => 'LIMPEZA',      'value' => mt_rand(88, 99), 'color' => $cGreen],
    ['label' => 'ORGANIZACAO',  'value' => mt_rand(85, 98), 'color' => $cCyan],
    ['label' => 'PONTUALIDADE', 'value' => mt_rand(83, 97), 'color' => $cPurple],
    ['label' => 'DEDICACAO',    'value' => mt_rand(90, 99), 'color' => $cPink],
];

foreach ($statsList as $st) {
    // Rótulo
    if ($hasTTF && $fontBold) {
        imagettftext($img, 13, 0, 28, $infoY + 13, $cGray2, $fontBold, $st['label']);
        $valStr = (string)$st['value'];
        $bb = imagettfbbox(18, 0, $fontBold, $valStr);
        $vw = $bb[2] - $bb[0];
        imagettftext($img, 18, 0, $W - 28 - $vw, $infoY + 15, $cWhite, $fontBold, $valStr);
    } else {
        imagestring($img, 3, 28, $infoY, $st['label'], $cGray2);
        $valStr = (string)$st['value'];
        imagestring($img, 4, $W - 28 - strlen($valStr) * imagefontwidth(4), $infoY, $valStr, $cWhite);
    }
    $infoY += 20;

    // Barra de fundo
    imagefilledrectangle($img, 28, $infoY, $W - 28, $infoY + 14,
        imagecolorallocate($img, 22, 32, 55));
    // Barra preenchida
    $bw = (int)(($W - 56) * $st['value'] / 100);
    imagefilledrectangle($img, 28, $infoY, 28 + $bw, $infoY + 14, $st['color']);
    $infoY += 24;
}

// Divisor
imagefilledrectangle($img, 20, $infoY, $W - 20, $infoY + 2, $cGold3);
$infoY += 12;

// ── RODAPÉ ──────────────────────────────────────────────────
$dataFmt = date('d/m/Y', strtotime($row['data_servico']));
$horaFmt = substr($row['horario_inicio'], 0, 5) . '-' . substr($row['horario_fim'], 0, 5);

$lines = [
    'Local: ' . mb_strimwidth($row['local_servico'], 0, 42, '..'),
    'Data: ' . $dataFmt . '   Hora: ' . $horaFmt,
    'Fornecedor: ' . mb_strimwidth($row['fornecedor_nome'], 0, 35, '..'),
];
foreach ($lines as $line) {
    if ($hasTTF && $fontReg) {
        imagettftext($img, 12, 0, 28, $infoY + 14, $cGray, $fontReg, $line);
    } else {
        imagestring($img, 2, 28, $infoY, $line, $cGray);
    }
    $infoY += 20;
}

// Estrelas
centerText($img, 14, $fontBold ?? '', '★  ★  ★  ★  ★', $H - 18, $cGold1, $hasTTF, $W);

// ── Salva + exibe ────────────────────────────────────────────
$savePath = UPLOAD_DIR . 'card_' . $id . '.png';
imagepng($img, $savePath, 6);

header('Content-Type: image/png');
header('Content-Disposition: attachment; filename="diarista_card_' . $id . '.png"');
header('Cache-Control: no-store');
readfile($savePath);
imagedestroy($img);
