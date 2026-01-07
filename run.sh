#!/bin/bash

# Auditor - Unified Start Script
# This script handles database setup check and starts both frontend and backend.

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}🚀 Starting WCAG Auditor Unified Environment${NC}"
echo -e "${BLUE}==============================================${NC}"

# Try to load NVM if it exists
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use 20 --silent || nvm use 18 --silent
elif [ -f "/usr/share/nvm/init-nvm.sh" ]; then
    source "/usr/share/nvm/init-nvm.sh"
    nvm use 20 --silent || nvm use 18 --silent
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️ Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

# Check Node version (Vite 7 requires Node 20+)
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}⚠️ Node.js version is $NODE_VERSION. Vite 7 requires v20 or higher.${NC}"
    echo -e "${BLUE}💡 We will attempt to run, but you may see errors. Recommended: nvm use 20${NC}"
fi

# Check for PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️ PostgreSQL is not installed. Please install it first.${NC}"
fi

# Check if database exists
# Use PGPASSWORD if set in environment, or just try
export PGPASSWORD=${DB_PASSWORD:-"ArmourAI@123"}
if ! psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw auditor_db; then
    echo -e "${YELLOW}📥 Database 'auditor_db' not found. Creating it...${NC}"
    createdb -h localhost -U postgres auditor_db || echo -e "${YELLOW}⚠️ Could not create database automatically. Please create it manually: createdb auditor_db${NC}"
    
    echo -e "${BLUE}🔧 Initializing database schema...${NC}"
    cd backend && npm run setup && cd ..
fi

# Install dependencies if node_modules missing
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd backend && npm install && cd ..
fi

echo -e "${GREEN}✨ Environment ready! Starting servers...${NC}"
echo -e "${BLUE}Frontend: http://localhost:5173${NC}"
echo -e "${BLUE}Backend:  http://localhost:3001${NC}"
echo -e "${BLUE}==============================================${NC}"

# Start both using concurrently
npm run dev

