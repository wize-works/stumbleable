# Content Quality & Safety System Documentation

## Overview
The Content Quality & Safety System protects Stumbleable from spam, inappropriate content, and low-quality submissions through automated filtering and manual moderation workflows.

## Architecture

### Components
1. **Content Moderation Service** (`apis/discovery-service/src/lib/moderation.ts`)
2. **Content Submission with Moderation** (`apis/discovery-service/src/routes/submit.ts`)
3. **Moderation Queue API** (`apis/discovery-service/src/routes/moderation.ts`)
4. **Content Reports API** (`apis/discovery-service/src/routes/reports.ts`)
5. **Admin Moderation UI** (`ui/portal/app/admin/moderation/page.tsx`)
6. **User Report Button** (`ui/portal/components/report-content-button.tsx`)

### Database Tables
- **`domain_reputation`** - Tracks quality scores for domains (0.0-1.0)
- **`moderation_queue`** - Content pending manual review
- **`content_reports`** - User-generated reports of inappropriate content

## Content Safety Features

### 1. NSFW Detection
Automatically flags content containing adult/explicit keywords or domains:
- Keywords: porn, xxx, sex, nude, adult, explicit, mature, erotic
- Domain patterns: .xxx, adult, porn domains
- **Action**: Automatic rejection

### 2. Violence/Harmful Content Detection
Flags potentially dangerous or hateful content:
- Keywords: violence, kill, murder, suicide, hate, terrorist, nazi
- **Action**: Automatic rejection

### 3. Spam Detection
Identifies promotional and low-quality content:
- **SEO Spam**: backlinks, rank higher, guaranteed traffic
- **Promotional**: buy now, limited time, make money, work from home
- **Quality Issues**: 
  - Title too short (< 10 characters)
  - Excessive capitalization (> 50%)
  - Repetitive patterns
- **Actions**:
  - High confidence (> 0.7): Automatic rejection
  - Medium confidence (0.4-0.7): Manual review
  - Low confidence (< 0.4): Approved with monitoring

### 4. Domain Reputation System
Tracks submission quality by domain:
- **Score**: 0.0 to 1.0 (1.0 = highest quality)
- **Metrics**:
  - `submission_count`: Total submissions from domain
  - `flagged_count`: Number of rejected submissions
  - `score`: Calculated as `1.0 - (flagged_count / submission_count)`
- **Impact**: Domains with score < 0.3 trigger manual review

## Content Submission Flow

```
1. Content Submitted (POST /api/submit)
   ↓
2. URL Validation & Sanitization
   ↓
3. Metadata Extraction (title, description, domain)
   ↓
4. Content Moderation Check
   ├─ Safety Check (NSFW, violence)
   ├─ Spam Detection
   └─ Domain Reputation Check
   ↓
5. Moderation Decision
   ├─ REJECT → Return 400 error with reasons
   ├─ REVIEW → Add to moderation queue (202 response)
   └─ APPROVE → Create content, return 201 with content
   ↓
6. Update Domain Reputation
```

## Moderation Decision Logic

### Automatic Rejection
Content is rejected if:
- Contains NSFW keywords
- Contains violence/hate keywords
- Suspicious domain (.xxx, adult, etc.)
- Spam confidence > 0.7

### Manual Review Required
Content needs review if:
- Spam confidence 0.4-0.7
- Domain reputation score < 0.3
- Multiple quality issues detected
- Edge cases and ambiguous content

### Automatic Approval
Content is approved if:
- All safety checks pass
- Spam confidence < 0.4
- Domain reputation > 0.3
- No critical issues detected

## API Endpoints

### Content Submission
```http
POST /api/submit
Content-Type: application/json

{
  "url": "https://example.com/article",
  "title": "Article Title",
  "description": "Article description",
  "topics": ["technology", "science"]
}

# Responses:
# 201 - Approved and published
# 202 - Pending manual review
# 400 - Rejected due to safety/quality issues
# 409 - Content already exists
```

### Moderation Queue
```http
# Get pending items
GET /api/moderation/queue?status=pending&limit=20

# Get specific item
GET /api/moderation/queue/:itemId

# Make moderation decision
POST /api/moderation/queue/:itemId/decide
{
  "decision": "approve" | "reject",
  "moderatorNotes": "Optional notes",
  "moderatorId": "uuid"
}

# Bulk moderation
POST /api/moderation/queue/bulk
{
  "itemIds": ["uuid1", "uuid2"],
  "decision": "approve" | "reject",
  "moderatorId": "uuid"
}

# Get moderation statistics
GET /api/moderation/stats
```

### Content Reports
```http
# Submit user report
POST /api/reports
{
  "contentId": "uuid",
  "reason": "spam" | "inappropriate" | "broken" | "offensive" | "copyright" | "other",
  "description": "Optional details",
  "userId": "uuid"
}

# Get reports
GET /api/reports?status=pending

# Resolve report
PATCH /api/reports/:reportId
{
  "status": "resolved" | "dismissed",
  "moderatorNotes": "Optional notes",
  "moderatorId": "uuid"
}

# Get report statistics
GET /api/reports/stats
```

## Admin Moderation Interface

### Access
- **URL**: `/admin/moderation`
- **Requirements**: Admin/moderator account (email contains "admin" or "moderator")
- **Features**:
  - View pending moderation queue
  - View user content reports
  - Approve/reject content with one click
  - Add moderator notes
  - See confidence scores and detected issues

### Moderation Queue Tab
Shows content pending review with:
- Title, URL, description
- Detected issues (badges)
- Confidence score
- Domain information
- Submission timestamp
- Approve/Reject actions

### Content Reports Tab
Shows user-reported content with:
- Content title and URL
- Report reason (spam, inappropriate, etc.)
- User-provided description
- Report timestamp
- Resolve/Dismiss actions

## User Reporting

Users can report inappropriate content from any content card using the Report button:

1. Click "Report" button on content
2. Select reason:
   - Spam or promotional content
   - Inappropriate content
   - Broken link or not working
   - Offensive or hateful content
   - Copyright violation
   - Other issue
3. Optionally add description
4. Submit report

Reports are immediately visible in the admin moderation interface.

## Domain Reputation Management

### Automatic Updates
Domain reputation updates automatically:
- **On submission**: `submission_count++`
- **On rejection**: `flagged_count++`, `score -= 0.1`
- **Score calculation**: `max(0.1, 1.0 - flagged_ratio)`

### Reputation Impact
- **High (0.7-1.0)**: Auto-approve
- **Medium (0.3-0.7)**: Normal review
- **Low (0.0-0.3)**: Strict review, flag submissions

### Manual Overrides
Moderators can adjust domain reputation through moderation decisions:
- Approving content from low-reputation domain improves its score
- Rejecting content lowers domain reputation

## Testing

### Test Spam Detection
```powershell
$spamContent = @{
    url = "https://spam-site.com/offer"
    title = "BUY NOW !!! LIMITED TIME"
    description = "CLICK HERE! Make money fast!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:7001/api/submit" `
  -Method POST -Body $spamContent -ContentType "application/json"
# Expected: 202 (pending review)
```

### Test NSFW Rejection
```powershell
$nsfwContent = @{
    url = "https://bad-site.xxx/content"
    title = "Adult explicit content"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:7001/api/submit" `
  -Method POST -Body $nsfwContent -ContentType "application/json"
# Expected: 400 (rejected)
```

### Test Clean Content
```powershell
$cleanContent = @{
    url = "https://wikipedia.org/wiki/AI"
    title = "Artificial Intelligence - Wikipedia"
    description = "Overview of artificial intelligence"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:7001/api/submit" `
  -Method POST -Body $cleanContent -ContentType "application/json"
# Expected: 201 (approved and published)
```

## Configuration

### Safety Thresholds
Located in `apis/discovery-service/src/lib/moderation.ts`:

```typescript
// Spam detection threshold
const SPAM_REJECT_THRESHOLD = 0.7;  // Auto-reject above this
const SPAM_REVIEW_THRESHOLD = 0.4;  // Manual review above this

// Domain reputation threshold
const LOW_REPUTATION_THRESHOLD = 0.3;  // Flag domains below this

// Content quality minimums
const MIN_TITLE_LENGTH = 10;
const MIN_TITLE_WORDS = 3;
const MAX_CAPS_RATIO = 0.5;
```

### Keyword Lists
Add/remove keywords in the `ContentModerationService` class:
- `nsfwKeywords`: NSFW content detection
- `violenceKeywords`: Violence/harmful content
- `seoSpamIndicators`: SEO spam patterns
- `promoKeywords`: Promotional content

## Metrics & Monitoring

### Key Metrics
- **Moderation Queue Size**: Monitor `/api/moderation/stats`
- **Auto-reject Rate**: Track rejection decisions
- **Manual Review Rate**: Track queue additions
- **User Report Rate**: Monitor `/api/reports/stats`
- **Domain Reputation Distribution**: Track low-scoring domains

### Performance Goals
- Auto-reject < 5% of submissions (indicates overly strict filters)
- Manual review < 20% of submissions
- Moderation queue cleared daily
- User reports resolved within 48 hours
- False positive rate < 1%

## Future Enhancements

### Planned Features
1. **ML-based Content Classification**
   - Train model on moderation decisions
   - Improve spam/quality detection accuracy
   - Reduce manual review workload

2. **Image Analysis**
   - NSFW image detection
   - Logo/brand detection for spam
   - Quality assessment

3. **User Trust Scores**
   - Track user submission quality
   - Trusted users get fast-track approval
   - Repeat offenders get stricter review

4. **Automated Domain Blacklisting**
   - Auto-ban domains with very low reputation
   - Temporary bans for pattern violations
   - Allowlist for trusted sources

5. **Content Fingerprinting**
   - Detect duplicate/similar content
   - Prevent spam resubmission
   - Identify content farms

6. **Advanced Reporting**
   - Weekly moderation digests
   - Trend analysis (spam types, attack patterns)
   - Moderator performance metrics

## Troubleshooting

### Issue: Too Many False Positives
**Symptoms**: Clean content being rejected or flagged for review
**Solutions**:
- Review and adjust keyword lists
- Increase spam confidence thresholds
- Check domain reputation calibration
- Review moderation logs for patterns

### Issue: Spam Getting Through
**Symptoms**: Obvious spam being auto-approved
**Solutions**:
- Add new spam patterns to keyword lists
- Lower spam detection thresholds
- Improve domain reputation tracking
- Review recent spam submissions for patterns

### Issue: Moderation Queue Backlog
**Symptoms**: Growing pending review queue
**Solutions**:
- Add more moderators
- Implement bulk moderation features
- Adjust auto-approval thresholds
- Identify and fix bottleneck categories

### Issue: High User Report Volume
**Symptoms**: Many user reports being filed
**Solutions**:
- Review reported content for missed patterns
- Adjust auto-filtering to catch similar content
- Investigate if specific users are gaming system
- Improve content quality at submission

## Security Considerations

1. **RLS Policies**: All moderation tables have Row Level Security enabled
2. **Authentication**: Moderator actions require valid user ID
3. **Rate Limiting**: Should be added to prevent report spam (future work)
4. **Audit Logging**: All moderation decisions logged with moderator ID
5. **Data Privacy**: User reports anonymized in statistics

## Support

For issues or questions about the moderation system:
- Check logs in Discovery Service console
- Review moderation queue statistics
- Contact system administrator
- Review this documentation

---

**Last Updated**: September 30, 2025
**System Version**: 1.0.0
**Status**: Production Ready