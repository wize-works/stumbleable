# Email Service

Comprehensive email notification system for Stumbleable.

## Overview

The Email Service handles all email communications including:
- Welcome emails and onboarding
- Weekly discovery digests (trending & new)
- Account deletion lifecycle
- Content submission notifications
- User engagement and re-engagement

## Features

- **React Email Templates**: Type-safe, component-based email templates
- **Resend Integration**: Modern email API with great deliverability
- **Queue System**: Reliable email delivery with retry logic
- **Scheduled Emails**: Weekly trending and new discovery emails
- **User Preferences**: Granular control over email subscriptions
- **Analytics**: Track opens, clicks, and engagement
- **Compliance**: CAN-SPAM and GDPR compliant

## Architecture

```
email-service/
├── src/
│   ├── server.ts              # Fastify server (port 8080)
│   ├── types.ts               # TypeScript types
│   ├── lib/
│   │   ├── resend.ts          # Resend client
│   │   ├── supabase.ts        # Database client
│   │   ├── queue.ts           # Email queue manager
│   │   └── scheduler.ts       # Weekly email scheduler
│   ├── routes/
│   │   ├── send.ts            # POST /api/send
│   │   ├── preferences.ts     # GET/PUT /api/preferences/:userId
│   │   └── scheduled.ts       # POST /api/scheduled/trigger
│   └── templates/
│       ├── welcome.tsx
│       ├── weekly-trending.tsx
│       ├── weekly-new.tsx
│       ├── deletion-*.tsx
│       ├── submission-*.tsx
│       └── components/
│           ├── EmailLayout.tsx
│           ├── Button.tsx
│           └── DiscoveryCard.tsx
```

## Email Types

### Account Lifecycle
- `welcome` - Sent on signup
- `deletion-request` - Deletion request confirmation
- `deletion-reminder-7d` - 7 days before deletion
- `deletion-reminder-1d` - 1 day before deletion
- `deletion-complete` - After permanent deletion
- `deletion-cancelled` - Deletion cancelled

### Weekly Digests
- `weekly-trending` - Top 5 trending discoveries (Mondays 10 AM)
- `weekly-new` - 5 newest discoveries (Thursdays 10 AM)

### Content Submissions
- `submission-received` - Submission confirmation
- `submission-approved` - Content approved
- `submission-rejected` - Content rejected

### Engagement
- `saved-digest` - Weekly saved content summary
- `re-engagement` - Inactive user reminder

## API Endpoints

### POST /api/send
Send an email (adds to queue).

```typescript
{
  userId: string;
  emailType: string;
  recipientEmail: string;
  templateData: Record<string, any>;
  scheduledAt?: Date; // optional, defaults to now
}
```

### GET /api/preferences/:userId
Get user's email preferences.

### PUT /api/preferences/:userId
Update user's email preferences.

```typescript
{
  weekly_trending: boolean;
  weekly_new: boolean;
  saved_digest: boolean;
  submission_updates: boolean;
  re_engagement: boolean;
  account_notifications: boolean;
}
```

### POST /api/scheduled/trigger
Trigger scheduled email job (called by cron).

```typescript
{
  jobType: 'weekly-trending' | 'weekly-new';
}
```

## Environment Variables

```env
# Resend Configuration
RESEND_API_KEY=re_xxx

# Email Settings
EMAIL_FROM_ADDRESS=noreply@stumbleable.com
EMAIL_FROM_NAME=Stumbleable

# URLs
FRONTEND_URL=http://localhost:3000
UNSUBSCRIBE_URL=http://localhost:3000/email/unsubscribe

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Server
PORT=8080
HOST=0.0.0.0
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Preview email templates
npm run email:dev

# Build for production
npm run build

# Start production server
npm start
```

## Email Queue

The service uses a database-backed queue for reliability:

1. Email is added to `email_queue` table
2. Queue processor picks up pending emails
3. Email is sent via Resend
4. Status updated to `sent` or `failed`
5. Failed emails retry with exponential backoff
6. All sends logged in `email_logs` table

## Scheduled Emails

Weekly emails are triggered by calling the `/api/scheduled/trigger` endpoint:

- **Mondays 10 AM**: Trending discoveries email
- **Thursdays 10 AM**: New discoveries email

Set up a cron job or use Supabase pg_cron to trigger these endpoints.

## Testing

### Preview Templates
```bash
npm run email:dev
```

Navigate to http://localhost:3000 to preview all email templates.

### Send Test Email
```bash
curl -X POST http://localhost:7006/api/send \\
  -H "Content-Type: application/json" \\
  -d '{
    "userId": "user-id",
    "emailType": "welcome",
    "recipientEmail": "test@example.com",
    "templateData": {
      "firstName": "John",
      "preferredTopics": ["technology", "science"]
    }
  }'
```

## Deployment

### Docker
```bash
docker build -t email-service .
docker run -p 7006:8080 --env-file .env email-service
```

### Kubernetes
See `k8s/base/email-service.yaml` for deployment configuration.

## Compliance

### CAN-SPAM Act
- ✅ Unsubscribe link in all emails
- ✅ Physical address in footer
- ✅ Accurate subject lines
- ✅ Clear identification as advertisement (where applicable)

### GDPR
- ✅ Explicit consent for marketing emails
- ✅ Easy unsubscribe process
- ✅ Data retention policies
- ✅ Privacy policy links

## Support

For issues or questions about the email service:
- Check service logs: `kubectl logs -f email-service-xxx`
- Check email queue: Query `email_queue` table
- Verify Resend API status: https://status.resend.com
