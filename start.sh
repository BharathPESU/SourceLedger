#!/usr/bin/env bash

# SourceLedger — Startup Script for Backend & Frontend
# Usage: ./start.sh

set -e

# Get absolute path of workspace root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=================================================="
echo " Starting SourceLedger Services..."
echo "=================================================="

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping SourceLedger services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo "Services stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# ── Start Backend Server ──────────────────────────────────────────────
echo "[1/2] Starting Backend FastAPI Server (Port 8000)..."
cd "$ROOT_DIR/backend"

# Ensure environment file exists if needed
if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
    echo "Created backend/.env from .env.example"
fi

python3 -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID"

# ── Start Frontend Server ─────────────────────────────────────────────
echo "[2/2] Starting Frontend Vite Server..."
cd "$ROOT_DIR/frontend"

# Ensure node_modules exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

npm run dev &
FRONTEND_PID=$!
echo "Frontend started with PID $FRONTEND_PID"

echo "=================================================="
echo " SourceLedger is running!"
echo "   Backend:  http://localhost:8000 (Docs: http://localhost:8000/docs)"
echo "   Frontend: http://localhost:3000"
echo " Press Ctrl+C to stop both services."
echo "=================================================="

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID
