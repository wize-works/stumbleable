# Stumbleable Chrome Extension - Simplified Architecture

## 📝 Overview

The extension is being redesigned to be a **quick-action launcher** rather than a full stumble experience. The actual stumbling happens on the web app where we have full control over the UX.

## 🎯 Core Philosophy

**"Quick access, not full replication"**

The extension should:
- ✅ Provide fast access to the web app
- ✅ Enable quick submission/saving of current pages
- ✅ Show basic user stats
- ❌ NOT try to replicate the full stumble experience
- ❌ NOT load discoveries within the extension

## 🚀 Implemented Features

### 1. **Start Stumbling** (Primary Action)
- Big button that opens `/stumble` page in new tab
- Keyboard shortcut: `Ctrl+Shift+S` (Cmd+Shift+S on Mac)
- Works whether signed in or not

### 2. **Submit Current Page**
- Quick button to add current page to Stumbleable
- Requires authentication
- Keyboard shortcut: `Ctrl+Shift+U`
- Validates URL (skips chrome:// and other internal pages)
- Shows success/error toast

### 3. **Save Current Page**
- Quick button to save current page for later
- Requires authentication
- Keyboard shortcut: `Ctrl+Shift+D`
- Also validates URLs

### 4. **Authentication**
- OAuth token exchange via `/extension-auth` callback
- Shows signed-in badge
- Sign out option
- Persists across browser restarts

## 💡 Additional Features to Consider

### **High Priority** (Should implement soon)

#### 1. **User Stats Dashboard**
```typescript
interface UserStats {
  savedCount: number;       // Total saved items
  submittedCount: number;   // Total submitted items
  stumbleCount: number;     // Total stumbles viewed
  todayCount: number;       // Stumbles today
}
```
- Show quick stats in popup
- Link to full dashboard on web app
- Update counts after actions

#### 2. **Page Status Indicator**
- Check if current page is already in Stumbleable
- Show badge if page is saved
- Indicate if user has already seen this page
- Suggest similar content

```typescript
// API endpoint needed:
GET /api/content/check?url=https://example.com
Response: {
  exists: boolean,
  isSaved: boolean,
  wasSeen: boolean,
  similarCount: number
}
```

#### 3. **Smart Submission Hints**
- Analyze current page and suggest if it's "stumbleable"
- Check domain reputation
- Estimate read time
- Suggest appropriate topics

```typescript
interface PageAnalysis {
  isStumbleable: boolean;
  reason: string;
  suggestedTopics: string[];
  readTime: number;
  quality: 'high' | 'medium' | 'low';
}
```

### **Medium Priority** (Nice to have)

#### 4. **Topic Selector**
- When submitting, allow quick topic selection
- Remember frequently used topics
- Auto-suggest based on page content

```html
<select id="topic-select" multiple>
  <option value="tech">Technology</option>
  <option value="design">Design</option>
  <!-- Populated from API -->
</select>
```

#### 5. **Badge Counter**
- Show number of new discoveries on extension icon
- Update when new content is available
- Click badge to open stumble page

```typescript
chrome.action.setBadgeText({ text: '5' });
chrome.action.setBadgeBackgroundColor({ color: '#FF4D6D' });
```

#### 6. **Recent Saves Quick View**
- Show last 3-5 saved items
- Quick links to open them
- Remove from saved list

```html
<div class="recent-saves">
  <h4>Recent Saves</h4>
  <ul>
    <li>
      <a href="...">Article Title</a>
      <button class="remove">×</button>
    </li>
  </ul>
</div>
```

#### 7. **Context Menu Enhancements**
- Right-click on link → "Submit to Stumbleable"
- Right-click on image → "Submit image page"
- Right-click on selected text → "Search Stumbleable"

### **Low Priority** (Future enhancements)

#### 8. **Wildness Preference**
- Quick slider to adjust wildness
- Syncs with web app
- Shows current setting

#### 9. **Dark Mode**
- Auto-detect system preference
- Match browser theme
- Toggle in extension

#### 10. **Submission Notes**
- Add personal notes when submitting
- Tag specific parts of content
- Private annotations

#### 11. **Share to Lists**
- Quick dropdown to add to specific lists
- Create new list from extension
- Manage list memberships

#### 12. **Offline Queue**
- Queue submissions when offline
- Sync when connection restored
- Show pending count

## 🏗️ Recommended Implementation Order

### Phase 1: Core Experience (Current)
- [x] Authentication flow
- [x] Start Stumbling button
- [x] Submit current page
- [x] Save current page
- [x] Basic error handling

### Phase 2: User Engagement
- [ ] User stats display
- [ ] Page status indicator
- [ ] Toast notifications polish
- [ ] Keyboard shortcuts help

### Phase 3: Smart Features
- [ ] Smart submission hints
- [ ] Topic selector
- [ ] Badge counter
- [ ] Recent saves view

### Phase 4: Power User Features
- [ ] Context menu enhancements
- [ ] Wildness control
- [ ] Advanced settings
- [ ] Submission notes

## 🎨 UI/UX Principles

### Popup Design
- **Fast**: < 200ms to open and show content
- **Clear**: Obvious primary action (Start Stumbling)
- **Contextual**: Show relevant info about current page
- **Non-intrusive**: Don't block user's workflow

### Interaction Patterns
- **Toast for feedback**: Quick success/error messages
- **Minimal modals**: Only for complex actions (topic selection)
- **Keyboard-first**: All actions accessible via keyboard
- **Progressive disclosure**: Show advanced features only when needed

### Visual Hierarchy
1. **Primary**: Start Stumbling button
2. **Secondary**: Submit/Save current page
3. **Tertiary**: Stats, settings, links

## 📊 Metrics to Track

### Usage Metrics
- Extension opens per day
- Submissions via extension
- Saves via extension
- Stumbles initiated from extension

### Engagement Metrics
- Average time between actions
- Most used features
- Keyboard shortcut usage
- Error rates

### Performance Metrics
- Popup load time
- API response times
- Auth success rate
- Submission success rate

## 🔧 API Endpoints Needed

### For Stats
```
GET /api/users/:userId/stats
Response: { saved: 45, submitted: 12, stumbles: 234 }
```

### For Page Status
```
GET /api/content/check?url=:url
Response: { exists: true, isSaved: false, wasSeen: true }
```

### For Smart Hints
```
POST /api/content/analyze
Body: { url: "...", html: "..." }
Response: { isStumbleable: true, suggestedTopics: [...], readTime: 5 }
```

### For Recent Saves
```
GET /api/users/:userId/saved?limit=5
Response: [{ id, url, title, savedAt }, ...]
```

## 🚀 Development Workflow

### Building
```bash
cd extensions/chrome
npm run build
```

### Testing
1. Load unpacked extension from `dist/`
2. Test all actions with dev server running
3. Test offline behavior
4. Test error cases

### Deployment
1. Build for production
2. Update manifest version
3. Create .zip package
4. Submit to Chrome Web Store

## 📝 Summary

The simplified extension focuses on being a **quick access point** to Stumbleable rather than trying to replicate the full experience. This approach:

- ✅ Keeps the extension lightweight and fast
- ✅ Avoids complex state management
- ✅ Provides clear value: quick actions
- ✅ Drives users to the full web experience
- ✅ Easier to maintain and update
- ✅ Better performance and reliability

The full stumbling experience stays on the web app where we can:
- Use full React components
- Have complete control over layout
- Implement complex interactions
- Track detailed analytics
- A/B test features
- Iterate quickly
