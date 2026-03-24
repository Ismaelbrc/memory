#!/bin/bash
# FreteControl Deployment Script
# Run this from a machine with SSH access to 72.62.137.226

set -e

SERVER="root@72.62.137.226"
PASS="HK##84563A9@n"
DEPLOY_PATH="/var/www/html/fretecontrol"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== FreteControl Deploy ==="

# 1. Create directory on server
echo "[1/4] Creating deploy directory..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$SERVER" "mkdir -p $DEPLOY_PATH"

# 2. Run schema on MySQL (from server)
echo "[2/4] Running schema on MySQL..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$SERVER" \
  "mysql -h mysql.ligecom.com.br -u ligecom20 -phlHJSA836BDJZk ligecom20" < "$SCRIPT_DIR/schema.sql"

# 3. Copy files to server
echo "[3/4] Uploading PHP files..."
sshpass -p "$PASS" scp -o StrictHostKeyChecking=no \
  "$SCRIPT_DIR/config.php" \
  "$SCRIPT_DIR/layout.php" \
  "$SCRIPT_DIR/index.php" \
  "$SCRIPT_DIR/transportadores.php" \
  "$SCRIPT_DIR/veiculos.php" \
  "$SCRIPT_DIR/contratantes.php" \
  "$SCRIPT_DIR/ciots.php" \
  "$SCRIPT_DIR/pef.php" \
  "$SCRIPT_DIR/api.php" \
  "$SERVER:$DEPLOY_PATH/"

# 4. Set permissions
echo "[4/4] Setting permissions..."
sshpass -p "$PASS" ssh -o StrictHostKeyChecking=no "$SERVER" \
  "chown -R www-data:www-data $DEPLOY_PATH && chmod -R 755 $DEPLOY_PATH"

echo ""
echo "=== Deployment complete ==="
echo "URL: http://nutka.com.br/fretecontrol/"
