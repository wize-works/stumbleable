# Stumbleable — Product Requirements Document (PRD) v1.0

**Owner:** Brandon Korous (Product/Engineering)
**Doc status:** Draft v1.0
**Product tagline:** *Stumbleable — one button to the weirder, better web.*

---

## 1) Summary

Stumbleable revives the StumbleUpon experience: a single **Stumble** action delivers a surprising, high‑quality web page tailored by community feedback and light AI. The core loop is **Stumble → React (👍/👎/Save/Share) → Next**. Social features exist, but discovery—not feeds—is the heart.

---

## 2) Goals & Non‑Goals

**Goals**

* Deliver a fast, delightful serendipity loop that consistently finds *worthwhile* pages beyond mainstream feeds/search.
* Blend human curation (submissions + feedback) with AI‑assisted classification to improve relevance while preserving randomness.
* Provide lightweight social features (save, share, collaborative lists/trails) that enhance discovery without turning into a follower‑driven feed.
* Build a scalable ingestion pipeline (submit + crawl + enrich) that is **polite**, **legal**, and **cost‑aware**.

**Non‑Goals (for first releases)**

* Building a general search engine or full social network.
* Hosting creator content (we link out; we store metadata/thumbnails only, unless licensed).
* Heavy creator monetization, comments, or long‑form within the app.

---

## 3) Success Metrics (KPIs)

* **D1/D7 Retention:** D1 ≥ 35%, D7 ≥ 18% for new registrants.
* **Stumble Velocity:** median time between stumbles ≤ 4s; ≥ 8 stumbles/session median.
* **Quality Signal:** global 👍 rate ≥ 55% on shown items; skip rate ≤ 25%.
* **Novelty:** ≥ 25% of daily served items from domains with < 10 prior impressions per user.
* **Save Rate:** ≥ 8% of shown items saved by at least one user.
* **Submission Health:** 80/20 split of community submissions vs. crawler discoveries over time.

---

## 4) Personas (primary)

* **Curious Generalist (CG):** 20–55, broad interests, wants strange/fun/beautiful things without doomscroll. 10–15 min/day.
* **Niche Hunter (NH):** Makers, artists, indie devs; seeks obscure blogs, small tools, webrings. 20–40 min/day.
* **Taste Curator (TC):** Enjoys submitting and tagging; builds lists for communities.

---

## 5) Experience Pillars

1. **Serendipity with Control** — Stumble always surprises; **Wildness** slider tunes how off‑topic results can be.
2. **Small Bites, Big Links** — one card, clean rationale (why you’re seeing this), quick actions.
3. **Community‑Powered** — submissions, soft curation, domain reputation.

---

## 6) Feature Scope

### 6.1 Core Stumble Loop (GA)

* **Stumble button** (click/spacebar) serves one item; server returns next candidate using ranking (see §9).
* **Reaction bar:** 👍 (like), 👎 (down/skip), 🔖 Save, ↗ Share.
* **Wildness control:** 0–100; biases exploration vs. similarity.
* **Why you’re seeing this:** short rationale pill (topics, freshness, community picks).
* **Keyboard shortcuts:** Space (next), ↑ (like), ↓ (skip), S (save), Shift+S (share).

**Acceptance:** ≤ 150ms server compute + ≤ 1s p95 TTFB; no repeated items in a session.

### 6.2 Onboarding & Interests (v1)

* Topic picker (multi‑select from catalog).
* Optional: connect bookmarks/RSS import to seed interests (deferred).

### 6.3 Submissions (v1)

* **Submit URL** → queue for enrichment (title, summary, image, language, topics).
* **Attribution:** optional submitter handle.
* **Status:** queued → active → (optional) curator review if low confidence/spammy.

### 6.4 Saved & Lists (v1)

* **Saved:** personal collection; filter by topic, domain, date.
* **Lists/Trails:** named, ordered sets of items. Public or unlisted.
* **Micro‑quests:** preset trails (e.g., “5 Brutalist Homepages”).

### 6.5 Explore & Trending (v1.1)

* Explore grid by topic; **Trending** (quality × freshness × velocity).
* Domain pages: reputation, recent popular items from that domain.

### 6.6 Creator/Curator Console (v1.1)

* Submission history; impressions, CTR, saves.
* Curator queue with confidence scores; keyboard triage.

### 6.7 Browser Extension (v1.2)

* **Stumble** in a new tab; **Submit this page**; **Save** current tab.

### 6.8 Mobile Web/PWA (v1.2)

* Add‑to‑Home; offline stub; app icon set; basic push (later).

### 6.9 Notifications (later)

* Digest: new items in followed topics/lists; creator stats summary.
* Email only initially; push later.

### 6.10 Monetization (post‑GA)

* **Pro (Patron) tier:** no sponsored stumbles, advanced filters, early features.
* **Sponsored stumble:** clearly labeled, 1 in 15 max, strict relevance/quality rules.
* **Creator analytics+tools** (freemium → Pro).

---

## 7) Content Ingestion (Submit + Crawl)

**Submit flow:** de‑dupe by canonical URL → enqueue → fetch → extract (title, summary, image, lang) → classify topics → safety checks → index.

**Crawler (focused, polite):**

* Frontier from: user submissions, RSS/OPML, sitemaps, webrings/blogrolls, outlinks from high‑quality items, occasional sampling via Common Crawl index.
* Politeness: robots.txt, per‑domain rate limit (1–2 concurrent), timeouts, `User‑Agent` with contact URL, honor `Retry‑After`.
* Extraction: HTML → Readability; OG image; canonical; content hash; SimHash for near‑dup.
* Safety: NSFW classifier, malware heuristics, blocklists.
* Re‑crawl: freshness schedule by domain type & prior engagement.

**Non‑goals:** JS rendering for all pages; only use Playwright for select domains.

---

## 8) Trust & Safety / Moderation

* **Abuse controls:** report item/domain, curator queue, shadow‑quarantine for new users/domains.
* **Spam/SEO downranking:** classifier + domain reputation (−1..+1).
* **Legal:** DMCA workflow; honor takedowns; store metadata only; respect `robots.txt` and `noindex`/`nofollow`.
* **NSFW:** safe‑default; allow opt‑in topics with clear labeling (later).
* **Privacy:** minimal personal data; opt‑in analytics; delete account/export data.

---

## 9) Ranking & Personalization (v1 algorithm)

**Per‑source base:** Bayesian smoothing of likes with prior *m*; freshness half‑life 7–14 days; domain reputation multiplier.

**User match:** topic/embedding similarity to user profile; **Wildness** injects exploration by sampling lower‑similarity candidates with probability proportional to slider.

**Final score:** `final = score0 × (0.5 + 0.5·sim) × (0.6 + 0.4·fresh) × rep`, with ε‑greedy exploration (5–10%).

**Inputs:** user topic weights; source topics; optional pgvector embeddings (OpenAI/text‑embedding).
**Outputs:** single next item; server returns rationale breadcrumbs to render.

---

## 10) Information Architecture

* **Top‑level:** Stumble · Lists · Saved · Explore · About · Submit.
* **Secondary:** Domain page · Topic page · Profile (later).
* **Admin/Curator:** Queue, Reports, Domain Reputation, Flags.

---

## 11) UX Flows (high level)

* **Stumble:** open `/stumble` → request next → render card → user reacts → record → prefetch potential next → loop.
* **Save:** click Save → toast → appears in `/saved` instantly.
* **Submit:** paste URL → optimistic queued state → background enrich → notified when active.
* **Create List:** name, description, add items (drag order), publish.

---

## 12) Functional Requirements

* **FR‑1:** Deliver next item in ≤ 1s p95 (from click) under 5k concurrent users.
* **FR‑2:** No duplicates per session unless explicitly requested.
* **FR‑3:** Record reactions idempotently with at‑least‑once delivery semantics.
* **FR‑4:** Support keyboard shortcuts across Stumble page.
* **FR‑5:** Submissions are deduped by canonical URL + content hash.
* **FR‑6:** Crawler respects robots.txt and has per‑domain concurrency caps.
* **FR‑7:** Saved items are retrievable and filterable by topic and domain.

---

## 13) Non‑Functional Requirements

* **Availability:** 99.9% for public endpoints.
* **Latency:** p95 TTFB ≤ 600ms for `/api/stumble`.
* **Cost:** infra <$X/month at 10k MAU; crawler spend capped via KEDA scale rules.
* **Security:** OWASP top 10 mitigations; rate limiting; audit logs for admin actions.
* **Accessibility:** WCAG 2.1 AA; full keyboard navigation.

---

## 14) Analytics & Experimentation

* Event schema: `stumble_served`, `reaction`, `save`, `share`, `submit_url`, `list_create`, `list_add`, `explore_open`.
* Cohort analysis by persona; A/B test wildness defaults, rationale copy, button placement.
* Privacy: basic, anonymized by default; per‑user consent for granular tracking.

---

## 15) Monetization (design guardrails)

* Sponsored items **must** be on‑topic, clearly labeled, frequency‑capped (≤ 1/15), and excluded from like ratio calculations.
* Patron plan removes sponsored items and unlocks advanced filters; no paywall for core stumble loop.

---

## 16) Architecture (proposed)

* **Frontend:** Next.js 15 App Router (already scaffolded), PWA basics.
* **Auth:** Clerk (optional for save/submit; anonymous stumble allowed).
* **DB:** Postgres (Supabase or Neon/Azure PG); `pgvector` for embeddings.
* **Storage:** Supabase Storage for thumbnails/OGs (private by default, signed URLs).
* **APIs:** Next.js Routes or Node/Fastify service behind existing AKS.
* **Ingestion:** Queue (Azure Storage Queue/Service Bus) → Worker(s) (AKS/ACA Jobs) for fetch/enrich/classify.
* **Scaling:** KEDA triggers (queue depth, cron).
* **Observability:** Sentry + metrics (Prom/OpenTelemetry).
* **CDN:** Front Door/Vercel CDN for assets.

---

## 17) Data Model (high‑level)

**topics**(id, name, slug)
**sources**(id, url, domain, title, description, image_url, lang, embed, status, created_at, last_seen)
**source_topics**(source_id, topic_id, weight)
**users**(id, clerk_user_id, created_at)
**user_topic_prefs**(user_id, topic_id, weight)
**interactions**(id, user_id, source_id, action, created_at, session_id)
**domain_reputation**(domain, rep_score, last_updated)
**lists**(id, user_id, name, description, visibility, created_at)
**list_items**(list_id, source_id, order)

---

## 18) API Surface (initial)

`GET /api/stumble?wildness=INT` → { item, rationale, seenToken }
`POST /api/feedback` → { sourceId, action }
`POST /api/save` → { sourceId }
`POST /api/submit` → { url }
`GET /api/saved` → [items]
`GET /api/lists/:id` | `POST /api/lists` | `POST /api/lists/:id/items`

**Admin/Curator:**
`GET /api/curation/queue` · `POST /api/curation/decide` · `POST /api/domain/rep`

---

## 19) Telemetry & Logging

* Unique, opaque **session_id** per visit; tie to user when logged in.
* Structured logs for crawl/fetch (HTTP, size, time), enrichment outcomes, classifier scores.
* Sampling: 10% full traces, 100% errors.

---

## 20) Privacy, Compliance, Legal

* **Data minimization:** store only necessary user data; support delete/export under GDPR/CCPA.
* **Robots/Terms:** Respect robots.txt; no iframe trapping; immediate removal upon valid takedown.
* **Content:** Metadata + thumbnails only, unless creator opt‑in or license.

---

## 21) Accessibility & Localization

* WCAG 2.1 AA; high contrast mode; focus outlines; logical tab order.
* L10n plan: i18n keys from day one; start with English; design for text expansion.

---

## 22) Release Plan

* **MVP (done):** UI scaffold with mock data; Stumble loop; Wildness; Reactions; Saved; basic pages.
* **v1 (Beta):** Real `/api/stumble`, feedback persistence, submissions, basic crawler/enrichment, topic onboarding, Saved and Lists backed by DB.
* **v1.1:** Explore/Trending, Creator/Curator console, domain reputation, email digests.
* **v1.2:** Browser extension, PWA polish, mobile optimizations.
* **GA criteria:** KPIs (Section 3) hit for 4 consecutive weeks; < 1% crash/error rate; moderation SLA < 24h.

---

## 23) Risks & Mitigations

* **Spam/SEO junk flood** → layered filters, shadow‑quarantine, domain reputation.
* **Legal takedowns** → DMCA pipeline + fast removal tooling.
* **Cold‑start quality** → seed with curated lists/RSS; exploration ε; early curator program.
* **Crawler cost creep** → strict rate caps, budget alerts, KEDA scaling, per‑domain schedules.
* **User fatigue** → rationale copy tests; dynamic pacing; micro‑quests to create mini‑goals.

---

## 24) Test Plan (high‑level)

* **Unit:** ranking math, dedupe, canonicalization.
* **Integration:** `/api/stumble` yields unique items, honors wildness.
* **Load:** 5k concurrent stumblers; p95 latency checks.
* **UX/Accessibility:** keyboard‑only journeys; screen reader labels; color contrast.
* **Crawler:** robots compliance tests; polite limits; duplicate/redirect handling.

---

## 25) Open Questions

* Should anonymous users have Saved/Lists via local storage until account creation?
* What is the initial topic taxonomy size (100 vs. 300) and who curates it?
* What’s the sponsored item review/approval workflow and pricing model?

---

## 26) Appendices

* **A. Rationale copy examples**

  * “Matched your *Design* interest · Fresh this week · Loved by the community.”
  * “Off‑trail pick · *Photography* adjacent · From a new domain.”
* **B. Wildness semantics**

  * 0–20: prioritize high similarity; ε=2%.
  * 21–60 (default 50): balanced; ε=8%.
  * 61–100: explore aggressively; ε up to 20%; increase novel domain weight.
