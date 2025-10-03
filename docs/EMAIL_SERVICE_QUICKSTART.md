# Email Service Quick Start & Test Guide

## Issue Identified
The email service is not starting because:
1. It's trying to use port 8080 instead of 7006
2. The .env file has PORT=7006, but it's not being loaded properly
3. Port 8080 is already in use by another service

## Solution: Restart All Services

Since you're running `npm run dev` from the root, you need to restart it so the email service picks up the correct configuration.

### Step 1: Stop Current Dev Process
Press `Ctrl+C` in the terminal running `npm run dev`

### Step 2: Restart All Services
```powershell
cd G:\code\@wizeworks\stumbleable
npm run dev
```

The email service should now start on port 7006 along with all other services.

### Step 3: Verify Email Service is Running
In a new terminal:
```powershell
curl http://localhost:7006/health
```

You should see:
```json
{
  "status": "healthy",
  "service": "email-service",
  "timestamp": "..."
}
```

### Step 4: Send Test Welcome Email
```powershell
node test-welcome-email.js
```

This will send a welcome email to bryan@wize.works

## Alternative: Run Email Service Separately

If you don't want to restart everything:

```powershell
# In a new terminal
cd G:\code\@wizeworks\stumbleable\apis\email-service
npm run dev
```

This will start just the email service on port 7006.

## What to Expect

Once the email service is running:
1. You'll see startup message with port 7006
2. Background queue processor will start (checks every 60 seconds)
3. Test script will queue a welcome email
4. Within 60 seconds, the email will be sent via Resend
5. Check your inbox (and spam folder) for the welcome email

## Troubleshooting

### If port 7006 is in use:
```powershell
netstat -ano | findstr :7006
```
Find the PID and kill it or change the port in .env

### If email doesn't arrive:
1. Check email service logs for errors
2. Verify Resend API key is valid
3. Check spam folder
4. Query the database to see if email was sent:
```sql
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 5;
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;
```

### If you get CORS errors:
The service is configured with CORS for localhost:3000, so direct API calls should work.

## Next Steps After Test

Once the welcome email works:
1. Test other email types (weekly trending, submission received, etc.)
2. Build email preferences UI
3. Integrate with user-service for auto-welcome emails
4. Set up cron jobs for weekly emails

