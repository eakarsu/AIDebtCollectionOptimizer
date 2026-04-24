#!/bin/bash

echo "============================================"
echo "  AI Debt Collection Optimizer - Startup"
echo "============================================"
echo ""

cd "$(dirname "$0")"

# Load env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

SERVER_PORT=${SERVER_PORT:-3001}
CLIENT_PORT=${CLIENT_PORT:-3000}

# Kill processes on used ports
echo "[1/7] Cleaning up ports $SERVER_PORT and $CLIENT_PORT..."
kill_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "  Killing processes on port $port: $pids"
    echo "$pids" | xargs kill -9 2>/dev/null
    sleep 1
  fi
}
kill_port $SERVER_PORT
kill_port $CLIENT_PORT
echo "  Ports cleaned."
echo ""

# Check PostgreSQL
echo "[2/7] Checking PostgreSQL..."
if ! command -v psql &>/dev/null; then
  echo "  ERROR: PostgreSQL (psql) not found. Please install PostgreSQL first."
  exit 1
fi

# Check if postgres is running
if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &>/dev/null; then
  echo "  PostgreSQL is not running. Attempting to start..."
  if command -v brew &>/dev/null; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
    sleep 2
  fi
  if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} &>/dev/null; then
    echo "  ERROR: Could not start PostgreSQL. Please start it manually."
    exit 1
  fi
fi
echo "  PostgreSQL is running."
echo ""

# Install server dependencies
echo "[3/7] Installing server dependencies..."
npm install --silent 2>&1 | tail -1
echo "  Server dependencies installed."
echo ""

# Install client dependencies
echo "[4/7] Installing client dependencies..."
cd client && npm install --silent 2>&1 | tail -1
cd ..
echo "  Client dependencies installed."
echo ""

# Setup database
echo "[5/7] Setting up database..."
node server/seeds/setup.js
echo ""

# Seed data
echo "[6/7] Seeding database with sample data..."
node server/seeds/seed.js
echo ""

# Start application with hot reload
echo "[7/7] Starting application with hot reload..."
echo ""
echo "============================================"
echo "  Server: http://localhost:$SERVER_PORT"
echo "  Client: http://localhost:$CLIENT_PORT"
echo "============================================"
echo ""
echo "  Login Credentials:"
echo "  Email:    ${DEFAULT_EMAIL:-admin@debtoptimizer.com}"
echo "  Password: ${DEFAULT_PASSWORD:-admin123}"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "============================================"
echo ""

# Start server with nodemon (hot reload) and client with vite (hot reload)
npx concurrently \
  --names "SERVER,CLIENT" \
  --prefix-colors "blue,green" \
  "npx nodemon --watch server server/index.js" \
  "cd client && npx vite --port $CLIENT_PORT"
