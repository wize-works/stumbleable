# Stumbleable Development Tasks

**Status**: Based on PRD v1.0 and current implementation analysis  
**Updated**: September 30, 2025  
**Priority**: Critical (MVP) → High (v1) → Medium (v1.1) → Low (v1.2+)

---

## 🎯 Current Implementation Status

### ✅ **COMPLETED** (MVP Foundation)
- ✅ **Monorepo Structure**: All services scaffolded and running
- ✅ **Database Schema**: Comprehensive Supabase PostgreSQL setup with RLS, triggers, and sample data
- ✅ **Core UI Framework**: Next.js 15 with Clerk auth, basic pages, and components
- ✅ **Service Architecture**: Discovery, Interaction, and User services with Fastify
- ✅ **Basic Stumble Flow**: UI with iframe display, reactions, and wildness control
- ✅ **Authentication**: Clerk integration with user creation flow
- ✅ **Health Checks**: All services responding and healthy
- ✅ **Development Environment**: Complete dev setup with concurrent service running
- ✅ **API Integration**: All services connected with real API responses, no mock data
- ✅ **Database Integration**: All services fully connected to Supabase with CRUD operations
- ✅ **Real Content Submission**: Content submission endpoint with URL validation and enrichment
- ✅ **Discovery Algorithm**: Multi-factor scoring with personalization and rationale generation
- ✅ **User Onboarding**: Complete topic selection and preference initialization
- ✅ **Saved Content System**: Full save/unsave functionality with proper state management
- ✅ **Custom User Interface**: Custom user menu and authentication components
- ✅ **Expanded Topic System**: 35 topics across 6 playful categories for enhanced discovery
- ✅ **Onboarding Fix**: Fixed user creation error in onboarding wizard - now properly updates existing user preferences
- ✅ **Toast Notifications**: Replaced alert() with proper toast notification system in onboarding
- ✅ **Code Cleanup**: Resolved all TODO items in codebase (topic classification, session management)
- ✅ **Content Moderation UI**: Complete moderation panel with proper role-based access control
- ✅ **Content Reporting**: User-facing report button integrated into discovery cards
- ✅ **UX Improvements**: Consistent toast notifications across moderation and reporting features

### 🔄 **IN PROGRESS** (Currently Working On)
- 🔄 **Performance Optimization**: Final tuning and edge case handling

---

## 🚀 **CRITICAL PRIORITY** (MVP - Beta Release)

### **Content & Discovery System**
- ✅ **C1. Real Content Ingestion** *(COMPLETED)*
  - ✅ C1.1: Build submission endpoint (`POST /api/submit`) with URL validation
  - ✅ C1.2: Create content enrichment service (fetch title, description, image, topics)
  - ✅ C1.3: Implement content deduplication by canonical URL
  - ✅ C1.4: Add content safety/quality filters (NSFW, spam detection) - Initial implementation complete
  - 🔄 C1.5: Create content approval workflow for submissions - In progress with moderation queue

- ✅ **C2. Discovery Algorithm Implementation** *(COMPLETED)*
  - ✅ C2.1: Build multi-factor scoring system (PRD Section 9)
  - ✅ C2.2: Implement topic-based user matching 
  - ✅ C2.3: Add wildness-based exploration logic (ε-greedy)
  - ✅ C2.4: Create session-based deduplication
  - ✅ C2.5: Add "Why you're seeing this" rationale generation

- ✅ **C3. Database Service Integration** *(COMPLETED)*
  - ✅ C3.1: Connect Discovery Service to Supabase content tables
  - ✅ C3.2: Connect Interaction Service to user_interactions table
  - ✅ C3.3: Connect User Service to users and user_preferences tables
  - ✅ C3.4: Implement proper error handling and connection pooling
  - ✅ C3.5: Add service-level data validation with Zod schemas

### **Core User Experience**
- ✅ **C4. Complete Stumble Flow** *(COMPLETED)*
  - ✅ C4.1: Replace mock data with real API responses
  - ✅ C4.2: Implement proper loading states and error handling
  - ✅ C4.3: Add "Why you're seeing this" display in UI
  - ✅ C4.4: Ensure <150ms server response time for next discovery
  - ✅ C4.5: Add proper analytics tracking for discovery events

- ✅ **C5. User Onboarding & Topics** *(COMPLETED)*
  - ✅ C5.1: Build topic selection interface (expanded to 35 topics across 6 categories)
  - ✅ C5.2: Create user preference initialization flow
  - ✅ C5.3: Add first-time user guidance and tips
  - ✅ C5.4: Implement preference sync between frontend and user service
  - ✅ C5.5: Add skip onboarding option with sensible defaults
  - ✅ C5.6: Fixed onboarding user creation bug - now properly updates existing users
  - ✅ C5.7: Improved UX with toast notifications instead of browser alerts

- ✅ **C6. Saved Content System** *(COMPLETED)*
  - ✅ C6.1: Build saved content page with filtering by topic/domain
  - ✅ C6.2: Implement save/unsave actions with proper state management
  - ✅ C6.3: Add saved content organization (basic lists)
  - ✅ C6.4: Create empty states and loading indicators
  - [ ] C6.5: Add export saved content functionality

### **Performance & Reliability**
- 🔄 **C7. API Performance & Reliability** *(MOSTLY COMPLETED)*
  - [ ] C7.1: Implement proper rate limiting on all services
  - ✅ C7.2: Add comprehensive error handling and user-friendly messages
  - ✅ C7.3: Optimize database queries with proper indexing
  - [ ] C7.4: Add service monitoring and alerting
  - ✅ C7.5: Implement graceful degradation when services are down

### **Remaining Critical Tasks**
- ✅ **C8. Content Quality & Safety** *(COMPLETED)*
  - ✅ C8.1: Implement content safety filters (NSFW detection) - Basic implementation complete
  - ✅ C8.2: Add spam and SEO content detection - Implemented with confidence scoring
  - ✅ C8.3: Create content moderation queue - Tables and API endpoints complete
  - ✅ C8.4: Implement rate limiting for content submission - Backend ready
  - ✅ C8.5: Add domain reputation scoring - Database and backend logic complete
  - ✅ C8.6: Add moderation decision endpoints (approve/reject)
  - ✅ C8.7: Implement automatic topic classification for approved content
  - ✅ C8.8: Build admin moderation UI interface - Complete with role-based access
  - ✅ C8.9: Add content reporting system for users - Integrated into discovery cards

- 🔄 **C9. Production Readiness** *(IN PROGRESS - Deployment Ready)*
  - [ ] C9.1: Add comprehensive logging and monitoring
  - [ ] C9.2: Implement rate limiting across all services
  - [ ] C9.3: Add service health monitoring and alerting
  - [ ] C9.4: Create database migration and backup strategies
  - ✅ C9.5: Optimize for production deployment *(COMPLETED - Azure deployment ready)*
  - ✅ C9.6: Create Dockerfiles for all services *(COMPLETED)*
  - ✅ C9.7: Set up Kubernetes manifests *(COMPLETED)*
  - ✅ C9.8: Configure CI/CD with GitHub Actions *(COMPLETED)*
  - ✅ C9.9: Document deployment procedures *(COMPLETED)*

---

## 🎯 **HIGH PRIORITY** (v1 - Full Release)
- [ ] **U1. Retrieve User Profile Data**
  - [ ] U1.1: Fetch user profile data from Clerk store in database
  - [ ] U1.2: Display user profile info in UI from database
  - [ ] U1.3: Allow users to update profile info
  - [ ] U1.4: Sync profile updates with Clerk
  - [ ] U1.5: Add profile picture upload functionality
### **Email Features**
- [ ] **H1. Email Notifications**
  - [ ] H1.1: Build email service integration (e.g., Resend)
  - [ ] H1.2: Create email templates for key notifications
  - [ ] H1.3: Implement welcome email on sign-up
  - [ ] H1.4: Add weekly digest of saved content
  - [ ] H1.5: Contact us form should send email to support
  - [ ] H1.6: Implement unsubscribe and email preferences
  - [ ] H1.7: Add email verification step on sign-up (if we need to with Clerk)
  - [ ] H1.8: Implement password reset email flow (if we need to with Clerk)
  - [ ] H1.9: Add email notifications for content approval/rejection (for creators)


### **Content Management**
- ✅ **H1. Content Crawler System** *(COMPLETED)*
  - ✅ H1.1: Build polite web crawler respecting robots.txt
  - ✅ H1.2: Implement RSS/sitemap discovery and monitoring
  - ✅ H1.3: Add content freshness tracking and re-crawling
  - ✅ H1.4: Create crawler job scheduling with rate limits
  - ✅ H1.5: Add content quality scoring and filtering
  - ✅ H1.6: Database tables for crawler sources, jobs, history, and stats
  - ✅ H1.7: API routes for source management and job monitoring
  - ✅ H1.8: Integration with discovery-service for content submission
  - [ ] H1.9: Test crawler with real RSS feeds and sitemaps
  - [ ] H1.10: Deploy crawler service and monitor performance

- [ ] **H2. Advanced Discovery Features**
  - [ ] H2.1: Implement trending content calculation (PRD Section 6.5)
  - [ ] H2.2: Add domain reputation scoring system
  - [ ] H2.3: Create personalized recommendation improvements
  - [ ] H2.4: Add content similarity matching for better recommendations
  - [ ] H2.5: Implement A/B testing framework for discovery algorithms

### **User Features**
- 🔄 **H3. Lists & Collections** *(MOSTLY COMPLETED)*
  - ✅ H3.1: Build list creation and management UI *(COMPLETED)*
  - ✅ H3.2: Implement collaborative/public lists sharing *(COMPLETED)*
  - ✅ H3.3: Add list following and discovery *(COMPLETED - H3.3_LIST_SHARING_COMPLETE.md)*
  - ✅ H3.4: List sharing functionality (social, copy link) *(COMPLETED)*
  - [ ] H3.5: Add micro-quests (preset discovery trails)
  - [ ] H3.6: Add list export/import functionality

- [ ] **H4. Enhanced User Profile**
  - [ ] H4.1: Build user dashboard with statistics
  - [ ] H4.2: Add user preference fine-tuning (topic weights)
  - [ ] H4.3: Implement blocked domains/topics management
  - [ ] H4.4: Create user activity history and insights
  - [ ] H4.5: Add data export and account deletion

### **Content Quality & Safety**
- [ ] **H5. Moderation System (this will require user roles, and only allowed roles can be moderators)**
  - [ ] H5.1: Build content reporting and flagging system
  - [ ] H5.2: Create moderation queue for administrators
  - [ ] H5.3: Implement automated spam/SEO content detection
  - [ ] H5.4: Add domain blocking and reputation management
  - [ ] H5.5: Create DMCA takedown request handling

---

## 📈 **MEDIUM PRIORITY** (v1.1 - Enhanced Features)

### **Creator & Curator Tools**
- [ ] **M1. Creator Console**
  - [ ] M1.1: Build submission tracking dashboard
  - [ ] M1.2: Add content performance analytics (views, saves, likes)
  - [ ] M1.3: Create content optimization recommendations
  - [ ] M1.4: Implement creator reputation scoring
  - [ ] M1.5: Add bulk submission tools for power users

- [ ] **M2. Curator Features**
  - [ ] M2.1: Build curator application and approval process
  - [ ] M2.2: Create content curation queue with keyboard shortcuts
  - [ ] M2.3: Add curator analytics and performance tracking
  - [ ] M2.4: Implement curator reputation and privileges system
  - [ ] M2.5: Create curator guidelines and training materials

### **Discovery Enhancements**
- [ ] **M3. Advanced Explore Features**
  - [ ] M3.1: Build topic-based exploration pages
  - [ ] M3.2: Add domain-specific browsing and statistics
  - [ ] M3.3: Create time-based content filtering (today, week, month)
  - [ ] M3.4: Implement related content suggestions
  - [ ] M3.5: Add content search functionality

- [ ] **M4. Social Features**
  - [ ] M4.1: Add basic user profiles (public/private)
  - [ ] M4.2: Implement list sharing and collaboration
  - [ ] M4.3: Create simple follow system for list creators
  - [ ] M4.4: Add social discovery ("Friends also liked")
  - [ ] M4.5: Build community challenges and events

### **Analytics & Insights**
- [ ] **M5. Advanced Analytics**
  - [ ] M5.1: Implement comprehensive user behavior tracking
  - [ ] M5.2: Add content performance analytics dashboard
  - [ ] M5.3: Create discovery algorithm performance monitoring
  - [ ] M5.4: Build user cohort analysis and retention tracking
  - [ ] M5.5: Add real-time usage statistics and alerts

---

## 📱 **LOW PRIORITY** (v1.2+ - Platform Expansion)

### **Mobile & Extensions**
- [ ] **L1. Browser Extension**
  - [ ] L1.1: Build Chrome extension for quick stumbling
  - [ ] L1.2: Add "Submit current page" context menu option
  - [ ] L1.3: Implement "Save current page" functionality
  - [ ] L1.4: Create extension preferences sync
  - [ ] L1.5: Add keyboard shortcuts in extension

- [ ] **L2. PWA & Mobile Optimization**
  - [ ] L2.1: Enhance PWA capabilities with offline support
  - [ ] L2.2: Add push notification system
  - [ ] L2.3: Optimize mobile touch interactions and gestures
  - [ ] L2.4: Create mobile-specific UI optimizations
  - [ ] L2.5: Add native app-like features (share sheet, etc.)

### **Advanced Features**
- [ ] **L3. AI & Machine Learning**
  - [ ] L3.1: Implement content topic classification with AI
  - [ ] L3.2: Add content quality scoring with ML models
  - [ ] L3.3: Create personalized content embeddings
  - [ ] L3.4: Implement intelligent content summarization
  - [ ] L3.5: Add automated content tagging and categorization

- [ ] **L4. Monetization**
  - [ ] L4.1: Build Pro/Patron subscription system
  - [ ] L4.2: Implement sponsored content system (1 in 15 max)
  - [ ] L4.3: Add creator monetization tools
  - [ ] L4.4: Create premium analytics and insights
  - [ ] L4.5: Build enterprise/team collaboration features

### **Infrastructure & Scaling**
- [ ] **L5. Advanced Infrastructure**
  - [ ] L5.1: Implement CDN for content thumbnails and assets
  - [ ] L5.2: Add multi-region deployment and load balancing
  - [ ] L5.3: Create advanced monitoring and observability
  - [ ] L5.4: Implement automated testing and CI/CD pipeline
  - [ ] L5.5: Add disaster recovery and backup systems

---

## 📊 **Success Metrics Tracking**

### **Implementation Required for KPI Monitoring**
- [ ] **Analytics Infrastructure**
  - [ ] Track D1/D7 retention (Target: D1 ≥ 35%, D7 ≥ 18%)
  - [ ] Monitor stumble velocity (Target: ≤ 4s median between stumbles)
  - [ ] Measure quality signals (Target: ≥ 55% 👍 rate, ≤ 25% skip rate)
  - [ ] Track novelty metrics (Target: ≥ 25% from new domains daily)
  - [ ] Monitor save rates (Target: ≥ 8% of items saved by at least one user)
  - [ ] Track submission health (Target: 80/20 community vs. crawler split)

### **Performance Targets**
- [ ] **Technical Metrics**
  - [ ] API response time ≤ 150ms for stumble requests
  - [ ] Page load time ≤ 1s p95 TTFB
  - [ ] 99.9% uptime for public endpoints
  - [ ] Support 5k concurrent users at launch
  - [ ] Zero repeated items per user session

---

## 🔄 **Development Workflow**

### **Next Steps (Immediate)**
**🎉 MVP CORE IS COMPLETE!** All critical user-facing features are implemented and working.

**Latest Updates (Oct 1, 2025):**
- ✅ **Azure Deployment Infrastructure Complete** - Production-ready deployment to AKS
  - ✅ 5 optimized Dockerfiles with multi-stage builds
  - ✅ 10 Kubernetes manifests (deployments, services, ingress, HPA)
  - ✅ 3 GitHub Actions workflows (CI/CD, rollback, scaling)
  - ✅ Comprehensive deployment documentation
  - ✅ Auto-scaling configuration (2-10 replicas)
  - ✅ HTTPS/SSL with Let's Encrypt
  - ✅ Health checks and monitoring-ready
- ✅ **H3.3: List Sharing & Discovery Complete** - Full public/private lists with follow system
- ✅ List visibility toggle (public/private) with proper permissions
- ✅ Public list discovery page with search and pagination
- ✅ Follow/unfollow functionality with real-time counts
- ✅ Collaborator management with granular permissions
- ✅ Social sharing (Twitter, Facebook, LinkedIn) and copy link
- ✅ List detail page with owner controls and item management
- ✅ Followed lists tab showing subscribed collections

**Previous Updates (Sept 30, 2025):**
- ✅ Fixed onboarding user creation bug
- ✅ Implemented toast notification system throughout app
- ✅ Resolved all code TODOs (topic classification, session management)
- ✅ Content moderation system backend complete
- ✅ Admin moderation UI with role-based access complete
- ✅ Content reporting system integrated into discovery cards
- ✅ All UX improvements complete (toast notifications, better error handling)
- ✅ **Content Crawler System Complete** - Full automated content discovery pipeline

**Next Priority Focus:**
1. **Deploy to Azure** - Configure secrets and execute first deployment
2. **C9.1-9.4 (Remaining Production Items)** - Monitoring, rate limiting, alerting, backups
3. **Test & Deploy Crawler** - Install dependencies and test crawler in production
4. **H3.5 (Micro-Quests)** - Preset discovery trails with progress tracking and rewards
5. **H2 (Advanced Discovery Features)** - Trending content and improved recommendations

**Current State:** ✅ **DEPLOYMENT-READY MVP** - Core features complete, Azure deployment infrastructure ready, ready for production launch!

### **Definition of Done**
Each task must include:
- [ ] Implementation with proper error handling
- [ ] Unit tests for critical functionality
- [ ] Integration with existing services
- [ ] Documentation updates
- [ ] Performance validation against targets
- [ ] User experience testing

### **Risk Mitigation**
- **Content Quality**: Implement strong filtering and curation early
- **Performance**: Monitor and optimize database queries continuously
- **User Retention**: Focus on fast, delightful stumble experience
- **Legal Compliance**: Respect robots.txt and implement DMCA process
- **Scalability**: Design with growth in mind but don't over-engineer

---

## 📅 **Estimated Timeline**

- **MVP (Critical)**: 3-4 weeks
- **v1.0 (High Priority)**: 6-8 weeks
- **v1.1 (Medium Priority)**: 10-12 weeks
- **v1.2+ (Low Priority)**: Ongoing development

---

**Note**: This task list is based on the comprehensive PRD requirements and current implementation status. Priority should be given to Critical tasks to achieve a functional MVP, then work systematically through High priority items for the full v1.0 release.


on the stumble page, when needing to add a list, it left the page i wanted to stay on. should be a modal instead of a new page.

we need to create a unique 404 page for when a user goes to a non-existent list, e.g. /list/1234 when that list doesn't exist. or any other invalid route.