# Email Service Testing Guide

## Prerequisites Setup

Before testing emails, you need to:

### 1. Get a Resend API Key

1. Go to [https://resend.com](https://resend.com) and sign up (free tier available)
2. Create an API key from the dashboard
3. Copy the API key (starts with `re_`)

### 2. Configure Environment Variables

Edit `apis/email-service/.env` and update:

```env
RESEND_API_KEY=re_YOUR_ACTUAL_API_KEY_HERE
```

The Supabase credentials are already configured.

### 3. Apply Database Migration

The email service needs database tables. Apply the migration:

```bash
# Option A: Using Supabase CLI (if you have it)
cd database
supabase db push

# Option B: Using Supabase Dashboard
# 1. Go to https://supabase.com/dashboard
# 2. Open your project
# 3. Go to SQL Editor
# 4. Copy contents of database/migrations/013_create_email_tables.sql
# 5. Run the SQL
```

### 4. Update Test Email Address

Edit `test-email-service.js` and replace all instances of `your-email@example.com` with your actual email address.

## Running the Test

### Step 1: Start the Email Service

```bash
cd apis/email-service
npm run dev
```

You should see:
```
Email Service listening on http://0.0.0.0:8080
📧 Email queue processor started (checking every 60s)
```

### Step 2: Run the Test Script

In a new terminal:

```bash
cd G:\code\@wizeworks\stumbleable
node test-email-service.js
```

### Step 3: Check Your Email

- Check your inbox (and spam folder!)
- You should receive 5 test emails:
  1. Welcome email
  2. Weekly trending discoveries
  3. Weekly new discoveries  
  4. Submission received confirmation
  5. Submission approved notification

## Preview Templates Without Sending

You can preview all email templates in a browser:

```bash
cd apis/email-service
npm run email:dev
```

This opens a preview server at `http://localhost:3000` where you can see all templates rendered.

## Testing Individual Email Types

You can also test individual emails using curl or Postman:

```bash
# Welcome Email
curl -X POST http://localhost:7006/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "welcome",
    "data": {
      "userName": "John Doe",
      "userId": "user-123"
    }
  }'

# Weekly Trending
curl -X POST http://localhost:7006/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "type": "weekly-trending",
    "data": {
      "userName": "John Doe",
      "discoveries": [
        {
          "id": "1",
          "title": "Amazing Discovery",
          "url": "https://example.com",
          "domain": "example.com",
          "imageUrl": "https://picsum.photos/800/400",
          "description": "This is amazing!",
          "topics": ["Tech"],
          "readTime": 5,
          "upvotes": 100,
          "views": 1000
        }
      ],
      "weekStart": "2025-09-25T00:00:00Z",
      "weekEnd": "2025-10-02T00:00:00Z"
    }
  }'
```

## Monitoring

### View Service Logs

The email service logs will show:
- Incoming email requests
- Queue processing activity
- Email sending attempts
- Success/failure status

### Check Queue Status

You can query the database to see queued emails:

```sql
SELECT * FROM email_queue ORDER BY created_at DESC LIMIT 10;
```

### Check Email Logs

See sent email history:

```sql
SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 10;
```

## Troubleshooting

### Email Service Won't Start

- Check that port 7006 is not in use
- Verify `.env` file exists with correct values
- Run `npm install` if dependencies are missing

### Emails Not Sending

1. Check Resend API key is valid
2. Verify database migration was applied
3. Check service logs for errors
4. Verify email addresses are valid
5. Check Resend dashboard for delivery status

### Emails Going to Spam

- This is normal for test emails from new domains
- In production, configure SPF, DKIM, and DMARC records
- Use a verified sending domain in Resend

## Next Steps

Once testing is successful:

1. ✅ Integrate welcome emails on user signup (user-service)
2. ✅ Add submission status emails (moderation-service)
3. ✅ Set up weekly email cron jobs
4. ✅ Build email preferences UI page
5. ✅ Build unsubscribe page

## Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email)
- Email templates: `apis/email-service/src/templates/`
