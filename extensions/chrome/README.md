# Stumbleable Chrome Extension

Discover amazing content with one click! The Stumbleable Chrome extension brings the joy of serendipitous discovery directly to your browser.

## Features

### 🎲 Quick Stumbling (L1.1)
- Click the extension icon to stumble through curated content
- Beautiful popup interface with discovery cards
- Like, skip, save, and visit content without leaving your current page
- Keyboard shortcuts for lightning-fast navigation

### 📤 Submit Current Page (L1.2)
- Right-click on any page and select "Submit to Stumbleable"
- Submit the current page with `Ctrl+Shift+U` (or `Cmd+Shift+U` on Mac)
- Context menu option for quick submissions
- Automatic metadata extraction

### 🔖 Save Current Page (L1.3)
- Right-click on any page and select "Save to Stumbleable"
- Save the current page with `Ctrl+Shift+D` (or `Cmd+Shift+D` on Mac)
- Instantly add interesting pages to your saved collection
- Visual confirmation notifications

### ⚙️ Preferences Sync (L1.4)
- Wildness slider syncs with your Stumbleable account
- Seamless preference synchronization across devices
- Chrome storage API integration
- Real-time updates to discovery algorithm

### ⌨️ Keyboard Shortcuts (L1.5)
- `Ctrl+Shift+S` (or `Cmd+Shift+S`): Open stumble popup
- `Ctrl+Shift+D` (or `Cmd+Shift+D`): Save current page
- `Ctrl+Shift+U` (or `Cmd+Shift+U`): Submit current page
- In popup:
  - `Space` or `Enter`: Next stumble
  - `↑`: Like
  - `↓`: Skip
  - `S`: Save
  - `V`: Visit page

## Installation

### From Source (Development)

1. **Install dependencies:**
   ```bash
   cd extensions/chrome
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the `extensions/chrome/dist` folder

### From Package (Production)

1. **Build and package:**
   ```bash
   npm run package
   ```

2. **Install the ZIP:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Drag and drop `stumbleable-extension.zip` onto the page

## Development

### Project Structure

```
chrome/
├── src/
│   ├── background.ts      # Service worker (context menus, commands)
│   ├── popup.ts          # Popup UI logic
│   ├── popup.html        # Popup HTML structure
│   ├── popup.css         # Popup styles
│   └── content.ts        # Content script (page interaction)
├── icons/                # Extension icons (16, 32, 48, 128)
├── scripts/              # Build scripts
├── manifest.json         # Extension manifest
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

### Build Scripts

- `npm run build` - Clean, compile TypeScript, and copy assets
- `npm run compile` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for development
- `npm run clean` - Remove dist folder
- `npm run package` - Build and create ZIP package

### API Integration

The extension communicates with the Stumbleable backend services:

- **Discovery Service** (port 7001): Fetch next discovery
- **Interaction Service** (port 7002): Record feedback, save content
- **User Service** (port 7003): Sync preferences

### Environment Configuration

Update API URLs in `src/background.ts` for production:

```typescript
const API_BASE_URL = 'https://stumbleable.com';
const DISCOVERY_API_URL = 'https://api.stumbleable.com/discovery';
const INTERACTION_API_URL = 'https://api.stumbleable.com/interaction';
const USER_API_URL = 'https://api.stumbleable.com/user';
```

## Usage

### Quick Start

1. **Sign in** to your Stumbleable account in the web app
2. **Click the extension icon** to start stumbling
3. **Adjust wildness** to control exploration level
4. **Use keyboard shortcuts** for quick actions

### Context Menu

Right-click on any page to:
- Submit to Stumbleable
- Save to Stumbleable
- Open Stumbleable app

### Popup Interface

The popup provides a mini version of the Stumbleable experience:
- View discovery cards with images, titles, and descriptions
- React with like/skip buttons
- Save interesting content
- Visit the full page
- Adjust wildness preference
- Access quick actions

## Permissions

The extension requires the following permissions:

- **activeTab**: Access current tab information for submission/saving
- **contextMenus**: Add right-click menu options
- **storage**: Store user preferences and session data
- **tabs**: Create new tabs and query active tab
- **host_permissions**: Communicate with Stumbleable API

## Privacy

- User data is synced with your Stumbleable account
- No tracking or analytics beyond what's in the main app
- All data stored locally in Chrome's sync storage
- See [Privacy Policy](https://stumbleable.com/privacy) for details

## Troubleshooting

### Extension not loading
- Ensure you've run `npm run build`
- Check that Developer mode is enabled
- Look for errors in `chrome://extensions/`

### API calls failing
- Verify the API services are running (dev) or accessible (prod)
- Check browser console for network errors
- Ensure you're signed in to Stumbleable

### Keyboard shortcuts not working
- Check for conflicts with other extensions
- Verify shortcuts in `chrome://extensions/shortcuts`
- Some shortcuts may not work on certain pages (e.g., Chrome Web Store)

## Contributing

We welcome contributions! Please see the main [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

### Adding Features

1. Create feature branch
2. Implement in TypeScript
3. Build and test locally
4. Update manifest version
5. Submit pull request

## Roadmap

Future enhancements:
- [ ] Firefox support
- [ ] Safari support
- [ ] Edge-specific optimizations
- [ ] Offline mode
- [ ] Advanced filtering options
- [ ] Custom themes

## Support

- **Issues**: [GitHub Issues](https://github.com/wize-works/stumbleable/issues)
- **Email**: support@stumbleable.com
- **Docs**: [Documentation](https://stumbleable.com/docs)

## License

MIT License - see [LICENSE](../../LICENSE) for details

---

**Built with ❤️ by the Stumbleable team**
