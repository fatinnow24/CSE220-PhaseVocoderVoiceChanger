#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null || true
    wait 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "=========================================="
echo " Starting DSP Engine & Phase Vocoder App  "
echo "=========================================="

"$DIR/run_backend.sh" &
BACKEND_PID=$!

"$DIR/run_frontend.sh" &
FRONTEND_PID=$!

echo ""
echo "Backend running on: http://127.0.0.1:8000"
echo "Frontend running on: http://localhost:5173"
echo "Press Ctrl+C to shut down both services."
echo ""

wait
