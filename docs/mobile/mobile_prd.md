# Stumbleable Mobile — Product Requirements Document (PRD) v1.0

**Owner:** Brandon Korous (Product/Engineering)  
**Doc status:** Draft v1.0  
**Product tagline:** *Stumbleable Mobile — serendipity in your pocket.*  
**Platform:** Universal iOS + Android (React Native/Expo)

---

## 1) Executive Summary

Stumbleable Mobile brings the core serendipity experience to iOS and Android through a native Expo app. Users can **Stumble → React → Share** from anywhere, with mobile-optimized gestures, push notifications, and seamless sync with the web platform. The app focuses purely on discovery and personal curation—no marketing pages, admin tools, or extension-auth complexity.

---

## 2) Goals & Non-Goals

**Goals**
* Deliver the complete Stumbleable discovery experience on mobile devices
* Leverage existing microservices architecture (discovery, interaction, user services)
* Provide mobile-native UX patterns (swipe gestures, haptic feedback, share sheets)
* Enable push notifications for discovery engagement and list sharing
* Maintain feature parity with web app's core functionality
* Seamless authentication sync between web and mobile

**Non-Goals (excluded from mobile)**
* Marketing/landing pages (users download from app stores)
* Admin dashboard functionality (web-only)
* Extension authentication flows (not applicable)
* Complex offline functionality (external content requires connection)
* Web-specific features (browser extension integration)

---

## 3) Success Metrics (KPIs)

**Mobile-Specific Metrics**
* **App Store Ratings:** Maintain ≥4.5★ on both iOS and Android
* **Session Duration:** ≥15 min median session (vs. 10-15 min web)
* **Push Notification CTR:** ≥25% for discovery notifications, ≥40% for social
* **Share Completion:** ≥12% of stumbles shared via native share sheet
* **Cross-Platform Sync:** <2% of users report sync issues between web/mobile

**Inherited Web Metrics**
* **Stumble Velocity:** ≤4s between stumbles, ≥8 stumbles/session
* **Quality Signal:** ≥55% 👍 rate, ≤25% skip rate
* **D1/D7 Retention:** D1 ≥40% (mobile boost), D7 ≥20%
* **Save Rate:** ≥10% saved rate (mobile convenience boost)

---

## 4) Mobile-Specific Personas

**On-the-Go Explorer (OGE)**
- Uses mobile during commutes, lunch breaks, waiting periods
- Values quick, thumb-friendly interactions
- Wants to save interesting finds for later desktop reading
- High share usage via native messaging apps

**Couch Discoverer (CD)**  
- Evening mobile browsing from home
- Longer sessions, more likely to click through to full articles
- Uses both mobile and web versions interchangeably
- Builds and curates lists actively

**Social Sharer (SS)**
- Discovers content to share with friends/social networks
- Heavy push notification engagement
- Creates public lists and follows others
- Values seamless sharing flow

---

## 5) Mobile Experience Pillars

1. **Thumb-First Design** — All core actions optimized for one-handed use
2. **Gesture-Driven Flow** — Swipe to stumble, long-press for actions, pull-to-refresh
3. **Contextual Sharing** — Native share sheets, deep links, social integrations
4. **Notification Intelligence** — Smart timing, personalized content, clear value
5. **Cross-Platform Continuity** — Seamless sync of saves, preferences, and lists

---

## 6) Feature Scope

### 6.1 Core Mobile Experience (v1.0)

**Stumble Interface**
* Large, thumb-friendly Stumble button with haptic feedback
* Swipe right/left for next/previous stumble (with limits)
* Pull-down to refresh discovery pool
* Card-based content display optimized for mobile screens
* Inline web view with "Open in Browser" option

**Reactions & Gestures**
* Tap reactions: 👍 👎 🔖 ↗️ with haptic confirmation
* Double-tap card for quick like
* Long-press card for action menu (Save, Share, Hide Domain, Report)
* Swipe up on card for full-screen web view
* Swipe down to return to stumble feed

**Wildness Control**
* Persistent bottom slider with haptic steps
* Visual feedback showing exploration level
* Smart defaults based on time of day/usage patterns

### 6.2 Authentication & Onboarding (v1.0)

**Clerk Integration**
* Native OAuth flows (Google, Apple, GitHub, email)
* Biometric authentication option (Face ID, Touch ID, fingerprint)
* Automatic sync with existing web accounts
* Guest mode for anonymous stumbling (limited features)

**Mobile Onboarding**
* Streamlined 3-screen flow: Welcome → Topics → Notifications
* Topic selection with visual preview cards
* Permission requests (notifications, camera for QR sharing)
* Skip options for power users

### 6.3 Navigation & Information Architecture (v1.0)

**Tab Bar Navigation**
* 🎲 **Stumble** (default, badge for new discoveries)
* 🔖 **Saved** (with unread count)
* 📋 **Lists** (personal + following)
* ⚙️ **Settings** (profile, preferences, sync)

**No Marketing/Admin Screens**
* No landing pages (app store handles acquisition)
* No admin dashboard (web-only functionality)
* No extension authentication (not applicable)

### 6.4 Saved Content & Lists (v1.0)

**Saved Items**
* Grid and list view toggle
* Search and filter by topic, domain, date
* Bulk actions (delete, add to list, share)
* Offline reading markers (cached vs. requires connection)
* Export to other apps (Pocket, Instapaper, Notes)

**Lists Management**
* Create, edit, reorder lists with drag & drop
* Share lists via deep links
* Follow other users' public lists
* Collaborative lists (invite-only)
* List templates and quick-create options

### 6.5 Social Features (v1.0)

**Native Sharing**
* iOS/Android share sheet integration
* Deep links to specific discoveries and lists
* QR code generation for quick sharing
* Social media optimized previews
* Copy link with attribution

**Discovery Social**
* See who submitted content (opt-in)
* Follow other users' public lists
* List collaboration and sharing
* Community-driven topic curation

### 6.6 Push Notifications (v1.0)

**Discovery Notifications**
* "New discoveries in [Topic]" - personalized timing
* "Your saved list has been shared X times"
* "Trending now: [Discovery Title]" - quality-gated
* "Someone added your submission to their list"

**Smart Scheduling**
* Machine learning for optimal send times per user
* Respect Do Not Disturb and quiet hours
* Frequency capping (max 2/day unless urgent)
* Easy unsubscribe options in-app

### 6.7 Mobile-Specific Features (v1.1)

**Device Integration**
* Share discoveries to other apps via system share
* Siri shortcuts for "Stumble something new"
* Home screen widgets showing latest discoveries
* Apple Watch complications (simple stumble count)

**Camera & QR Features**
* QR code scanning for list sharing
* Screenshot detection with "Save to Stumbleable?" prompt
* Photo sharing with automatic OCR for text discovery

### 6.8 Offline & Connectivity (v1.0)

**Limited Offline Support**
* "No connection" screen with cached list access
* Offline viewing of previously loaded discovery cards (metadata only)
* Queue reactions for sync when online
* Clear messaging about what requires internet

**Network Optimization**
* Image caching and compression
* Prefetch next 2-3 discoveries
* Progressive image loading
* Bandwidth-aware quality settings

### 6.9 Mobile Performance (v1.0)

**App Performance**
* Cold start: <3s to first stumble
* Stumble response: <2s for next content
* Memory usage: <150MB typical, <300MB peak
* Battery optimization for background refresh

**Platform Compliance**
* iOS App Store guidelines compliance
* Google Play Store policy adherence
* Accessibility support (VoiceOver, TalkBack)
* Dark mode support with system preference sync

---

## 7) Technical Architecture

### 7.1 Technology Stack

**Frontend Framework**
* **Expo SDK 50+** with React Native
* **TypeScript** strict mode throughout
* **Expo Router** for file-based navigation
* **React Native Reanimated** for smooth gestures
* **React Native Gesture Handler** for swipe/touch interactions

**Authentication & State**
* **Clerk Expo SDK** for authentication
* **Zustand** for client state management
* **React Query** for API caching and sync
* **AsyncStorage** for offline persistence
* **Expo SecureStore** for tokens and sensitive data

**API Integration**
* Same microservices as web (discovery-service:7001, interaction-service:7002, user-service:7003)
* **Expo Constants** for environment configuration
* **React Native NetInfo** for connection status
* **Expo TaskManager** for background sync

### 7.2 Development Workflow

**Build & Deployment**
* **EAS Build** for cloud builds
* **EAS Submit** for app store deployment
* **Expo Dev Client** for development builds
* **GitHub Actions** integration with existing CI/CD

**Environment Management**
* Development, staging, production environment configs
* Same backend services as web application
* Environment-specific API endpoints and feature flags

### 7.3 Native Platform Integration

**iOS Specific**
* **Expo Haptics** for tactile feedback
* **Expo WebBrowser** for in-app web viewing
* **Expo Sharing** for native share sheet
* **Expo Notifications** for push notifications
* **Expo AuthSession** for OAuth flows

**Android Specific**
* **Material Design 3** components where applicable
* **Android Back Handler** for navigation
* **Expo StatusBar** configuration
* **Android notification channels** for categorized notifications

---

## 8) User Experience Design

### 8.1 Mobile-First Interactions

**Gesture Vocabulary**
* **Tap:** Primary actions (stumble, react, navigate)
* **Long Press:** Context menus and secondary actions
* **Swipe Right:** Next stumble (with elastic bounce at limit)
* **Swipe Left:** Previous stumble (if available)
* **Swipe Up:** Expand to full article view
* **Swipe Down:** Return from full article to card
* **Pull to Refresh:** Get new discovery pool
* **Pinch to Zoom:** In full article view

**Haptic Feedback Pattern**
* Light impact: Button taps, reactions
* Medium impact: Stumble action, save action
* Heavy impact: Error states, important confirmations
* Selection feedback: Wildness slider adjustment

### 8.2 Screen Layouts

**Stumble Screen (Primary)**
* Full-screen discovery card with minimal chrome
* Fixed bottom bar: reactions + wildness slider
* Floating stumble button (large, center-bottom)
* Minimal top bar: profile, settings, search

**Saved Screen**
* Switchable grid/list views
* Search bar at top
* Filter chips (topic, date, domain)
* Pull-to-refresh for sync

**Lists Screen**
* "My Lists" and "Following" tabs
* Create new list FAB
* List cards with preview thumbnails
* Collaboration indicators

**Settings Screen**
* Standard iOS/Android patterns
* Account management
* Notification preferences
* Data & privacy
* About & support

### 8.3 Accessibility

**Screen Reader Support**
* Comprehensive VoiceOver/TalkBack labels
* Semantic landmarks and headings
* Action announcements ("Liked", "Saved")
* Content description for discovery cards

**Motor Accessibility**
* Large touch targets (minimum 44pt/48dp)
* Voice control support
* Switch control compatibility
* Adjustable gesture sensitivity

**Visual Accessibility**
* System font scaling support
* High contrast mode
* Reduce motion preferences
* Color blind friendly design

---

## 9) Data Synchronization

### 9.1 Cross-Platform Sync

**Real-Time Sync**
* Saves and reactions sync immediately across devices
* List changes propagate within 5 seconds
* Wildness preferences sync on change
* Push notification state sync

**Conflict Resolution**
* Last-write-wins for preferences
* Merge strategy for list additions
* User prompt for major conflicts
* Automatic retry with exponential backoff

### 9.2 Offline Data Management

**Cached Data**
* Last 50 discovery cards (metadata only)
* Complete saved items list
* User preferences and settings
* List metadata and structure

**Sync Queue**
* Queue reactions when offline
* Batch sync when connection restored
* User feedback for pending actions
* Conflict detection and resolution

---

## 10) Push Notifications Strategy

### 10.1 Notification Types

**Discovery Engagement**
* "3 new discoveries in Design waiting for you" (personalized)
* "Trending: [Title] - 89% love rate" (quality-gated)
* "Your wildness is at 20% - ready to explore?" (re-engagement)

**Social & Lists**
* "[Username] shared a list with you: [List Name]"
* "Your list '[Name]' was saved by 5 people today"
* "[Username] added your discovery to their '[List]' list"

**Milestone & Achievement**
* "You've stumbled 100 discoveries this month! 🎉"
* "Your submission '[Title]' reached 50 likes"
* "Welcome back! Here's what you missed"

### 10.2 Smart Delivery

**Timing Optimization**
* ML-based optimal send time per user
* Respect user timezone and sleep schedule
* Avoid notification spam (max 2/day standard)
* Higher frequency opt-in for power users

**Personalization**
* Topic-based discovery notifications
* Engagement history consideration
* Frequency preference learning
* Clear opt-out options

---

## 11) Performance Requirements

### 11.1 App Performance

**Launch & Response Times**
* Cold start: <3 seconds to usable
* Warm start: <1 second to previous state
* Stumble response: <2 seconds for new content
* Navigation: <200ms between screens

**Memory & Storage**
* RAM usage: <150MB typical, <300MB peak
* Storage: <100MB app + <500MB cache
* Battery: Minimal background processing
* Network: Efficient image loading and caching

### 11.2 API Performance

**Service Integration**
* Same performance targets as web (p95 <600ms TTFB)
* Graceful degradation for service outages
* Retry logic with exponential backoff
* Circuit breaker pattern for failing services

**Caching Strategy**
* API responses cached for 5 minutes
* Images cached for 24 hours
* User preferences cached indefinitely (sync on change)
* Discovery pool pre-cached (3-5 items ahead)

---

## 12) Security & Privacy

### 12.1 Authentication Security

**Clerk Integration**
* OAuth token secure storage
* Biometric authentication option
* Automatic token refresh
* Session management across app lifecycle

**Data Protection**
* API communication via HTTPS only
* Certificate pinning for critical endpoints
* No sensitive data in logs
* Secure storage for user tokens

### 12.2 Privacy Compliance

**Data Minimization**
* Only collect data necessary for functionality
* Clear privacy policy integration
* Opt-in for analytics and personalization
* Easy data export and deletion

**Platform Compliance**
* iOS App Tracking Transparency compliance
* Android privacy manifest requirements
* GDPR compliance for EU users
* CCPA compliance for California users

---

## 13) App Store Optimization

### 13.1 App Store Presence

**App Store Listing**
* Clear value proposition in title/subtitle
* Screenshots showcasing core stumble flow
* Video preview of gesture interactions
* Keyword optimization for discovery

**Store Categories**
* Primary: News (iOS) / News & Magazines (Android)
* Secondary: Entertainment, Lifestyle
* Age rating: 12+ (web content access)

### 13.2 Store Guidelines Compliance

**iOS App Store**
* Human Interface Guidelines compliance
* No prohibited content or functionality
* Clear app purpose and functionality
* Appropriate use of system features

**Google Play Store**
* Material Design adherence where appropriate
* Policy compliance for content access
* Appropriate permissions usage
* Target API level compliance

---

## 14) Testing Strategy

### 14.1 Functional Testing

**Core Flow Testing**
* Stumble → React → Save flow
* Authentication and onboarding
* Cross-platform sync verification
* Push notification delivery and interaction

**Platform-Specific Testing**
* iOS gesture behavior and haptics
* Android back button and navigation
* Biometric authentication on both platforms
* Share sheet integration testing

### 14.2 Performance Testing

**Device Performance**
* Testing across device tiers (high, mid, low-end)
* Memory usage under extended sessions
* Battery usage monitoring
* Network condition variations (3G, WiFi, offline)

**Load Testing**
* Concurrent user simulation
* API rate limiting behavior
* Image loading performance
* Background sync efficiency

---

## 15) Release Strategy

### 15.1 Development Phases

**Phase 1: Core MVP (v1.0)**
* Stumble flow with gesture support
* Authentication and onboarding
* Saved items and basic lists
* Push notifications infrastructure
* **Timeline:** 8-10 weeks

**Phase 2: Social Features (v1.1)**
* List sharing and collaboration
* Enhanced push notifications
* Social discovery features
* Performance optimizations
* **Timeline:** +4-6 weeks

**Phase 3: Platform Integration (v1.2)**
* Siri shortcuts and widgets
* Camera/QR features
* Advanced gestures
* Platform-specific enhancements
* **Timeline:** +4-6 weeks

### 15.2 Rollout Plan

**Beta Testing**
* Internal team testing (2 weeks)
* Closed beta with existing web users (2 weeks)
* TestFlight/Play Console open beta (2 weeks)
* Feedback integration and iteration

**Production Release**
* Soft launch in select markets
* Monitor crash rates and performance
* Gradual rollout to all markets
* Post-launch optimization cycle

---

## 16) Analytics & Monitoring

### 16.1 Mobile-Specific Analytics

**User Behavior**
* Screen flow and navigation patterns
* Gesture usage and preference
* Session duration and frequency
* Feature adoption rates

**Performance Monitoring**
* Crash reporting and symbolication
* ANR (Application Not Responding) tracking
* Network request monitoring
* Battery usage analytics

### 16.2 Business Metrics

**Engagement Metrics**
* Daily/Monthly active users
* Session depth and duration
* Push notification engagement
* Cross-platform usage patterns

**Quality Metrics**
* App store ratings and reviews
* User satisfaction surveys
* Support ticket volume and types
* Feature request frequency

---

## 17) Risks & Mitigations

### 17.1 Technical Risks

**Performance Risk**
* *Risk:* Poor performance on low-end devices
* *Mitigation:* Extensive device testing, performance budgets, fallback UI

**API Dependency Risk**
* *Risk:* Backend service outages affecting mobile experience
* *Mitigation:* Graceful degradation, offline capabilities, circuit breakers

**Platform Changes Risk**
* *Risk:* iOS/Android updates breaking functionality
* *Mitigation:* Beta testing, SDK update monitoring, compatibility testing

### 17.2 Business Risks

**App Store Approval Risk**
* *Risk:* App rejection or policy violations
* *Mitigation:* Early compliance review, gradual feature rollout, policy monitoring

**User Adoption Risk**
* *Risk:* Low adoption from existing web users
* *Mitigation:* Cross-promotion, seamless sync, mobile-exclusive features

**Competition Risk**
* *Risk:* Similar apps gaining market share
* *Mitigation:* Unique value proposition, rapid iteration, community building

---

## 18) Success Criteria

### 18.1 Launch Success (30 days)

* **Downloads:** 5,000+ installs from existing user base
* **Retention:** D1 ≥35%, D7 ≥20% retention rates
* **Ratings:** 4.5+ stars on both app stores
* **Crashes:** <1% crash rate across all sessions
* **Performance:** <3s cold start, <2s stumble response

### 18.2 Growth Success (90 days)

* **User Base:** 15,000+ MAU across mobile platforms
* **Cross-Platform:** 60%+ of web users also use mobile
* **Engagement:** 20+ stumbles per session average
* **Social:** 25%+ of users create or follow lists
* **Notifications:** 30%+ push notification CTR

---

## 19) Future Enhancements

### 19.1 Advanced Features (Post-v1.2)

**AI & Machine Learning**
* Smart notification timing optimization
* Personalized discovery ordering
* Content quality prediction
* User behavior prediction

**Advanced Social**
* Direct messaging for list sharing
* Community challenges and events
* Creator monetization features
* Advanced collaboration tools

### 19.2 Platform Expansion

**Additional Platforms**
* iPad-optimized interface
* Apple Watch companion app
* Android tablet optimization
* Desktop app consideration

**Ecosystem Integration**
* Smart TV casting support
* Car integration (CarPlay/Android Auto)
* Voice assistant integration
* IoT device integration

---

## 20) Appendices

### 20.1 Technical Dependencies

**Required Services**
* Discovery Service (localhost:7001)
* Interaction Service (localhost:7002)  
* User Service (localhost:7003)
* Supabase Database
* Clerk Authentication

**Required Expo Modules**
* expo-router, expo-haptics, expo-notifications
* expo-web-browser, expo-sharing, expo-secure-store
* expo-auth-session, expo-constants, expo-task-manager

### 20.2 Design System Integration

**Brand Consistency**
* Same color palette and typography as web
* Adapted component library for mobile
* Consistent iconography and imagery
* Platform-appropriate animations

**Responsive Design**
* Phone-first approach (375px base)
* Tablet breakpoints (768px+)
* Dynamic type support
* Accessibility scaling support

---

**Document Status:** Ready for technical review and development kickoff  
**Next Steps:** Technical architecture review, design system adaptation, development timeline finalization