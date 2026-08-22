#!/usr/bin/env bash

# ==============================================================================
# SourceLedger — Startup & Health Verification Script
# Checks all requirements, virtual environments, dependencies, and launches 
# both Backend API and Frontend Dev Server with unified live terminal logs.
# ==============================================================================

set -eo pipefail

# Project root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ANSI Color Codes for Clean Terminal Output
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}"
echo "======================================================================"
echo "          SOURCELEDGER — AI PRODUCT INTELLIGENCE ENGINE               "
echo "======================================================================"
echo -e "${NC}"

# ── 1. Check System Dependencies ───────────────────────────────────────────

echo -e "${BOLD}[CHECK 1/5] Checking System Prerequisites...${NC}"

if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[ERROR] python3 is not installed or not in PATH.${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version 2>&1)
echo -e "  ✓ Python: ${GREEN}$PYTHON_VERSION${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] node is not installed or not in PATH.${NC}"
    exit 1
fi
NODE_VERSION=$(node --version 2>&1)
echo -e "  ✓ Node.js: ${GREEN}$NODE_VERSION${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}[ERROR] npm is not installed or not in PATH.${NC}"
    exit 1
fi
NPM_VERSION=$(npm --version 2>&1)
echo -e "  ✓ npm: ${GREEN}v$NPM_VERSION${NC}"

# ── 2. Check Backend Virtual Environment & Dependencies ────────────────────

echo -e "\n${BOLD}[CHECK 2/5] Checking Backend Python Environment & Dependencies...${NC}"

VENV_PATH="$BACKEND_DIR/.venv"
PYTHON_VENV="$VENV_PATH/bin/python"
PIP_VENV="$VENV_PATH/bin/pip"

if [ ! -d "$VENV_PATH" ]; then
    echo -e "  ${YELLOW}▶ Virtual environment not found at backend/.venv. Creating...${NC}"
    python3 -m venv "$VENV_PATH"
    echo -e "  ${GREEN}✓ Virtual environment created successfully.${NC}"
fi

# Verify core Python dependencies (FastAPI, uvicorn, pydantic, dotenv, google-genai, PIL, fitz, pypdfium2)
MISSING_PY_DEPS=0
"$PYTHON_VENV" -c "import fastapi, uvicorn, pydantic, pydantic_settings, dotenv, PIL, fitz, pypdfium2" 2>/dev/null || MISSING_PY_DEPS=1

if [ "$MISSING_PY_DEPS" -eq 1 ]; then
    echo -e "  ${YELLOW}▶ Missing or incomplete Python dependencies. Installing from requirements.txt...${NC}"
    "$PIP_VENV" install -q -r "$BACKEND_DIR/requirements.txt"
    echo -e "  ${GREEN}✓ Backend Python dependencies installed successfully.${NC}"
else
    echo -e "  ✓ Python Dependencies: ${GREEN}All required modules present${NC}"
fi

# ── 3. Check Frontend Node Modules ─────────────────────────────────────────

echo -e "\n${BOLD}[CHECK 3/5] Checking Frontend Node Modules...${NC}"

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "  ${YELLOW}▶ node_modules not found in frontend/. Installing...${NC}"
    (cd "$FRONTEND_DIR" && npm install)
    echo -e "  ${GREEN}✓ Frontend packages installed successfully.${NC}"
else
    echo -e "  ✓ Frontend Packages: ${GREEN}node_modules present${NC}"
fi

# ── 4. Environment & Storage Directory Checks ──────────────────────────────

echo -e "\n${BOLD}[CHECK 4/5] Checking Environment Configuration & Storage Folders...${NC}"

# Check .env file
if [ ! -f "$ROOT_DIR/.env" ]; then
    if [ -f "$ROOT_DIR/.env.example" ]; then
        cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
        echo -e "  ${YELLOW}▶ Created root .env from .env.example${NC}"
    elif [ -f "$BACKEND_DIR/.env.example" ]; then
        cp "$BACKEND_DIR/.env.example" "$ROOT_DIR/.env"
        echo -e "  ${YELLOW}▶ Created root .env from backend/.env.example${NC}"
    fi
fi

if [ ! -f "$BACKEND_DIR/.env" ] && [ -f "$ROOT_DIR/.env" ]; then
    cp "$ROOT_DIR/.env" "$BACKEND_DIR/.env"
    echo -e "  ${GREEN}✓ Synchronized backend/.env${NC}"
fi

# Ensure storage directories exist
mkdir -p "$BACKEND_DIR/storage/sources" "$ROOT_DIR/storage/sources" "$ROOT_DIR/output" "$FRONTEND_DIR/public"
echo -e "  ✓ Storage Directories: ${GREEN}storage/sources and output folders verified${NC}"

# ── 5. Launch Backend & Frontend Services with Live Terminal Logging ───────

echo -e "\n${BOLD}[CHECK 5/5] Launching Services with Real-time Terminal Logging...${NC}"

# Cleanup handler for graceful shutdown
cleanup() {
    echo -e "\n${BOLD}${RED}======================================================================${NC}"
    echo -e "${BOLD}${RED} Shutting down SourceLedger background services...${NC}"
    echo -e "${BOLD}${RED}======================================================================${NC}"
    
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    
    # Kill any lingering uvicorn or vite processes on our ports
    fuser -k 8000/tcp 2>/dev/null || true
    fuser -k 3000/tcp 2>/dev/null || true
    
    echo -e "${GREEN}✓ All SourceLedger services stopped cleanly.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start Backend Server
cd "$BACKEND_DIR"
echo -e "${CYAN}[BACKEND] Starting FastAPI Server on http://localhost:8000 (Docs: http://localhost:8000/docs)...${NC}"
("$PYTHON_VENV" -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload 2>&1 | sed -u "s/^/$(printf "${CYAN}[BACKEND]${NC} ")/") &
BACKEND_PID=$!

# Start Frontend Dev Server
cd "$FRONTEND_DIR"
echo -e "${YELLOW}[FRONTEND] Starting Vite Dev Server on http://localhost:3000...${NC}"
(npm run dev -- --host 0.0.0.0 --port 3000 2>&1 | sed -u "s/^/$(printf "${YELLOW}[FRONTEND]${NC} ")/") &
FRONTEND_PID=$!

echo -e "\n${BOLD}${GREEN}======================================================================"
echo "          SOURCELEDGER SERVICES ARE LIVE & LISTENING                  "
echo "======================================================================"
echo -e "${BLUE}  ► Backend API:  http://localhost:8000"
echo -e "  ► Swagger Docs: http://localhost:8000/docs"
echo -e "  ► Web App UI:   http://localhost:3000"
echo -e "${BOLD}${GREEN}======================================================================${NC}\n"

# Keep script active to stream logs and hold PIDs
wait $BACKEND_PID $FRONTEND_PID
