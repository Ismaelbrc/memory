#!/bin/bash
# deploy.sh — Deployment script for Memory Repository on Nutka.com.br
# Run this on the production server as root or deploy user
# Usage: bash deploy.sh

set -e

REPO="https://github.com/Ismaelbrc/memory.git"
BRANCH="claude/setup-memory-feature-TO4mN"
APP_DIR="/var/www/memory"
APP_NAME="memory"

echo "=== Memory Repository - Deploy ==="

# 1. Clone or pull repo
if [ -d "$APP_DIR/.git" ]; then
  echo "[1/6] Atualizando repositório..."
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  echo "[1/6] Clonando repositório..."
  mkdir -p "$(dirname $APP_DIR)"
  git clone -b "$BRANCH" "$REPO" "$APP_DIR"
  cd "$APP_DIR"
fi

# 2. Criar .env.local se não existir
if [ ! -f "$APP_DIR/.env.local" ]; then
  echo "[2/6] Criando .env.local..."
  cat > "$APP_DIR/.env.local" <<'ENV'
# MySQL
DB_HOST=mysql.ligecom.com.br
DB_PORT=3306
DB_USER=ligecom20
DB_PASSWORD=hlHJSA836BDJZk
DB_NAME=ligecom20

# Embeddings: "ollama" | "none"
EMBEDDING_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text

# App URL
NEXT_PUBLIC_APP_URL=https://nutka.com.br
ENV
  echo "    .env.local criado. Edite se necessário."
else
  echo "[2/6] .env.local já existe, mantendo..."
fi

# 3. Criar tabelas no banco (se ainda não existirem)
echo "[3/6] Aplicando schema no banco de dados..."
if command -v mysql &> /dev/null; then
  mysql -h mysql.ligecom.com.br -u ligecom20 -phlHJSA836BDJZk ligecom20 < "$APP_DIR/db/schema.sql" 2>/dev/null && echo "    Schema aplicado!" || echo "    Schema já existe ou erro (normal se tabelas já criadas)"
else
  echo "    mysql client não encontrado — aplique o schema manualmente:"
  echo "    mysql -h mysql.ligecom.com.br -u ligecom20 -phlHJSA836BDJZk ligecom20 < $APP_DIR/db/schema.sql"
fi

# 4. Instalar dependências
echo "[4/6] Instalando dependências..."
cd "$APP_DIR"
npm ci --omit=dev

# 5. Build
echo "[5/6] Fazendo build..."
npm run build

# 6. Iniciar / reiniciar com PM2
echo "[6/6] Iniciando app com PM2..."
if command -v pm2 &> /dev/null; then
  if pm2 list | grep -q "$APP_NAME"; then
    pm2 reload "$APP_NAME"
    echo "    PM2: app '$APP_NAME' recarregado"
  else
    pm2 start ecosystem.config.js
    pm2 save
    echo "    PM2: app '$APP_NAME' iniciado na porta 3001"
  fi
else
  echo "    PM2 não encontrado. Instalando globalmente..."
  npm install -g pm2
  pm2 start ecosystem.config.js
  pm2 save
  pm2 startup | tail -1 | bash  # habilita autostart
fi

echo ""
echo "=== Deploy concluído! ==="
echo "App rodando em: http://localhost:3001"
echo "Acesse: https://nutka.com.br/painel-zap/memories"
echo ""
echo "IMPORTANTE: Configure o Nginx para fazer proxy de /painel-zap/memories -> localhost:3001"
echo "Veja: nginx/memory.conf"
