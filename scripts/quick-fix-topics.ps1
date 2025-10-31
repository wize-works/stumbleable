#!/usr/bin/env pwsh
# Quick Fix Script for Topic Alignment
# Run this to fix all topic alignment issues in one go

Write-Host "🚀 Stumbleable Topic Alignment - Quick Fix" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "📊 Step 0: Baseline Analysis" -ForegroundColor Yellow
Write-Host "Analyzing current topic alignment...`n"
npx tsx analyze-topic-alignment.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Analysis failed! Check environment variables.`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "🔄 Step 1: Sync JSONB → Junction Table (906 items)" -ForegroundColor Yellow
Write-Host "Syncing topics from JSONB column to junction table...`n"
npx tsx sync-jsonb-to-junction.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ JSONB sync failed!`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "🔄 Step 2: Sync Junction → JSONB (629 items)" -ForegroundColor Yellow
Write-Host "Syncing topics from junction table to JSONB column...`n"
npx tsx sync-junction-to-jsonb.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Junction sync failed!`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "📊 Step 3: Verify Sync Success" -ForegroundColor Yellow
Write-Host "Checking alignment after sync...`n"
npx tsx analyze-topic-alignment.ts

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "🎯 Step 4: Backfill Unclassified Content (~39,877 items)" -ForegroundColor Yellow
Write-Host "This will take 30-60 minutes...`n" -ForegroundColor Gray
Write-Host "⏳ Starting classification process...`n"
npx tsx backfill-topics.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️  Backfill encountered errors, but may have completed partially.`n" -ForegroundColor Yellow
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

Write-Host "✅ Step 5: Final Verification" -ForegroundColor Green
Write-Host "Analyzing final topic alignment...`n"
npx tsx analyze-topic-alignment.ts

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
Write-Host "🎉 Topic Alignment Fix Complete!`n" -ForegroundColor Green
Write-Host "Expected Results:" -ForegroundColor Cyan
Write-Host "  ✓ ~41,478 items with topics in BOTH JSONB and Junction table" -ForegroundColor Green
Write-Host "  ✓ 100% content coverage" -ForegroundColor Green
Write-Host "  ✓ 0 items without topics`n" -ForegroundColor Green
