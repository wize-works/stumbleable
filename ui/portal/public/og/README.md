# Launch Landing Pages - Open Graph Images

This directory contains platform-specific Open Graph images for social sharing on launch platforms.

## Required Images

Each image should be 1200x630px for optimal social media display:

- `launch-product-hunt.png` - Product Hunt themed with #DA552F brand color
- `launch-launching-next.png` - LaunchingNext themed with #6366F1 brand color  
- `launch-betalist.png` - BetaList themed with #10B981 brand color
- `launch-hacker-news.png` - Hacker News themed with #FF6600 brand color
- `launch-indie-hackers.png` - Indie Hackers themed with #0E2439 brand color

## Design Guidelines

Each image should include:
1. **Platform branding** - Logo or icon of the launch platform
2. **Stumbleable branding** - Your logo prominently displayed
3. **Tagline** - Platform-specific tagline from `platform-config.ts`
4. **Visual distinction** - Unique color scheme per platform
5. **Launch badge** - "Launched on [Platform]" or "Featured on [Platform]"

## Tools for Creation

- **Figma** - Professional design tool (recommended)
- **Canva** - Quick template-based designs
- **OG Image Generator** - https://og-image.vercel.app/
- **Bannerbear** - Automated OG image generation

## Temporary Fallback

Until custom images are created, the pages will use:
- `/og-image.png` (generic fallback)

## Testing

Test your OG images using:
- https://www.opengraph.xyz/
- https://cards-dev.twitter.com/validator
- Facebook Sharing Debugger

---

*Note: Update this README when images are added*
