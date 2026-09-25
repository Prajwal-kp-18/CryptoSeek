#!/bin/bash
# Vestigo Environment Activation Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Activate Python virtual environment
if [ -f "$SCRIPT_DIR/venv/bin/activate" ]; then
    source "$SCRIPT_DIR/venv/bin/activate"
    echo "✓ Python virtual environment activated"
else
    echo "✗ Virtual environment not found. Run setup.sh first."
    exit 1
fi

# Set PYTHONPATH to include scripts directory and project root
export PYTHONPATH="$SCRIPT_DIR:$SCRIPT_DIR/scripts:$SCRIPT_DIR/backend:${PYTHONPATH:-}"
echo "✓ PYTHONPATH set: scripts, backend accessible"

# Set Ghidra path if installed
if [ -d "/opt/ghidra" ]; then
    export GHIDRA_HOME="/opt/ghidra"
    export PATH="$GHIDRA_HOME/support:$PATH"
    echo "✓ Ghidra path set: $GHIDRA_HOME"
fi

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
    echo "✓ Environment variables loaded from .env"
fi

# Show status
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Vestigo Environment Ready!"
echo "═══════════════════════════════════════════════════════════"
echo "Python:    $(python --version)"
echo "Pip:       $(pip --version | cut -d' ' -f1-2)"
echo "Directory: $SCRIPT_DIR"
echo ""
echo "Quick commands:"
echo "  Backend:   cd backend && uvicorn main:app --reload"
echo "  Frontend:  cd frontend && npm run dev"
echo "  Ghidra:    analyzeHeadless --help"
echo ""
echo "To deactivate: deactivate"
echo "═══════════════════════════════════════════════════════════"
