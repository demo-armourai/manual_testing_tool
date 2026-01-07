# Auditor - Windows Start Script

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🚀 Starting WCAG Auditor Unified Environment" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Check Node.js
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js v20+." -ForegroundColor Red
    exit 1
}

# 2. Check Database Configuration
if (-not (Test-Path "backend\.env")) {
    Write-Host "⚠️  backend\.env not found!" -ForegroundColor Yellow
} else {
    Write-Host "✅ Backend configuration found." -ForegroundColor Green
}

Write-Host "`n⚠️  IMPORTANT: Database Setup" -ForegroundColor Yellow
Write-Host "   ensure your local PostgreSQL is running and you have created the database:"
Write-Host "   Database Name: auditor_db" -ForegroundColor Gray
Write-Host "   Credentials:   Check backend/.env (Default: postgres / ArmourAI@123)" -ForegroundColor Gray

# 3. Install Dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "`n📦 Installing Frontend dependencies..." -ForegroundColor Cyan
    npm install
}

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "`n📦 Installing Backend dependencies..." -ForegroundColor Cyan
    Push-Location backend
    npm install
    Pop-Location
}

# 4. Initialize Database
Write-Host "`n🔄 Attempting to initialize database tables..." -ForegroundColor Cyan
Write-Host "   (This might fail if 'auditor_db' does not exist or password is wrong)" -ForegroundColor Gray
try {
    # We run setup from root which calls backend setup
    npm run setup
    Write-Host "✅ Database initialization step completed." -ForegroundColor Green
} catch {
    Write-Host "⚠️  Database setup warning. If tables exist, this is fine." -ForegroundColor Yellow
    Write-Host "   Error details: $_" -ForegroundColor Gray
}

# 5. Start Development Servers
Write-Host "`n✨ Starting Servers..." -ForegroundColor Green
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

npm run dev
