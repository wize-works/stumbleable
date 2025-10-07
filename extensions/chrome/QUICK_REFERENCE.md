# Stumbleable Browser Extension - Quick Reference

**Status**: ✅ Complete | **Date**: Oct 6, 2025

---

## 📍 Quick Links

### Extension Files
- **Location**: `extensions/chrome/`
- **Main Code**: `src/background.ts`, `src/popup.ts`, `src/content.ts`
- **User Guide**: `extensions/chrome/README.md`
- **Dev Guide**: `extensions/chrome/QUICKSTART.md`

### Marketing Pages
- **Main Page**: `/extensions` → `app/(marketing)/extensions/page.tsx`
- **Chrome Page**: `/extensions/chrome` → `app/(marketing)/extensions/chrome/page.tsx`

### Documentation
- **Implementation**: `docs/BROWSER_EXTENSION_COMPLETE.md`
- **Marketing**: `docs/EXTENSION_MARKETING_PAGES.md`
- **Summary**: `docs/EXTENSION_IMPLEMENTATION_SUMMARY.md`

---

## 🚀 Quick Start

### Install & Build Extension
```bash
cd extensions/chrome
npm install
npm run build
```

### Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extensions/chrome/dist` folder

### View Marketing Pages
```bash
# From portal folder
npm run dev
```
Then visit:
- http://localhost:3000/extensions
- http://localhost:3000/extensions/chrome

---

## ✅ Features Implemented

- ✅ L1.1: Quick stumbling popup
- ✅ L1.2: Submit current page (context menu + `Ctrl+Shift+U`)
- ✅ L1.3: Save current page (context menu + `Ctrl+Shift+D`)
- ✅ L1.4: Preferences sync (Chrome Storage + server)
- ✅ L1.5: Keyboard shortcuts (5 global, 5 popup)

---

## 📋 TODO Before Launch

- [ ] Create icon assets (16, 32, 48, 128 px)
- [ ] Add extension screenshots
- [ ] Update header navigation with Extensions link
- [ ] Test all features end-to-end
- [ ] Submit to Chrome Web Store

---

## 📊 File Count

- Extension: 15 files
- Marketing: 2 pages
- Documentation: 4 guides
- **Total**: 21 files

---

## 🎯 Key Commands

### Build Extension
```bash
npm run build      # Compile and copy assets
npm run watch      # Watch mode
npm run package    # Create ZIP
npm run clean      # Clean dist/
```

### Keyboard Shortcuts
```
Ctrl+Shift+S  Open popup
Ctrl+Shift+D  Save page
Ctrl+Shift+U  Submit page
Space         Next stumble (in popup)
↑ / ↓         Like / Skip (in popup)
S             Save (in popup)
```

---

**Need more info?** See full documentation in `docs/` folder.
