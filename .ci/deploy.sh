#!/usr/bin/env bash

set -euo pipefail

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
    echo "✓ Loaded environment from $SCRIPT_DIR/.env"
else
    echo "⚠ Warning: .env not found, using defaults"
fi

# Default values (can be overridden by .env)
REPO_DIR="${REPO_DIR:-$HOME/hk-demo-src}"
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/hk-demo}"
DOCKER_COMPOSE_BIN="${DOCKER_COMPOSE_BIN:-/usr/bin/docker}"

echo "[1/5] Pull latest..."
git -C "$REPO_DIR" fetch --all --prune
git -C "$REPO_DIR" reset --hard origin/main

echo "[2/5] Initialize deploy directory if needed..."
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "  → Deploy directory not found, creating initial copy..."
    mkdir -p "$DEPLOY_DIR"
    cp -r "$REPO_DIR/backend" "$DEPLOY_DIR/"
    cp -r "$REPO_DIR/frontend" "$DEPLOY_DIR/"
    cp "$REPO_DIR/docker-compose.yml" "$DEPLOY_DIR/"
    echo "  ✓ Initial deployment structure created"
fi

echo "[3/5] Backup local .env if exists..."
[ -f "$DEPLOY_DIR/frontend/.env" ] && cp "$DEPLOY_DIR/frontend/.env" /tmp/frontend.env.bak || true

echo "[4/5] Sync code..."
rsync -a --delete "$REPO_DIR/backend/" "$DEPLOY_DIR/backend/"
rsync -a --delete "$REPO_DIR/frontend/" "$DEPLOY_DIR/frontend/"
cp -f "$REPO_DIR/docker-compose.yml" "$DEPLOY_DIR/"

echo "[5/5] Restore .env ..."
[ -f /tmp/frontend.env.bak ] && mv /tmp/frontend.env.bak "$DEPLOY_DIR/frontend/.env" || true

cd "$DEPLOY_DIR"
"$DOCKER_COMPOSE_BIN" compose build --pull --no-cache
"$DOCKER_COMPOSE_BIN" compose up -d
echo "Deployed at $(date)"