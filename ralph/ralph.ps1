# ralph.ps1 - Automated PRD implementation runner for Windows
param(
    [Parameter(Mandatory=$true)]
    [int]$Iterations
)

$ErrorActionPreference = "Continue"

# Change to project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
Set-Location $ProjectRoot

Write-Host "Working directory: $(Get-Location)" -ForegroundColor Cyan

# Create progress.txt if it doesn't exist
if (-not (Test-Path "ralph/progress.txt")) {
    "# Progress Log" | Out-File -FilePath "ralph/progress.txt" -Encoding UTF8
}

$Prompt = '@ralph/prd.json @ralph/progress.txt Work on the highest priority feature (you decide which). Check types via npm run typecheck. Update prd.json (set passes: true when complete). Append progress to ralph/progress.txt. ONLY WORK ON A SINGLE FEATURE. If PRD is complete output <promise>COMPLETE</promise>.'

for ($i = 1; $i -le $Iterations; $i++) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Iteration $i of $Iterations" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""

    try {
        # Use cmd to properly escape the prompt
        $result = cmd /c "claude -p --permission-mode acceptEdits `"$Prompt`"" 2>&1 | Out-String
        Write-Host $result

        if ($result -match "<promise>COMPLETE</promise>") {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "PRD complete after $i iterations!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            exit 0
        }
    }
    catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Completed $Iterations iterations. PRD not yet complete." -ForegroundColor Cyan
Write-Host "========================================"
