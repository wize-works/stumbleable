# GitHub Copilot Instructions for **Stumbleable**

> **Purpose:** Guide Copilot to build **Stumbleable** — a StumbleUpon‑style serendipity engine with a proper microservices architecture. The system consists of a Next.js frontend with Clerk authentication and multiple backend services handling different concerns, all connected to a Supabase database.

---

## 🎯 Project Overview
**Stumbleable** revives the joy of discovery: one button, one surprising page at a time. The architecture follows microservices patterns with clear separation of concerns and proper API integration.

### Core principles
- **Discovery-first** experience (no infinite feed).
- **Ultra-fast loop**: Stumble → quick reaction (👍 / 👎 / Save / Share) → next.
- **"Wildness" control** to tune how far we wander from user interests.
- **Simple, elegant UI**: clean cards, readable typography, great focus/keyboard support.
- **Microservices architecture**: Clear separation of concerns across services.
- **Clerk authentication**: Real user management and authentication.
- **Supabase database**: Centralized data storage with real-time capabilities.

---

## 📁 Monorepo Structure

```
stumbleable/
├── ui/
│   └── portal/                      # Next.js 15 App Router with Clerk auth
│       ├── app/
│       │   ├── (auth)/             # Authentication routes
│       │   ├── (marketing)/        # Public marketing pages
│       │   ├── about/page.tsx
│       │   ├── lists/page.tsx
│       │   ├── saved/page.tsx
│       │   ├── stumble/page.tsx    # Main discovery interface
│       │   ├── dashboard/          # User dashboard
│       │   ├── globals.css
│       │   └── layout.tsx
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── StumbleButton.tsx
│       │   ├── DiscoveryCard.tsx
│       │   ├── ReactionBar.tsx
│       │   ├── WildnessControl.tsx
│       │   ├── KeyboardShortcuts.tsx
│       │   ├── Toaster.tsx
│       │   └── EmptyState.tsx
│       ├── lib/
│       │   ├── api-client.ts       # API client for all services
│       │   ├── utils.ts
│       │   └── use-swipe.ts
│       ├── middleware.ts           # Clerk auth middleware
│       ├── next.config.js
│       ├── package.json
│       └── tsconfig.json
├── mobile/
│   └── expo/                        # React Native/Expo mobile app
│       ├── app/                    # Expo Router file-based routing
│       │   ├── (tabs)/             # Tab navigation (stumble, saved, lists, settings)
│       │   ├── (auth)/             # Authentication screens
│       │   ├── discovery/[id].tsx  # Discovery detail
│       │   ├── _layout.tsx         # Root layout with Clerk
│       │   └── +not-found.tsx      # 404 screen
│       ├── components/             # Mobile-optimized components
│       │   ├── StumbleCard.tsx     # Discovery card for mobile
│       │   ├── ReactionBar.tsx     # Mobile reaction buttons
│       │   ├── WildnessSlider.tsx  # Touch-friendly slider
│       │   └── TabBar.tsx          # Custom tab navigation
│       ├── lib/
│       │   ├── api-client.ts       # Same API services integration
│       │   ├── auth.ts             # Clerk Expo authentication
│       │   ├── haptics.ts          # Tactile feedback
│       │   └── notifications.ts    # Push notifications
│       ├── hooks/                  # Mobile-specific hooks
│       ├── constants/              # Colors, layout, config
│       ├── app.config.ts           # Expo configuration
│       ├── package.json
│       └── tsconfig.json
├── apis/
│   ├── discovery-service/          # Discovery & content algorithms (port 7001)
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── next.ts        # GET next discovery
│   │   │   │   └── trending.ts    # GET trending content
│   │   │   ├── lib/
│   │   │   │   ├── repository.ts  # Content & discovery data
│   │   │   │   ├── scoring.ts     # Discovery algorithms
│   │   │   │   └── supabase.ts    # Database connection
│   │   │   ├── types.ts
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── interaction-service/        # User interactions & feedback (port 7002)
│   │   ├── src/
│   │   │   ├── routes/            # Feedback, saves, stats endpoints
│   │   │   ├── lib/
│   │   │   │   └── supabase.ts    # Database connection
│   │   │   ├── store.ts           # Interaction storage
│   │   │   ├── types.ts
│   │   │   └── server.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── user-service/               # User profiles & preferences (port 7003)
│       ├── src/
│       │   ├── routes/
│       │   │   ├── users.ts       # User CRUD operations
│       │   │   └── topics.ts      # Available topics
│       │   ├── lib/
│       │   │   ├── repository.ts  # User data management
│       │   │   └── supabase.ts    # Database connection
│       │   ├── types.ts
│       │   └── server.ts
│       ├── package.json
│       └── tsconfig.json
├── database/
│   └── migrations/                 # SQL migration files
│       ├── 001_create_user_service_tables.sql
│       ├── 002_create_discovery_service_tables.sql
│       └── 003_create_interaction_service_tables.sql
├── scripts/                        # Development utilities
│   ├── setup.js
│   ├── install-all.js
│   └── health-check.js
└── package.json                    # Workspace root with dev scripts
```

---

## 🏗️ Microservices Architecture

### Service Ports & Responsibilities
- **UI Portal**: `http://localhost:3000` - Next.js frontend with Clerk auth
- **Discovery Service**: `http://localhost:7001` - Content discovery & algorithms  
- **Interaction Service**: `http://localhost:7002` - User feedback & interaction tracking
- **User Service**: `http://localhost:7003` - User profiles & preferences management

### Database Integration
- **Supabase**: Centralized PostgreSQL database with real-time capabilities
- **Per-service connections**: Each service has its own `lib/supabase.ts` client
- **Environment variables**: Each service uses `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
- **Migrations**: Database schema changes in `database/migrations/`

### API Integration Patterns

#### ✅ DO: Proper Service Communication
```typescript
// Frontend calls the appropriate service for each concern
const user = await UserAPI.getOrCreateUser(clerkUserId);        // User service
const discovery = await DiscoveryAPI.getNext({                  // Discovery service
    userId: user.id, 
    wildness: user.wildness, 
    seenIds 
});
await InteractionAPI.recordFeedback(discovery.id, 'up');        // Interaction service
```

#### ❌ DON'T: Cross-service responsibilities
```typescript
// WRONG: Don't add user endpoints to discovery service
app.get('/api/discovery/users/:id', ...);     // This belongs in user service!

// WRONG: Don't add discovery logic to user service  
app.post('/api/users/next-discovery', ...);   // This belongs in discovery service!
```

### Service Communication Guidelines

1. **Frontend to Services**: Direct HTTP calls via `lib/api-client.ts`
2. **Service to Service**: Currently avoided; services are autonomous with their own data
3. **Shared Types**: Keep service-specific types in each service's `types.ts`
4. **Error Handling**: Use `ApiError` class for consistent error responses
5. **Health Checks**: Each service exposes `/health` endpoint
6. **Database Access**: Each service manages its own Supabase client and tables

### Adding New Services

When creating a new service (e.g., `content-service`, `analytics-service`):

1. **Create service directory**: `apis/new-service/`
2. **Add to workspace**: Update root `package.json` workspaces array
3. **Add dev scripts**: Add `dev:new`, `install:new`, `build:new`, `start:new` scripts
4. **Choose port**: Use next available port (7004, 7005, etc.)
5. **Update API client**: Add new service class to `lib/api-client.ts`
6. **Environment vars**: Add `NEXT_PUBLIC_NEW_SERVICE_API_URL` if needed
7. **Database setup**: Create `lib/supabase.ts` client and corresponding migrations

#### Required Service Structure:
```
apis/new-service/
├── src/
│   ├── routes/          # API endpoint handlers
│   ├── lib/             # Business logic & data access
│   │   └── supabase.ts  # Database connection
│   ├── types.ts         # Service-specific types
│   └── server.ts        # Fastify server setup
├── package.json         # Service dependencies
└── tsconfig.json        # TypeScript config
```

#### Required Scripts in Service package.json:
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc", 
    "start": "node dist/server.js"
  }
}
```

#### Required Dependencies for Each Service:
```json
{
  "dependencies": {
    "fastify": "^4.x.x",
    "@fastify/cors": "^9.x.x",
    "@supabase/supabase-js": "^2.x.x",
    "dotenv": "^16.x.x",
    "zod": "^3.x.x"
  },
  "devDependencies": {
    "tsx": "^4.x.x",
    "typescript": "^5.x.x",
    "@types/node": "^20.x.x"
  }
}
```

---

## 🧰 Tech & Constraints

### Web Frontend (ui/portal)
- **Next.js 15 (App Router)** + **TypeScript (strict)**
- **Clerk** for authentication and user management
- **Tailwind CSS** with **CSS variables**; keep theme tokens in `app/styles/*.css`
- **DaisyUI utilities OK**, but **do not** rely on Tailwind theme config; use our CSS files for light/dark.
- **Icons:** Font Awesome classes like `fa-solid fa-duotone fa-icon` or `fa-brands fa-facebook`
- **Accessibility:** Keyboard-first, visible focus, ARIA where appropriate.

### Mobile Frontend (mobile/expo)
- **React Native** with **Expo SDK 50+** + **TypeScript (strict)**
- **Expo Router** for file-based navigation
- **Clerk Expo SDK** for authentication (same user accounts as web)
- **React Native Reanimated & Gesture Handler** for smooth interactions
- **Expo native modules** (Haptics, Notifications, WebBrowser, Sharing)
- **Platform-specific design** following iOS HIG and Material Design patterns

### Backend Services
- **Fastify** for all API services (lightweight, fast, TypeScript-friendly)
- **TypeScript (strict)** across all services
- **Zod** for request/response validation
- **Pino** for structured logging (via Fastify)
- **Supabase** for database operations (PostgreSQL with real-time capabilities)
- **dotenv** for environment variable management

### Database
- **Supabase** - Hosted PostgreSQL with real-time subscriptions
- **Per-service clients** - Each service has its own Supabase client configuration
- **Migration-based schema** - All schema changes tracked in `database/migrations/`
- **Environment separation** - Easy to switch between dev/staging/prod databases

### Development
- **Monorepo** with npm workspaces
- **Concurrently** for running multiple services
- **TSX** for TypeScript execution in development
- **PowerShell** scripts for Windows compatibility

### Workspace Management

#### When Adding a New API Service:
1. **ALWAYS** add the service to root `package.json` workspaces array
2. **ALWAYS** add corresponding scripts: `dev:servicename`, `install:servicename`, `build:servicename`, `start:servicename`
3. **ALWAYS** update the color count in the main `dev` script (add another color to the prefix-colors)
4. **ALWAYS** update `lib/api-client.ts` with the new service's API methods
5. **ALWAYS** add environment variable for the service URL (e.g., `NEXT_PUBLIC_SERVICENAME_API_URL`)
6. **ALWAYS** create `lib/supabase.ts` client for database access
7. **ALWAYS** add required dependencies: `@supabase/supabase-js`, `dotenv`, etc.

#### Service Development Standards:
- **Container port**: ALL services MUST use **8080** as default internal port (override via PORT env var)
- **Service ports**: External service addressing uses logical ports (7001=discovery, 7002=interaction, 7003=user, 7004=crawler)
- **Port mapping**: Kubernetes maps external ports to internal 8080 via `targetPort`
- **API endpoints**: ALL services MUST use `/api` prefix for API routes (register routes with `{ prefix: '/api' }`)
- **Health check endpoint**: Use `/health` (no prefix) for service health checks
- **Route structure**: Routes define resource paths (e.g., `/saved`, `/users/:id`, `/topics`) combined with `/api` prefix
- **Final URLs**: Results in clean URLs like `/api/saved`, `/api/users/:id`, `/api/topics`, `/api/next`
- Use **structured logging** with Pino
- Implement **proper error handling** with HTTP status codes
- Include **CORS configuration** for frontend communication
- Use **Zod schemas** for request/response validation
- **Environment variables**: Load via `dotenv` and validate on startup
- **Database client**: Create dedicated Supabase client in `lib/supabase.ts`

#### CRITICAL API Endpoint Standards:
- **✅ CORRECT**: `await fastify.register(userRoutes, { prefix: '/api' });` + routes using `/users/:id`
- **✅ CORRECT**: `await fastify.register(savedRoutes, { prefix: '/api' });` + routes using `/saved`
- **❌ WRONG**: `await fastify.register(userRoutes, { prefix: '/api/users' });` (redundant prefix)
- **❌ WRONG**: `await fastify.register(userRoutes);` (missing /api prefix)

**Frontend Integration**: 
```typescript
const USER_API = `${USER_API_URL}/api`; // e.g., http://localhost:7003/api
// Results in calls to: http://localhost:7003/api/users/123, http://localhost:7003/api/topics
```

#### Critical Database Patterns:
Each service MUST have a `lib/supabase.ts` file that:
```typescript
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## 📦 Dependencies

### Frontend (ui/portal)
```json
{
  "dependencies": {
    "next": "^15.4.6",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "@clerk/nextjs": "^6.31.1",
    "@clerk/elements": "^0.23.54",
    "clsx": "^2.1.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.6.2",
    "@tailwindcss/postcss": "^4.1.11",
    "tailwindcss": "^4.1.11",
    "postcss": "^8.4.45",
    "autoprefixer": "^10.4.20",
    "daisyui": "^5.0.50",
    "eslint": "^9.9.0",
    "eslint-config-next": "^15.0.0"
  }
}
```

### Backend Services (each service)
```json
{
  "dependencies": {
    "fastify": "^4.28.1",
    "@fastify/cors": "^9.0.1",
    "@supabase/supabase-js": "^2.45.4",
    "dotenv": "^16.4.5",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "tsx": "^4.19.1",
    "typescript": "^5.6.2",
    "@types/node": "^20.16.10"
  }
}
```

---

## 🧭 Pages & UX

**1) Landing `/`**
- Hero, short value prop, CTA → **Start Stumbling** (`/stumble`).

**2) Stumble `/stumble`**
- Header with brand, nav, and **Wildness** slider.
- Large **Stumble** button (Spacebar triggers it).
- One **DiscoveryCard** visible at a time.
- **ReactionBar** under the card: 👍 Like, 👎 Skip, 🔖 Save, ↗ Share.
- Small line: "Why you're seeing this" (reasons from discovery algorithm).
- Keyboard shortcuts: `Space` → Next; `ArrowUp` → Like; `ArrowDown` → Skip; `S` → Save; `Shift+S` → Share.

**3) Saved `/saved`**
- Grid/list of saved discoveries from database; empty state if none.

**4) Lists `/lists`**
- Placeholder for community lists/trails;

**5) About `/about`**
- Brief manifesto about serendipity and how it works.

**6) Dashboard `/dashboard`**
- User stats, preferences, and interaction history.

**7) 404**
- Friendly empty state with link back to `/stumble`.

---

## 🧱 Components (build simple, accessible)
- **Header**: sticky top; nav: Stumble, Lists, Saved, About, Dashboard. Active state highlighting.
- **StumbleButton**: big, primary, keyboard hint in label ("Space").
- **DiscoveryCard**: full-bleed image, domain chip, title → external link, optional description, topic chips, read time, discovery rationale.
- **ReactionBar**: 4 buttons; show subtle toast for actions (e.g., "Saved").
- **WildnessControl**: slider 0–100; numeric readout; syncs to database.
- **KeyboardShortcuts**: handles keydown bindings + optional small `?` tooltip.
- **Toaster**: lightweight, no external deps.
- **EmptyState**: reusable friendly placeholder.

---

## 🔌 API Integration Patterns

### Frontend State Management
- Use **Clerk hooks** for authentication: `useUser()`, `useAuth()`
- Load user preferences from **User Service** on app initialization
- Cache user data locally, sync changes to User Service with debouncing
- Track `seenIds` locally to avoid duplicate discoveries in session

### Authentication Flow
1. **Clerk middleware** protects routes in `middleware.ts`
2. **User Service** automatically creates profiles for new Clerk users
3. Frontend calls `UserAPI.getOrCreateUser(clerkUserId)` on first load
4. User preferences stored and managed via User Service with Supabase backend

### Discovery Flow on `/stumble`
```typescript
// 1. Load user data (cached after first load)
const user = await UserAPI.getOrCreateUser(clerkUserId);

// 2. Get next discovery with user context
const discovery = await DiscoveryAPI.getNext({
    userId: user.id,
    wildness: user.wildness,
    seenIds: localSeenIds
});

// 3. Record user interactions
await InteractionAPI.recordFeedback(discovery.id, 'up');

// 4. Sync preference changes
await UserAPI.updatePreferences(user.id, { wildness: newValue });
```

### Error Handling & Resilience
- **Graceful degradation**: Use default preferences if services unavailable
- **ApiError class**: Consistent error handling across all services
- **Health checks**: Monitor service availability via `/health` endpoints
- **Loading states**: Show appropriate UI while data loads
- **Database errors**: Handle Supabase connection issues gracefully

---

## 🎨 Styling Guidelines
- Use CSS variables from `themes/*.css`: `--color-primary`, `--color-secondary`, `--color-base-100`, `--color-base-content`, etc.
- Rounded corners (`rounded-2xl`), soft shadows, generous padding.
- Visible focus rings; large click targets on mobile.
- Dark mode via `prefers-color-scheme` and our `dark.css`.

---

## 🧭 File Organization Rules
- **One component per file.** Pages export only the default page component.
- Shared components under `components/`; route-only components under `app/[route]/components/`.
- **Naming:** files `kebab-case.tsx`, components `PascalCase`, props interfaces `ComponentNameProps`.
- Prefer functions < 40 lines; extract helpers when longer.
- **Database clients**: Always in `lib/supabase.ts` with proper error handling.

---

## ✅ Acceptance Criteria
1. **Authentication**: Clerk integration working with sign-in/sign-up flows
2. **User Service**: User preferences auto-created and synced for Clerk users
3. **Discovery Flow**: Real-time discovery from Discovery Service based on user preferences
4. **Interactions**: Like/Skip/Save/Share recorded via Interaction Service
5. **Database Integration**: All services connected to Supabase with proper error handling
6. **Responsive UI**: Works on desktop and mobile with keyboard shortcuts
7. **Service Health**: All services running and communicating properly
8. **Error Handling**: Graceful degradation when services or database unavailable

---

## 🧭 Developer Guidelines

### File Organization
- **One component per file.** Pages export only the default page component.
- **Service separation**: Keep service-specific logic in `lib/api-client.ts`
- **Naming**: files `kebab-case.tsx`, components `PascalCase`
- **Types**: Keep shared types in `data/types.ts`, service types in service directories
- **Database**: Each service has its own `lib/supabase.ts` client

### Code Standards
- **TypeScript strict mode** across all services
- **Error boundaries** for React components
- **Loading states** for all async operations
- **Accessible markup** with proper ARIA labels
- **Responsive design** with mobile-first approach
- **Environment validation** on service startup

### API Development
- **Health endpoints** on all services at `/health`
- **Zod validation** for all request/response schemas
- **Structured logging** with contextual information
- **CORS configuration** for frontend communication
- **Error consistency** using standard HTTP status codes
- **Database connections** with proper error handling and reconnection logic

### Database Development
- **Migration-based schema changes** in `database/migrations/`
- **Per-service table ownership** (users: user-service, discoveries: discovery-service, etc.)
- **Consistent naming**: snake_case for tables/columns, camelCase for TypeScript
- **Proper indexing** for performance-critical queries
- **Environment separation** between dev/staging/prod

---

## 🚀 Getting Started

```bash
# Install all dependencies
npm run install:all

# Start all services
npm run dev

# Check service health
npm run health
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Discovery Service**: http://localhost:7001
- **Interaction Service**: http://localhost:7002
- **User Service**: http://localhost:7003

### Environment Setup
Each service needs environment variables:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

Frontend additionally needs:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_DISCOVERY_API_URL=http://localhost:7001
NEXT_PUBLIC_INTERACTION_API_URL=http://localhost:7002
NEXT_PUBLIC_USER_API_URL=http://localhost:7003
```

---

## 🚫 Common Pitfalls to Avoid

1. **❌ Cross-service database access**: Don't let one service directly query another service's tables
2. **❌ Missing environment validation**: Always validate required environment variables on startup
3. **❌ Hardcoded URLs**: Use environment variables for all service URLs
4. **❌ Missing CORS**: Remember to configure CORS for all API services
5. **❌ Inconsistent error handling**: Use the same error response format across all services
6. **❌ Missing health checks**: Every service needs a `/health` endpoint
7. **❌ Database connection sharing**: Each service should have its own Supabase client
8. **❌ Missing type validation**: Use Zod schemas for all API endpoints
9. **❌ Inconsistent API prefixes**: ALL services must use `/api` prefix for API endpoints, health checks use `/health` without prefix
10. **❌ Localhost-only binding**: Services MUST bind to `0.0.0.0` not `127.0.0.1` for Kubernetes health probes to work

---

## 🔐 Environment Variable & Secret Naming Standards

**CRITICAL**: Follow consistent naming conventions across all services to maintain portability and avoid confusion when services are separated into independent repositories.

### Standard Pattern for Backend API Services

```typescript
// ✅ CORRECT - Standard naming for backend services
const clerkPublishableKey = process.env.CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
```

### Frontend-Only Special Cases

```typescript
// ✅ CORRECT - Next.js client-side variables use NEXT_PUBLIC_ prefix
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
```

### Naming Convention Rules

1. **Backend API Services**: Use **standard names** without framework prefixes
   - ✅ `CLERK_PUBLISHABLE_KEY` (NOT `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`)
   - ✅ `CLERK_SECRET_KEY`
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_KEY`

2. **Frontend (Next.js)**: Use `NEXT_PUBLIC_` prefix ONLY for client-side variables
   - ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (exposed to browser)
   - ✅ `CLERK_SECRET_KEY` (server-side only, no prefix)

3. **Kubernetes Secrets**: Match the environment variable names services expect
   ```yaml
   # ✅ CORRECT - Secret keys match what services use
   - name: CLERK_PUBLISHABLE_KEY
     valueFrom:
       secretKeyRef:
         name: stumbleable-secrets
         key: CLERK_PUBLISHABLE_KEY  # Same name
   ```

4. **GitHub Secrets**: Use the same names as Kubernetes secret keys
   ```yaml
   # ✅ CORRECT - GitHub secret → K8s secret → Pod env var
   --from-literal=CLERK_PUBLISHABLE_KEY="${{ secrets.CLERK_PUBLISHABLE_KEY }}"
   ```

### Verification Before Changing Names

**ALWAYS verify existing patterns before renaming environment variables:**

```bash
# Step 1: Check what the workflow creates
grep "from-literal" .github/workflows/deploy-aks.yml

# Step 2: Check what K8s YAMLs reference  
grep "CLERK_PUBLISHABLE_KEY" k8s/base/*-service.yaml

# Step 3: Check what the code uses
grep "process.env.CLERK" apis/*/src/server.ts

# Step 4: Verify they all match before suggesting changes
```

### Why This Matters

- **Portability**: When services move to separate repos, standard names work everywhere
- **Clarity**: No confusion about which prefix applies to which service type
- **Maintainability**: Team members understand conventions without documentation
- **Consistency**: Same variable name throughout the stack (GitHub → K8s → Pod → Code)

### ❌ WRONG Examples

```typescript
// ❌ Don't use Next.js conventions in backend APIs
const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY; // Wrong!

// ❌ Don't mix naming conventions
secretKeyRef:
  key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  // For backend API? Wrong!
  
// ❌ Don't rename without verifying existing usage
// Before suggesting to change CLERK_PUBLISHABLE_KEY to something else,
// check what's actually being used in the workflow and code!
```

---

## 🐳 Kubernetes & Docker Standards

### Container Host Binding

**CRITICAL**: All API services MUST bind to `0.0.0.0` for Kubernetes health probes:

```typescript
// ✅ CORRECT - Kubernetes-compatible
const host = process.env.HOST || '0.0.0.0';
await app.listen({ port, host });

// ❌ WRONG - Health probes will fail
const host = process.env.HOST || '127.0.0.1';  // Localhost only!
```

**Why?** Kubernetes probes connect from outside the container via the pod's IP. Services bound to `127.0.0.1` only accept connections from within the same container.

### Network Flow
```
Kubernetes Probe → Pod IP (10.240.x.x) → Container (0.0.0.0:8080) → App ✅
Kubernetes Probe → Pod IP (10.240.x.x) → Container (127.0.0.1:8080) ❌ Connection refused
```

### Port Mapping Architecture

**Container Internal Port**: 8080 (standard)
- All services bind to port 8080 inside the container
- Can be overridden via PORT environment variable
- Makes containers portable and reusable

**Kubernetes Service Ports**: 7001-7004 (logical addressing)
```yaml
# Service definition maps external to internal
service:
  port: 7001           # External: discovery-service:7001
  targetPort: 8080     # Internal: container listens on 8080
```

**Why This Matters**:
- ✅ **Portability**: Same container can run anywhere (local Docker, K8s, Cloud Run, ECS)
- ✅ **Convention**: 8080 is the standard HTTP service port
- ✅ **Separation**: Container doesn't need to know its service identity
- ✅ **Flexibility**: K8s handles external port mapping without rebuilding images

**Example Flow**:
```
Frontend → discovery-service:7001 (K8s Service)
  → Pod:8080 (Container)
    → App listening on 0.0.0.0:8080
```

---

> **Ready:** The architecture is now properly separated with microservices handling distinct concerns, all connected to a Supabase database with proper error handling and environment management.