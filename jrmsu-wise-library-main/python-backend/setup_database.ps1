# JRMSU Library Database Setup Script
# PowerShell version with better error handling

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "JRMSU Library Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL is installed
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysqlPath) {
    Write-Host "❌ ERROR: MySQL not found in PATH" -ForegroundColor Red
    Write-Host "Please install MySQL or add it to your system PATH" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ MySQL found: $($mysqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Check if SQL file exists
$sqlFile = "create_missing_tables.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ ERROR: $sqlFile not found" -ForegroundColor Red
    Write-Host "Please ensure you're in the correct directory" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ SQL file found: $sqlFile" -ForegroundColor Green
Write-Host ""

# Prompt for MySQL password
Write-Host "Creating missing database tables..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Please enter your MySQL root password:" -ForegroundColor Cyan

# Run MySQL command
try {
    mysql -u root -p jrmsu_library < $sqlFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ Setup complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Database tables created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run: python app.py" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ ERROR: MySQL command failed" -ForegroundColor Red
        Write-Host "Please check your MySQL credentials and try again" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

pause
