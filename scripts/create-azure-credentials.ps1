# Stumbleable - Azure Service Principal Creator
# This script creates the Azure service principal for GitHub Actions

Write-Host "`n🔐 Azure Service Principal Creator" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "✅ Azure CLI detected: $($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
Write-Host "`nChecking Azure login status..." -ForegroundColor Yellow
$account = az account show 2>$null
if (-not $account) {
    Write-Host "Not logged in. Logging in..." -ForegroundColor Yellow
    az login
} else {
    $accountInfo = $account | ConvertFrom-Json
    Write-Host "✅ Logged in as: $($accountInfo.user.name)" -ForegroundColor Green
    Write-Host "✅ Subscription: $($accountInfo.name) ($($accountInfo.id))" -ForegroundColor Green
}

# Get current subscription
$subscription = az account show | ConvertFrom-Json
$subscriptionId = $subscription.id
$subscriptionName = $subscription.name

Write-Host "`n📋 Current Azure Subscription:" -ForegroundColor Cyan
Write-Host "   Name: $subscriptionName" -ForegroundColor White
Write-Host "   ID: $subscriptionId" -ForegroundColor White

# Prompt for resource group
Write-Host "`n📦 Resource Group Information:" -ForegroundColor Cyan
$resourceGroup = Read-Host "Enter your AKS resource group name"

if (-not $resourceGroup) {
    Write-Host "❌ Resource group name is required!" -ForegroundColor Red
    exit 1
}

# Verify resource group exists
$rgExists = az group exists --name $resourceGroup
if ($rgExists -eq "false") {
    Write-Host "❌ Resource group '$resourceGroup' not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Resource group '$resourceGroup' found" -ForegroundColor Green

# Create service principal name
$spName = "stumbleable-github-actions-$(Get-Date -Format 'yyyyMMdd')"

Write-Host "`n🔑 Creating Service Principal..." -ForegroundColor Cyan
Write-Host "   Name: $spName" -ForegroundColor White
Write-Host "   Role: Contributor" -ForegroundColor White
Write-Host "   Scope: /subscriptions/$subscriptionId/resourceGroups/$resourceGroup" -ForegroundColor White

# Create the service principal
try {
    $credentials = az ad sp create-for-rbac `
        --name $spName `
        --role contributor `
        --scopes "/subscriptions/$subscriptionId/resourceGroups/$resourceGroup" `
        --sdk-auth `
        2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create service principal"
    }
    
    Write-Host "`n✅ Service Principal created successfully!" -ForegroundColor Green
    
    # Parse the credentials JSON
    $credsJson = $credentials | ConvertFrom-Json
    
    # Display the credentials
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "   AZURE_CREDENTIALS Secret Value" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`n📋 Copy this ENTIRE JSON to GitHub Secrets:" -ForegroundColor Magenta
    Write-Host "`n$credentials`n" -ForegroundColor White
    
    # Display other GitHub secrets
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Other GitHub Secrets Needed" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "ACR_NAME=" -NoNewline -ForegroundColor Yellow
    Write-Host "<your-acr-name>" -ForegroundColor Gray
    
    Write-Host "AKS_CLUSTER_NAME=" -NoNewline -ForegroundColor Yellow
    Write-Host "<your-aks-cluster-name>" -ForegroundColor Gray
    
    Write-Host "AKS_RESOURCE_GROUP=" -NoNewline -ForegroundColor Yellow
    Write-Host "$resourceGroup" -ForegroundColor White
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "   Next Steps" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    Write-Host "1. Go to GitHub → Settings → Secrets and variables → Actions" -ForegroundColor White
    Write-Host "2. Click 'New repository secret'" -ForegroundColor White
    Write-Host "3. Name: " -NoNewline -ForegroundColor White
    Write-Host "AZURE_CREDENTIALS" -ForegroundColor Green
    Write-Host "4. Value: " -NoNewline -ForegroundColor White
    Write-Host "Paste the JSON above" -ForegroundColor Green
    Write-Host "5. Add the other secrets listed above" -ForegroundColor White
    Write-Host "6. Add your Supabase and Clerk secrets (see QUICK_DEPLOY.md)" -ForegroundColor White
    
    Write-Host "`n✅ Setup complete! You're ready to deploy.`n" -ForegroundColor Green
    
    # Save to file for reference
    $outputFile = "azure-credentials.json"
    $credentials | Out-File -FilePath $outputFile -Encoding UTF8
    Write-Host "💾 Credentials saved to: $outputFile" -ForegroundColor Cyan
    Write-Host "⚠️  IMPORTANT: Keep this file secure and delete it after adding to GitHub!" -ForegroundColor Red
    
} catch {
    Write-Host "`n❌ Failed to create service principal:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nCommon issues:" -ForegroundColor Yellow
    Write-Host "  - You need 'Application Administrator' or 'Global Administrator' role" -ForegroundColor Gray
    Write-Host "  - Your account needs permissions to create service principals" -ForegroundColor Gray
    Write-Host "  - The resource group must exist" -ForegroundColor Gray
    exit 1
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
