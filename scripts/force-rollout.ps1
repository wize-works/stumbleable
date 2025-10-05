# Force rollout of all Stumbleable services in AKS
# Use this script if automatic deployments fail on Windows

param(
    [string]$Namespace = "stumbleable"
)

Write-Host "🔄 Forcing rollout of all services in namespace: $Namespace" -ForegroundColor Cyan
Write-Host ""

$services = @(
    "ui-portal",
    "discovery-service",
    "interaction-service",
    "user-service",
    "crawler-service",
    "moderation-service"
)

foreach ($service in $services) {
    Write-Host "📦 Restarting deployment: $service" -ForegroundColor Yellow
    kubectl rollout restart "deployment/$service" -n $Namespace
    
    Write-Host "⏳ Waiting for rollout to complete..." -ForegroundColor Gray
    kubectl rollout status "deployment/$service" -n $Namespace --timeout=3m
    
    Write-Host "✅ $service rolled out successfully" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🎉 All services rolled out successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Current pod status:" -ForegroundColor Cyan
kubectl get pods -n $Namespace -o wide

Write-Host ""
Write-Host "🔍 Recent deployment revisions:" -ForegroundColor Cyan
foreach ($service in $services) {
    Write-Host "--- $service ---" -ForegroundColor Yellow
    kubectl rollout history "deployment/$service" -n $Namespace | Select-Object -Last 4
}
