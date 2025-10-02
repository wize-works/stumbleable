# Copilot, build Stumbleable with production-ready architecture

You are working inside a monorepo for a StumbleUpon-style project called **Stumbleable**. Build both the **web ## Acceptance criteria
1. **Frontend**: Project runs with `npm run dev` and shows Landing, Stumble, Saved, About routes.
2. **Backend**: Individual API services run independently and handle their domains.
3. **Integration**: Stumble page fetches discoveries from discovery-service API.
4. **Interactions**: Like/Skip/Save/Share buttons call interaction-service API.
5. **Persistence**: User interactions persist across sessions (database or file-based).
6. **Scoring**: Wildness parameter affects discovery recommendations via API.
7. **Error Handling**: Graceful API error handling with user feedback.
8. **Performance**: Services are stateless and can scale independently.

## Production considerations
- **Environment config**: Different API endpoints for dev/staging/prod
- **Authentication**: JWT or session-based user identification
- **Rate limiting**: Protect APIs from abuse
- **Monitoring**: Health checks and basic metrics
- **Data persistence**: PostgreSQL, MongoDB, or similar for production data
- **Caching**: Redis for frequently accessed data (trending, user preferences)

## Migration path
1. Build API services with in-memory/file-based storage initially
2. Connect frontend to APIs, removing mock data dependencies  
3. Add proper database layer
4. Implement authentication and user management
5. Add caching and performance optimizationspp Router) and **independently scalable APIs** following single responsibility principles. The UI should connect to real backend services via HTTP APIs.

## Tech + constraints
### Frontend (ui/portal/)
- **Next.js 15 (App Router)**, **TypeScript**, **Tailwind** with simple CSS variables. **Do not** rely on Tailwind theme config; instead, keep **`app/themes/light.css`** and **`app/themes/dark.css`** imported from `globals.css`.
- Minimal deps. Avoid shadcn/ui for now. Use simple components and icons (lucide-react or inline SVG).
- **Connect to APIs via fetch calls** - no direct data imports from backend modules.
- Accessibility: keyboard support and focus states. 
- Keep styles clean and match the existing tokens: `--color-primary`, `--color-secondary`, etc.

### Backend (apis/)
- **Single responsibility microservices** - each API handles one domain (discovery, interactions, users, etc.)
- **Node.js/Express** or **Next.js API routes** for each service
- **TypeScript** throughout
- **RESTful APIs** with proper HTTP status codes and error handling
- **Environment-based configuration** (development vs production)
- **Stateless services** that can scale independently

## Monorepo structure
```
ui/portal/                  # Next.js frontend
  app/
    layout.tsx
    page.tsx                # Landing
    about/page.tsx
    stumble/page.tsx        # Main Stumble screen
    lists/page.tsx
    saved/page.tsx
    globals.css
    themes/
      light.css
      dark.css
  components/
    Header.tsx
    StumbleButton.tsx
    DiscoveryCard.tsx
    ReactionBar.tsx
    WildnessControl.tsx
    KeyboardShortcuts.tsx
    Toaster.tsx
  lib/
    api-client.ts           # HTTP client for API calls
    utils.ts
# this should no longer be needed, we should call APIs instead
  data/                     # Types and temporary mock data during development
    types.ts

apis/                       # Independent, scalable backend services
  discovery-service/        # Handles discovery scoring & recommendation
    src/
      routes/
        next.ts             # POST /next - get next discovery
        trending.ts         # GET /trending - get trending discoveries
      lib/
        scoring.ts          # Discovery scoring algorithms
        repository.ts       # Data access layer
      server.ts
    package.json
    
  interaction-service/      # Handles user interactions & feedback
    src/
      routes/
        feedback.ts         # POST /feedback - record user feedback
        saved.ts           # GET /saved - get user's saved discoveries
      lib/
        repository.ts
      server.ts
    package.json
    
  content-service/          # Manages discovery content & metadata
    src/
      routes/
        discoveries.ts      # CRUD operations for discoveries
        topics.ts          # Topic management
      server.ts
    package.json
```

## Types (create in `data/` or `types.ts`)
```ts
export type Topic = {
  id: string;            // slug
  name: string;
};

export type Discovery = {
  id: string;
  url: string;
  title: string;
  description?: string;
  image?: string;
  domain: string;
  topics: string[];      // topic ids
  readingTime?: number;     // minutes
  createdAt?: string;    // ISO
  quality?: number;      // 0..1 baseline
};

export type Interaction = {
  id: string;
  discoveryId: string;
  action: 'up'|'down'|'save'|'skip'|'share';
  at: number;            // Date.now()
};
```

## Mock data - this should no longer be the practice, we should call APIs instead
- `data/topics.ts`: export ~30 topics across arts, crafts, design, science, code, indie web, photography, music, philosophy, games, DIY, nature, history, etc.
- `data/sources.ts`: export **40–60 `Discovery` objects** with diverse topics, realistic titles, and `image` placeholders like `https://picsum.photos/seed/<id>/1200/630`. Mix creation dates within the last 365 days and vary `quality`.
- `data/users.ts`: export a single `currentUser` with preferred topics (weights) and a `wildness` default (0–100).
- `data/interactions.ts`: export an in-memory array and helpers: `logInteraction(i:Interaction)`, `getInteractions()`.

## API Architecture

### Discovery Service APIs
- `POST /api/discovery/next` - Get next discovery based on user preferences
  ```ts
  Request: { userId: string; wildness: number; seenIds: string[] }
  Response: { discovery: Discovery; score: number; reason: string }
  ```
- `GET /api/discovery/trending` - Get trending discoveries
  ```ts
  Response: { discoveries: Discovery[]; count: number }
  ```

### Interaction Service APIs  
- `POST /api/interactions/feedback` - Record user feedback
  ```ts
  Request: { userId: string; discoveryId: string; action: 'up'|'down'|'save'|'skip'|'share' }
  Response: { success: boolean; interaction: Interaction }
  ```
- `GET /api/interactions/saved/:userId` - Get user's saved discoveries
  ```ts
  Response: { discoveries: Discovery[]; count: number }
  ```

### Content Service APIs
- `GET /api/content/discoveries` - List/search discoveries
- `POST /api/content/discoveries` - Add new discovery
- `GET /api/content/topics` - Get topic catalog

### Scoring Algorithm
- **scoring** = `quality * freshness * similarity * exploration_factor`
- **freshness** = half-life 14 days → `Math.exp(-Math.log(2) * ageDays/14)`
- **similarity** = cosine similarity of user interests vs discovery topics
- **exploration_factor** = wildness-based randomization to surface unexpected content

## Pages & interactions
- **Landing (`/`)**: hero, CTA → `/stumble`. Short copy: “One button. Curated randomness. Human taste + AI vibes.”
- **Stumble (`/stumble`)**:
  - Shows a single `DiscoveryCard`.
  - Controls at top-right: `WildnessControl` + big `StumbleButton`.
  - `ReactionBar` under the card with Like / Skip / Save / Share.
  - Keyboard shortcuts: `Space` = next, `ArrowUp` = Like, `ArrowDown` = Skip, `S` = Save, `Shift+S` = Share. Visual hint somewhere (“?” tooltip or small legend).
  - Use `KeyboardShortcuts` component to attach listeners and show a help tooltip.
# this should no longer be the practice, we should call APIs instead
  - Toasts for actions (e.g. “Saved!”).
- **Saved (`/saved`)**: read from `mockService.getSaved()`; render a simple list of saved `DiscoveryCard`s.
# this should no longer be the practice, we should call APIs instead
- **Lists (`/lists`)**: stub placeholder explaining “Collaborative trails coming later.”
- **About (`/about`)**: short blurb.

## Components
- **Header**: sticky top, nav items: Stumble, Lists, Saved, About. Highlight active route.
- **DiscoveryCard**: full-bleed image, domain chip, title → external link (target blank), description, topic tags, readingTime. Small “Why you’re seeing this” line with reasons.
- **ReactionBar**: buttons with icons. Trigger `recordFeedback` and show a toast (“Saved!” etc.).
- **WildnessControl**: Radix Slider or minimal custom slider; shows numeric value. Changing it should influence `getNextDiscovery`.
- **Toaster**: Minimal client-only toast (no dependency) or simple inline ephemeral banner.

## Styling
- Keep using CSS variables for colors in `light.css` and `dark.css` (already present). Use rounded-2xl, soft shadows, and a clean grid. Respect prefers-color-scheme.
- Buttons and chips should have visible focus rings and hover states.

## State + flow on `/stumble`
- Keep local component state: `current`, `wildness`, `seenIds`.
- `next()` pulls from `getNextDiscovery({wildness, seenIds})`, updates `current` and adds to `seenIds`.
- Reactions call `recordFeedback` and optionally auto-advance after a small delay on Like/Skip.

## Acceptance criteria
1. Project runs with `npm run dev` and shows Landing, Stumble, Saved, About routes.
2. Stumble page renders a full website from data and advances on **Space** or the **Stumble** button.
3. Like/Skip/Save/Share buttons update in-memory state (saves appear on `/saved`).
4. Wildness changes the mix (verify by logging debug info in console for now).
5. No network calls; everything imports from `data/` modules.
6. Basic responsiveness (mobile → desktop) and keyboard accessibility.

## Nice-to-haves (do if quick)
- Display a small trending pill on the card when `quality * freshness` is high.
- Add an optional “copy link” on Share (use `navigator.clipboard`).
- Remember last `wildness` in `localStorage`.



Auth, real APIs, crawler, database. Also skip analytics and error tracking in this pass.

> Implement or update any missing files to satisfy the acceptance criteria. Prefer small, readable components. Keep the design minimal and modern. When in doubt, make choices that are easy to replace later when the backend lands.