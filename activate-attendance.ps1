# Attendance System - Quick Activation Script
# Run this in PowerShell to activate the new attendance system

Write-Host "🎯 Activating Professional Attendance System..." -ForegroundColor Cyan
Write-Host ""

$projectPath = "h:\Coding Nexus official"
Set-Location $projectPath

# Backup old files
Write-Host "📦 Creating backups of old components..." -ForegroundColor Yellow
if (Test-Path "src\components\admin\AttendanceManager.jsx") {
    Copy-Item "src\components\admin\AttendanceManager.jsx" "src\components\admin\AttendanceManager_Old.jsx" -Force
    Write-Host "✅ Backed up old admin component" -ForegroundColor Green
}

if (Test-Path "src\components\student\AttendanceView.jsx") {
    Copy-Item "src\components\student\AttendanceView.jsx" "src\components\student\AttendanceView_Old.jsx" -Force
    Write-Host "✅ Backed up old student component" -ForegroundColor Green
}

# Activate new components
Write-Host ""
Write-Host "🚀 Activating new components..." -ForegroundColor Yellow

if (Test-Path "src\components\admin\AttendanceManager_New.jsx") {
    Copy-Item "src\components\admin\AttendanceManager_New.jsx" "src\components\admin\AttendanceManager.jsx" -Force
    Write-Host "✅ Activated new admin component" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: AttendanceManager_New.jsx not found" -ForegroundColor Red
}

if (Test-Path "src\components\student\AttendanceView_New.jsx") {
    Copy-Item "src\components\student\AttendanceView_New.jsx" "src\components\student\AttendanceView.jsx" -Force
    Write-Host "✅ Activated new student component" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: AttendanceView_New.jsx not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "✨ Activation Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Restart your development server: npm run dev" -ForegroundColor White
Write-Host "2. Open your browser and test the new attendance system" -ForegroundColor White
Write-Host "3. Check ATTENDANCE_SYSTEM_SUMMARY.md for features" -ForegroundColor White
Write-Host ""
Write-Host "Your professional attendance system is ready!" -ForegroundColor Green
