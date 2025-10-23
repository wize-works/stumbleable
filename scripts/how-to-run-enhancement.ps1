# 🚀 How to Run Metadata Enhancement

Write-Host "📋 Step-by-Step Guide to Run Metadata Enhancement" -ForegroundColor Yellow

Write-Host "`n🔧 Step 1: Install Dependencies" -ForegroundColor Cyan
Write-Host "Navigate to discovery service and install dependencies:" -ForegroundColor White
Write-Host "cd apis/discovery-service" -ForegroundColor Gray
Write-Host "npm install" -ForegroundColor Gray

Write-Host "`n🌐 Step 2: Set Environment Variables" -ForegroundColor Cyan
Write-Host "Make sure you have these in your .env file:" -ForegroundColor White
Write-Host "SUPABASE_URL=your_supabase_project_url" -ForegroundColor Gray
Write-Host "SUPABASE_SERVICE_KEY=your_supabase_service_key" -ForegroundColor Gray
Write-Host "PORT=7001" -ForegroundColor Gray
Write-Host "NODE_ENV=development" -ForegroundColor Gray

Write-Host "`n🚀 Step 3: Start the Discovery Service" -ForegroundColor Cyan
Write-Host "From the root project directory:" -ForegroundColor White
Write-Host "npm run dev:discovery" -ForegroundColor Gray
Write-Host "OR from apis/discovery-service directory:" -ForegroundColor White
Write-Host "npm run dev" -ForegroundColor Gray

Write-Host "`n✅ Step 4: Verify Service is Running" -ForegroundColor Cyan
Write-Host "Check the health endpoint:" -ForegroundColor White
Write-Host "curl http://localhost:7001/health" -ForegroundColor Gray

Write-Host "`n📊 Step 5: Check Enhancement Status" -ForegroundColor Cyan
Write-Host "See how many records need enhancement:" -ForegroundColor White
Write-Host "curl http://localhost:7001/api/enhance/status" -ForegroundColor Gray

Write-Host "`n🎯 Step 6: Run Enhancement (Small Test)" -ForegroundColor Cyan
Write-Host "Start with a small batch of 3 records:" -ForegroundColor White
$testCommand = 'curl -X POST "http://localhost:7001/api/enhance/metadata" -H "Content-Type: application/json" -d "{\"batchSize\": 3}"'
Write-Host $testCommand -ForegroundColor Gray

Write-Host "`n📈 Step 7: Scale Up (Optional)" -ForegroundColor Cyan
Write-Host "Once testing works, process larger batches:" -ForegroundColor White
$scaleCommand = 'curl -X POST "http://localhost:7001/api/enhance/metadata" -H "Content-Type: application/json" -d "{\"batchSize\": 10}"'
Write-Host $scaleCommand -ForegroundColor Gray

Write-Host "`n🛠️ Alternative: Using PowerShell (Windows)" -ForegroundColor Magenta
Write-Host "If curl doesn't work, use PowerShell:" -ForegroundColor White

$psCommand = @'
$body = @{ batchSize = 3 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:7001/api/enhance/metadata" -Method POST -Body $body -ContentType "application/json"
'@
Write-Host $psCommand -ForegroundColor Gray

Write-Host "`n📱 Using a REST Client (Recommended)" -ForegroundColor Blue
Write-Host "You can also use:" -ForegroundColor White
Write-Host "• Postman" -ForegroundColor Gray
Write-Host "• Insomnia" -ForegroundColor Gray
Write-Host "• VS Code REST Client extension" -ForegroundColor Gray
Write-Host "• Thunder Client (VS Code)" -ForegroundColor Gray

Write-Host "`n🔍 Monitor Progress" -ForegroundColor Yellow
Write-Host "Watch the discovery service logs to see:" -ForegroundColor White
Write-Host "• URLs being processed" -ForegroundColor Gray
Write-Host "• Metadata extraction results" -ForegroundColor Gray
Write-Host "• Any errors or failures" -ForegroundColor Gray

Write-Host "`n⚠️ Important Notes:" -ForegroundColor Red
Write-Host "• Process records in small batches (3-10 at a time)" -ForegroundColor Yellow
Write-Host "• Each request has rate limiting (500ms between URLs)" -ForegroundColor Yellow
Write-Host "• Some websites may block or fail - this is normal" -ForegroundColor Yellow
Write-Host "• Processing 2000 records will take time (~15-30 minutes total)" -ForegroundColor Yellow

Write-Host "`n🎉 Expected Results:" -ForegroundColor Green
Write-Host "You'll see JSON responses like:" -ForegroundColor White
Write-Host @'
{
  "message": "Metadata enhancement completed",
  "processed": 3,
  "enhanced": 2,
  "results": [
    {
      "id": "uuid-here",
      "url": "https://example.com",
      "status": "enhanced",
      "fieldsAdded": ["imageUrl", "author", "contentText", "wordCount"]
    }
  ]
}
'@ -ForegroundColor Gray

Write-Host "`n🔄 Want to automate this?" -ForegroundColor Cyan
Write-Host "I can create a PowerShell script to process all records automatically!"