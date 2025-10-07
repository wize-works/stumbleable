# Stumbleable Chrome Extension - Quick Start

## 🚀 Installation (Development)

### 1. Install Dependencies

```powershell
cd extensions\chrome
npm install
```

### 2. Build the Extension

```powershell
npm run build
```

This compiles TypeScript and copies all assets to the `dist/` folder.

### 3. Create Placeholder Icons

The extension needs icon files. For now, create simple placeholders:

**Quick Method** (Windows):
1. Open Paint
2. Create a new image
3. Resize to 128x128 pixels
4. Fill with a color (e.g., purple #667eea)
5. Add text "S" in white
6. Save as `extensions\chrome\icons\icon128.png`
7. Repeat for icon16.png (16x16), icon32.png (32x32), icon48.png (48x48)

**Or just copy these files** from any other Chrome extension's icons folder temporarily.

### 4. Load in Chrome

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Navigate to and select: `G:\code\@wizeworks\stumbleable\extensions\chrome\dist`
5. The extension should now appear in your toolbar! 🎉

### 5. Sign In to Stumbleable

1. Go to `http://localhost:3000/sign-in`
2. Sign in with your account
3. The extension will automatically detect your authentication

### 6. Start Using!

**Click the Extension Icon**: Opens the stumble popup
**Right-click any page**: See "Submit to Stumbleable" and "Save to Stumbleable"
**Keyboard Shortcuts**:
- `Ctrl+Shift+S`: Open stumble popup
- `Ctrl+Shift+D`: Save current page
- `Ctrl+Shift+U`: Submit current page

---

## 🔧 Development Workflow

### Watch Mode

```powershell
npm run watch
```

This automatically recompiles when you edit TypeScript files.

**After making changes:**
1. Go to `chrome://extensions/`
2. Click the **refresh icon** on the Stumbleable extension card
3. Test your changes

### Testing

1. **Test Popup**: Click extension icon
2. **Test Context Menus**: Right-click on any page
3. **Test Shortcuts**: Use keyboard shortcuts on any page
4. **Test API Integration**: Check browser console for errors

### Common Issues

**Extension not loading:**
- Make sure you ran `npm run build`
- Check that `dist/` folder has all files
- Look for errors in `chrome://extensions/`

**API calls failing:**
- Ensure all backend services are running (`npm run dev` in root)
- Check console for CORS errors
- Verify you're signed in to the web app

**Icons missing:**
- Create placeholder icon files in `icons/` folder
- Any PNG files will work temporarily
- See `icons/README.md` for details

---

## 📦 Building for Production

### 1. Update API URLs

Edit `src/background.ts` and change:

```typescript
const API_BASE_URL = 'https://stumbleable.com';
const DISCOVERY_API_URL = 'https://api.stumbleable.com/discovery';
const INTERACTION_API_URL = 'https://api.stumbleable.com/interaction';
const USER_API_URL = 'https://api.stumbleable.com/user';
```

### 2. Create Real Icons

Design proper branded icons at required sizes (see `icons/README.md`)

### 3. Build and Package

```powershell
npm run package
```

This creates `stumbleable-extension.zip` ready for Chrome Web Store.

---

## 🎯 Next Steps

1. **Create branded icons** - Replace placeholders with real Stumbleable branding
2. **Test all features** - Use the testing checklist in `BROWSER_EXTENSION_COMPLETE.md`
3. **Deploy services** - Ensure production APIs are running
4. **Publish to Chrome Web Store** - Follow Chrome Web Store guidelines

---

## 📚 Full Documentation

See `docs/BROWSER_EXTENSION_COMPLETE.md` for complete technical documentation.

---

**Need Help?**
- Check the [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- Review `extensions/chrome/README.md` for user documentation
- Open an issue on GitHub for bugs or feature requests
