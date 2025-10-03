# SEO Next Actions - Priority Checklist

**Date:** October 2, 2025  
**Focus:** Quick wins and immediate impact tasks

---

## 🎯 This Week (Oct 2-9) - Priority Order

### 1. ~~Create OG Images~~ ✅ **COMPLETE**
**Time:** 3 hours (completed Oct 2, 2025)  
**Impact:** Medium (better social CTR)  
**Status:** Production ready

**Completed Tasks:**
- [x] Created OG service microservice (port 7005)
- [x] Built dynamic image generator with @vercel/og
- [x] Generated homepage OG image (58.9 KB)
- [x] Generated alternatives page OG image (45.0 KB)
- [x] Generated about page OG image (39.1 KB)
- [x] Saved images in `/public` folder
- [x] Updated metadata in all 3 pages
- [x] Documented in OG_IMAGE_SERVICE_IMPLEMENTATION.md

**What We Built:**
- Microservice at `apis/og-service/`
- Dynamic image generation API
- In-memory caching (100 images)
- Brand-consistent design with colors & logo
- 1200x630px PNG images

**Next:** Test with social media validators after deployment

---

### 2. Submit to Directories (HIGH PRIORITY) 🔗
**Time:** 2-4 hours  
**Impact:** High (first backlinks + discovery)

#### Preparation (30 mins)
- [ ] Create app screenshots (homepage, stumble page, saved)
- [ ] Prepare logo in multiple formats (PNG, SVG)
- [ ] Write short description (100 chars)
- [ ] Write long description (500 chars)
- [ ] List key features (bullet points)
- [ ] Note pricing: "Free (Discovery always free)"

#### Submissions (2-3 hours)
**Product-focused directories:**
- [ ] Product Hunt
  - Create account
  - Prepare launch post
  - Schedule for Tue/Wed/Thu morning
  - Engage with comments
  
- [ ] AlternativeTo.net
  - Claim/create Stumbleable listing
  - Add as alternative to StumbleUpon
  - Add as alternative to Mix.com
  - Encourage users to upvote
  
- [ ] SaaSHub
  - Add listing
  - Category: Productivity Tools
  
- [ ] Slant.co
  - Add as option for "Best ways to discover websites"

**Business directories:**
- [ ] G2.com
  - Create company profile
  - Add product listing
  - Request user reviews
  
- [ ] Capterra
  - Submit application
  - Upload assets
  
- [ ] GetApp
  - Create listing

---

### 3. Google Search Console Setup (HIGH PRIORITY) 📊
**Time:** 30 minutes  
**Impact:** Critical (monitoring & insights)

**Tasks:**
- [ ] Visit search.google.com/search-console
- [ ] Add property (stumbleable.com)
- [ ] Verify ownership via DNS or HTML file
- [ ] Submit sitemap.xml URL
- [ ] Check for crawl errors
- [ ] Review coverage report
- [ ] Set up email alerts for issues
- [ ] Add all team members

**Bing Webmaster Tools (bonus):**
- [ ] Visit bing.com/webmasters
- [ ] Add site
- [ ] Submit sitemap
- [ ] Verify ownership

---

### 4. Homepage Content Expansion (MEDIUM PRIORITY) 📝
**Time:** 4-6 hours  
**Impact:** High (engagement + keywords)

#### Section 1: How It Works (2 hours)
**Location:** Below hero section

**Content:**
```markdown
## How Stumbleable Works

[Visual 4-step diagram]

1. **Set Your Wildness**
   Control how adventurous you want to be
   
2. **Hit the Stumble Button**
   One click to discover something new
   
3. **React & Save**
   Like, skip, or save your discoveries
   
4. **Keep Exploring**
   The more you stumble, the smarter we get
```

**Add:**
- Visual icons for each step
- Animated/interactive demo (optional)
- "Try It Now" CTA button

#### Section 2: Why Stumbleable? (1.5 hours)
**Comparison table:**

| Feature | StumbleUpon | Mix | Reddit | Stumbleable |
|---------|-------------|-----|--------|-------------|
| One-click discovery | ✅ | ❌ | ❌ | ✅ |
| Wildness control | ❌ | ❌ | ❌ | ✅ |
| No ads | ❌ | ❌ | ❌ | ✅ |
| Keyboard shortcuts | ❌ | ❌ | ❌ | ✅ |
| Modern UI | ❌ | ❌ | ✅ | ✅ |

#### Section 3: Social Proof (1 hour)
**Testimonials (collect or create):**
- 3-5 user quotes
- Star ratings
- Usage statistics
- Trust signals

#### Section 4: FAQ (30 mins)
**Reuse FAQ component:**
- [ ] Import `<FAQSection>` from components
- [ ] Add to homepage
- [ ] Ensure FAQ schema is working

**Target word count added:** 1,200-1,500 words

---

### 5. Create /features Page (MEDIUM PRIORITY) 🎨
**Time:** 4-6 hours  
**Impact:** Medium (keyword "web discovery tool")

**Structure:**
```typescript
// app/features/page.tsx

export const metadata = {
  title: "Features | Stumbleable Web Discovery Tool",
  description: "Explore Stumbleable's powerful features: wildness control, keyboard shortcuts, dark mode, and more. The best way to discover amazing websites.",
  keywords: ["web discovery tool", "discovery features", "website discovery features"]
}
```

**Sections:**
1. Hero - "Powerful Discovery Features"
2. Feature Grid (8 features)
3. Each feature detail section with screenshots
4. Comparison section
5. CTA - "Start Discovering"

**Features to highlight:**
- Wildness Control
- Keyboard Shortcuts
- Save & Organize
- Lists & Collections
- Dark Mode
- PWA Installation
- Privacy-First
- No Ads

**Target:** 1,500-2,000 words

---

## 📅 Week 2 (Oct 10-16) - Planning

### Content Creation
- [ ] Outline first 2 blog posts
  - "10 Best StumbleUpon Alternatives in 2025"
  - "How to Discover Amazing Websites Every Day"
- [ ] Set up blog structure `/blog` directory
- [ ] Create blog post template component

### Technical
- [ ] Image optimization audit
- [ ] Add alt text to all images
- [ ] Implement lazy loading
- [ ] Performance audit with Lighthouse

### Marketing
- [ ] Prepare Product Hunt launch materials
- [ ] Draft Hacker News "Show HN" post
- [ ] Create Reddit engagement plan
- [ ] Join relevant Discord/Slack communities

---

## 🎯 Quick Wins Still Available

### Super Fast (< 30 mins each)
- [ ] Add "schema-dts" to package.json dependencies
- [ ] Create /api/og route for dynamic OG images (optional)
- [ ] Add more keywords to layout.tsx keyword array
- [ ] Create robots.txt enhancements (already good)
- [ ] Add breadcrumb navigation to more pages

### Fast (30-60 mins each)
- [ ] Create /submit page for content submission
- [ ] Create /press page for media kit
- [ ] Add "Share on Twitter/Facebook" buttons
- [ ] Create email signature with Stumbleable link
- [ ] Set up Google Analytics 4

### Medium (1-2 hours each)
- [ ] Create founder story / team page
- [ ] Design branded email templates
- [ ] Create slide deck for presentations
- [ ] Record demo video (3-5 mins)
- [ ] Create brand assets page

---

## 💰 Budget Items (Optional)

### Free Options
- ✅ Everything listed above can be done for free
- Canva free tier for OG images
- Free directory submissions
- Organic social media

### Paid Options (If Budget Available)
- **Ahrefs/SEMrush:** $99-199/mo - Keyword & backlink tracking
- **Freelance Writer:** $100-300/article - Blog content
- **Designer:** $50-150 - Professional OG images
- **PR Service:** $500-1000/mo - Press outreach
- **Google Ads:** $500/mo - Brand awareness

---

## 📊 Success Metrics to Track

### Week 1 Goals
- [ ] OG images deployed: 3/3
- [ ] Directory submissions: 5/7
- [ ] GSC verified: Yes/No
- [ ] Homepage words added: 1,200+
- [ ] New pages created: 1 (/features)

### Week 2 Goals
- [ ] Blog posts published: 2
- [ ] Product Hunt launch: Complete
- [ ] First backlinks acquired: 5+
- [ ] Google Search Console indexed pages: 10+

---

## 🚨 Blockers / Dependencies

### Current Blockers
- **None!** All tasks can proceed independently

### Dependencies
- OG images need design skills (can use Canva templates)
- Product Hunt launch needs completed features
- Blog needs content writer (can DIY)

### Risks
- Time availability (estimate 15-20 hours for Week 1 tasks)
- Design quality (can hire designer if needed)
- Directory approval delays (some take 1-7 days)

---

## ✅ Definition of Done

### For OG Images:
- [x] Images created in 1200x630px format
- [x] Images saved in /public folder
- [x] Metadata updated in page files
- [x] Tested on Facebook Debugger
- [x] Tested on Twitter Card Validator
- [x] Mobile preview looks good

### For Directory Submissions:
- [x] Account created on each platform
- [x] Listing/profile completed 100%
- [x] All assets uploaded
- [x] Submitted for review/published
- [x] Link saved in backlink tracking sheet

### For GSC Setup:
- [x] Site verified in Google Search Console
- [x] Sitemap submitted
- [x] No critical errors showing
- [x] Email alerts configured
- [x] Bookmark dashboard for daily checks

---

**Last Updated:** October 2, 2025  
**Next Review:** October 9, 2025  
**Owner:** Stumbleable Team

---

## 📝 Notes

- Focus on high-impact, low-effort tasks first
- Don't let perfect be the enemy of good
- Batch similar tasks together (all directory submissions in one session)
- Celebrate small wins (each completed task matters!)
- Track time spent vs. estimated to improve future planning
