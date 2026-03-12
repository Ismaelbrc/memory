#!/bin/bash
# ============================================================
#  deploy.sh – Implanta o Sistema de Diaristas no servidor
#  Execute com: bash deploy.sh
# ============================================================

set -e

SERVER_IP="72.62.137.226"
SERVER_USER="root"
SERVER_PASS='HK##84563A9@n'
REMOTE_DIR="/var/www/html/diaristas"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"

DB_HOST="mysql.ligecom.com.br"
DB_NAME="ligecom20"
DB_USER="ligecom20"
DB_PASS="hlHJSA836BDJZk"

echo "============================================"
echo " DiaristaPRO – Deploy Automático"
echo "============================================"

# Verifica sshpass
if ! command -v sshpass &>/dev/null; then
  echo "Instalando sshpass..."
  apt-get install -y sshpass 2>/dev/null || brew install sshpass 2>/dev/null || {
    echo "ERRO: instale sshpass manualmente e rode novamente."
    exit 1
  }
fi

SSH_CMD="sshpass -p '${SERVER_PASS}' ssh -o StrictHostKeyChecking=no root@${SERVER_IP}"
SCP_CMD="sshpass -p '${SERVER_PASS}' scp -o StrictHostKeyChecking=no -r"

echo ""
echo "1. Testando conexão SSH..."
eval "$SSH_CMD 'echo OK'" && echo "   ✅ Conexão SSH OK" || { echo "ERRO: SSH falhou"; exit 1; }

echo ""
echo "2. Preparando servidor..."
eval "$SSH_CMD" << 'ENDSSH'
  # Cria diretório do projeto
  mkdir -p /var/www/html/diaristas/uploads
  chmod 755 /var/www/html/diaristas
  chmod 777 /var/www/html/diaristas/uploads

  # Garante que PHP e extensões necessárias estejam instaladas
  php -m | grep -q pdo_mysql  && echo "   ✅ PDO MySQL OK"     || echo "   ⚠️  PDO MySQL NÃO encontrado"
  php -m | grep -q gd         && echo "   ✅ GD OK"            || apt-get install -y php-gd 2>/dev/null
  php -m | grep -q fileinfo   && echo "   ✅ fileinfo OK"       || echo "   ⚠️  fileinfo NÃO encontrado"

  # Reinicia Apache/Nginx se necessário
  systemctl is-active apache2  &>/dev/null && systemctl reload apache2  && echo "   ✅ Apache recarregado"
  systemctl is-active nginx    &>/dev/null && systemctl reload nginx    && echo "   ✅ Nginx recarregado"
ENDSSH

echo ""
echo "3. Enviando arquivos PHP..."
${SCP_CMD} \
  "${LOCAL_DIR}/config.php" \
  "${LOCAL_DIR}/index.php" \
  "${LOCAL_DIR}/supervisor.php" \
  "${LOCAL_DIR}/gestor.php" \
  "${LOCAL_DIR}/fornecedor.php" \
  "${LOCAL_DIR}/card.php" \
  "${LOCAL_DIR}/card_image.php" \
  "${LOCAL_DIR}/create_tables.sql" \
  "root@${SERVER_IP}:${REMOTE_DIR}/"
echo "   ✅ Arquivos enviados"

echo ""
echo "4. Criando tabelas no MySQL (via servidor)..."
eval "$SSH_CMD" << ENDSSH
  mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" < "${REMOTE_DIR}/create_tables.sql" \
    && echo "   ✅ Tabelas criadas com sucesso" \
    || echo "   ⚠️  Falha ao criar tabelas (pode ser normal se já existem)"
ENDSSH

echo ""
echo "5. Ajustando permissões finais..."
eval "$SSH_CMD" << 'ENDSSH'
  find /var/www/html/diaristas -type f -exec chmod 644 {} \;
  find /var/www/html/diaristas -type d -exec chmod 755 {} \;
  chmod 777 /var/www/html/diaristas/uploads
  chown -R www-data:www-data /var/www/html/diaristas 2>/dev/null || true
ENDSSH
echo "   ✅ Permissões OK"

echo ""
echo "============================================"
echo " ✅ DEPLOY CONCLUÍDO!"
echo ""
echo " 🌐 Acesse: http://${SERVER_IP}/diaristas/"
echo "============================================"
