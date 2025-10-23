# Automated Metadata Enhancement Runner
Write-Host "Automated Metadata Enhancement for Stumbleable" -ForegroundColor Green

$crawlerServiceUrl = "http://localhost:7004"

# Function to check if service is running
function Test-ServiceHealth {
    try {
        $response = Invoke-RestMethod -Uri "$crawlerServiceUrl/health" -Method GET -TimeoutSec 5
        return $response.status -eq "healthy"
    } catch {
        return $false
    }
}

# Function to get enhancement status
function Get-EnhancementStatus {
    try {
        $response = Invoke-RestMethod -Uri "$crawlerServiceUrl/api/enhance/status" -Method GET
        return $response
    } catch {
        Write-Host "Failed to get enhancement status: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Function to run enhancement batch
function Start-EnhancementBatch {
    param([int]$BatchSize = 100)
    
    try {
        $body = @{ batchSize = $BatchSize } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$crawlerServiceUrl/api/enhance/metadata" -Method POST -Body $body -ContentType "application/json"
        return $response
    } catch {
        Write-Host "Failed to run enhancement: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

Write-Host "Step 1: Checking if Crawler Service is running..." -ForegroundColor Cyan

if (Test-ServiceHealth) {
    Write-Host "Crawler Service is running!" -ForegroundColor Green
} else {
    Write-Host "Crawler Service is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start it first:" -ForegroundColor Yellow
    Write-Host "1. Open a new terminal" -ForegroundColor White
    Write-Host "2. Run: npm run dev:crawler" -ForegroundColor Gray
    Write-Host "3. Wait for it to start, then run this script again" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Step 2: Getting current enhancement status..." -ForegroundColor Cyan

$status = Get-EnhancementStatus
if ($status) {
    Write-Host "Current Status:" -ForegroundColor Yellow
    Write-Host "   Total Content: $($status.total_content)" -ForegroundColor White
    Write-Host "   Needs Enhancement: $($status.needs_enhancement)" -ForegroundColor Red
    Write-Host "   Has Images: $($status.has_image)" -ForegroundColor Green
    Write-Host "   Has Authors: $($status.has_author)" -ForegroundColor Green
    Write-Host "   Has Content: $($status.has_content)" -ForegroundColor Green
    Write-Host "   Has Word Count: $($status.has_word_count)" -ForegroundColor Green
} else {
    Write-Host "Could not get status, but continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Running enhancement test (3 records)..." -ForegroundColor Cyan

$result = Start-EnhancementBatch -BatchSize 3

if ($result) {
    Write-Host "Enhancement completed!" -ForegroundColor Green
    Write-Host "   Processed: $($result.processed)" -ForegroundColor White
    Write-Host "   Enhanced: $($result.enhanced)" -ForegroundColor Green
    
    if ($result.results) {
        Write-Host ""
        Write-Host "Results:" -ForegroundColor Yellow
        foreach ($item in $result.results) {
            $statusColor = switch ($item.status) {
                "enhanced" { "Green" }
                "no_metadata_found" { "Yellow" }
                "error" { "Red" }
                default { "White" }
            }
            Write-Host "   $($item.status.ToUpper()): $($item.url)" -ForegroundColor $statusColor
            if ($item.fieldsAdded) {
                Write-Host "     Added: $($item.fieldsAdded -join ', ')" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host ""
    Write-Host "Test successful! You can now:" -ForegroundColor Green
    Write-Host "1. Run larger batches with more records" -ForegroundColor White
    Write-Host "2. Check your Supabase content table to see the updates" -ForegroundColor White
    Write-Host "3. Use the enhanced metadata in your discovery cards" -ForegroundColor White
    
} else {
    Write-Host "Enhancement failed - check the discovery service logs" -ForegroundColor Red
}

Write-Host ""
Write-Host "Want to process more records? Run:" -ForegroundColor Blue
Write-Host '$body = @{ batchSize = 10 } | ConvertTo-Json' -ForegroundColor Gray
Write-Host 'Invoke-RestMethod -Uri "http://localhost:7004/api/enhance/metadata" -Method POST -Body $body -ContentType "application/json"' -ForegroundColor Gray