#!/usr/bin/env bash
#
# Starts the Spring Boot backend and the React frontend together.
# Press Ctrl+C to stop both.
#
# Usage:
#     ./start.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# --- quick checks ----------------------------------------------------------

if ! command -v java >/dev/null 2>&1; then
  echo "ERROR: Java is not installed (Java 21 or newer is required)."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed (needed for the React frontend)."
  exit 1
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "ERROR: frontend dependencies are missing. Run this once first:"
  echo "       cd frontend && npm install"
  exit 1
fi

# Warn (but do not stop) when PostgreSQL is not running: the backend will
# print a clear connection error in that case.
if command -v pg_isready >/dev/null 2>&1; then
  if ! pg_isready -q -h localhost -p 5432; then
    echo "WARNING: PostgreSQL does not seem to be listening on localhost:5432."
    echo "         See the Database setup section in README.md."
    echo ""
  fi
fi

# --- start the backend (port 8080) -----------------------------------------

echo "Starting Spring Boot backend on http://localhost:8080 ..."
(cd "$BACKEND_DIR" && ./mvnw spring-boot:run) &
BACKEND_PID=$!

# --- start the frontend (port 5173) ----------------------------------------

echo "Starting React frontend on http://localhost:5173 ..."
(cd "$FRONTEND_DIR" && npm run dev) &
FRONTEND_PID=$!

# --- shut both down when this script stops ---------------------------------

cleanup() {
  echo ""
  echo "Stopping backend and frontend..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
