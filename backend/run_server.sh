#!/bin/bash
# Vestigo Backend Server Runner
# Automatically sets up environment and runs uvicorn

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Activate venv if not already active
if [ -z "$VIRTUAL_ENV" ]; then
    if [ -f "$PROJECT_ROOT/venv/bin/activate" ]; then
        source "$PROJECT_ROOT/venv/bin/activate"
        echo "✓ Virtual environment activated"
    else
        echo "✗ Virtual environment not found at $PROJECT_ROOT/venv"
        exit 1
    fi
fi

# Set PYTHONPATH
export PYTHONPATH="$PROJECT_ROOT:$PROJECT_ROOT/scripts:$PROJECT_ROOT/backend:${PYTHONPATH:-}"
echo "✓ PYTHONPATH configured"

# Load .env if exists (safer parsing)
if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
    echo "✓ Environment variables loaded"
fi

# Run uvicorn
cd "$SCRIPT_DIR"
echo ""
echo "Starting Vestigo Backend..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
