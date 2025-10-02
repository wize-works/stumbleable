The Creator Console is the workspace for people who submit and curate links on Stumbleable. It’s not a social feed; it’s a tidy dashboard where you add URLs, see how they perform in the stumble loop, and manage lists/trails. Think “YouTube Studio,” but for links you discovered—not videos you host.

What it is (in one breath)

A dashboard to submit links → track status → view basic performance → build lists/trails → handle domain reputation & feedback. It keeps creators motivated and the garden well-tended without turning into influencer theater.

Day-1 (v1) capabilities

Submit links: paste a URL (or several). We auto-enrich title, image, summary, language, topics.

Status & review: each item shows queued → active → (optional) rejected, with reasons when rejected (spam/duplicate/low quality).

Performance at a glance:

Impressions (how often it was shown as a card)

Opens/CTR (click-through to the site)

Saves (how many users saved it)

Like ratio (👍 / total)

Topic breakdown (where it’s being matched)

Lists / Trails: create a named, ordered set (5–15 items). Share a trail link; see starts/completions.

Attribution: show your handle on the card (“Submitted by @you”) when applicable.

Guidelines & quality tips: short do’s/don’ts so submissions stay delightful.

How the pipeline works (what creators see)

Submitted → Queued → Enriched → (Auto) Classified → (Maybe) Curator Review → Active

Queued: dedupe checks and robots.txt compliance.

Enriched: we fetch metadata, image, and extract a clean summary.

Classified: topics + confidence; low-confidence items can go to manual review.

Active: now in circulation and accruing stats.

Rejected: visible reason (duplicate, low signal, policy, broken page).

Metrics, defined (and what we don’t overpromise)

Impressions: times your link was shown as a card.

Opens: card → external click.

CTR: opens / impressions.

Saves: number of users that saved it.

Like ratio: 👍 / (👍 + 👎).

We do not track on-site dwell (we don’t embed trackers on other people’s sites). We keep it respectful.

Anti-abuse & fairness (transparent guardrails)

Per-domain daily caps, especially for new accounts.

Domain reputation: if a domain’s links get low engagement or trip spam signals, its future submissions are deprioritized. You’ll see that hint in the console.

Clearly labeled sponsored slots never affect organic scores.

“Claim my domain” (v1.1)

Verify ownership via DNS TXT or <meta> tag.

Once claimed: see domain-level stats across all submissions, and request thumbnail/image fixes.

Bulk & power features (roadmap)

Bulk import via RSS/OPML or CSV.

UTM builder for your outbound links (optional).

API token + webhook: submit programmatically; receive daily stats.

AI tag assist: we suggest topics/keywords; you edit before publish.

A/B title & image (lightweight, only on our card metadata—not the source page).

Simple screen map

Left nav: Submissions · Lists/Trails · Domain · Guidelines

Submissions table: Title · Domain · Status · Impressions · CTR · Saves · Like% · Menu

Item detail: Preview card + rationale, topic tags, timeline chart, rejection reason (if any)

Lists: Create/edit list, drag to reorder, publish link, starts/completions

Minimal API surface (when the backend lands)

POST /api/submit { url, tags? } → { id, status }

GET /api/creator/submissions?status=queued|active|rejected

GET /api/creator/stats?sourceId=… → { impressions, opens, ctr, saves, likeRatio, topics[] }

POST /api/lists / POST /api/lists/:id/items / GET /api/lists/:id/stats