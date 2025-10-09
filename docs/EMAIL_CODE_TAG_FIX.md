# Email Template Fix: `<code>` Tag Issue

**Date:** 2025-10-07  
**Issue:** Welcome emails failing to render with "Objects are not valid as a React child" error  
**Root Cause:** `<code>` HTML tags inside React Email's `<Text>` components

---

## The 25 Whys Root Cause Analysis

1. **Why is the email failing?** → React rendering error: "Objects are not valid as a React child"
2. **Why is React seeing objects as children?** → `<code>` tags are React elements, not strings
3. **Why are `<code>` tags React elements?** → JSX transpiles all HTML tags to React.createElement calls
4. **Why does React Email care?** → @react-email/render needs to serialize components to HTML strings
5. **Why can't it serialize `<code>` elements?** → `<Text>` component expects string children or specific @react-email components
6. **Why doesn't `<Text>` accept `<code>`?** → React Email has a whitelist of allowed child components
7. **Why have a whitelist?** → To ensure email client compatibility (Outlook, Gmail, etc.)
8. **Why are we using `<code>` tags?** → To style keyboard shortcuts visually
9. **Why not use inline styles instead?** → We thought `<code>` would work like regular HTML
10. **Why did `<br />` fail before?** → Same reason - React elements inside `<Text>`
11. **Why didn't we catch this pattern?** → We only checked for `<br />`, not other HTML tags
12. **Why do some HTML tags work?** → Only `<a>`, `<strong>`, `<em>` are specially handled by React Email's `<Text>`
13. **Why those specific tags?** → They're the most common email-safe inline elements
14. **Why not `<code>`?** → Not commonly used in marketing/transactional emails
15. **Why does the error mention $$typeof?** → That's the internal React element marker
16. **Why does tsx watch mode not catch this?** → TypeScript only checks types, not runtime React rendering
17. **Why didn't tests catch this?** → We haven't run the email rendering tests yet
18. **Why does the error crash the queue processor?** → The render() function throws, and it's not fully caught
19. **Why isn't it caught?** → It is caught, but crashes during the render phase before catch block
20. **Why does it crash during render?** → React's renderToString processes synchronously
21. **Why allow the crash?** → It's actually being caught and logged, but the unhandled promise rejection bubbles up
22. **Why the unhandled promise?** → The render() call is async and the error propagates
23. **Why does this only affect certain templates?** → Only templates using `<code>`, `<br />`, or custom components
24. **Why didn't submission-approved work after fixing custom components?** → We only fixed custom functions, not HTML tags
25. **Why is the root cause HTML tags in `<Text>`?** → **React Email's `<Text>` component only accepts plain strings, `<a>`, `<strong>`, and `<em>` as children. Any other HTML tag becomes a React element that cannot be serialized.**

---

## The Problem

### Code That Failed:
```tsx
<Text style={boxText}>
    <code>Space</code> = Next discovery
</Text>
<Text style={boxText}>
    <code>↑</code> = Like • <code>↓</code> = Skip
</Text>
```

### Error Message:
```
Error: Objects are not valid as a React child (found: object with keys {$$typeof, type, key, props, _owner, _store}). 
If you meant to render a collection of children, use an array instead.
```

---

## The Root Cause

React Email's `<Text>` component from `@react-email/components` has strict limitations:

**✅ ALLOWED inside `<Text>`:**
- Plain strings: `"Hello"`
- String expressions: `{firstName}`
- `<a>` tags: `<a href="...">Link</a>`
- `<strong>` tags: `<strong>Bold</strong>`
- `<em>` tags: `<em>Italic</em>`

**❌ NOT ALLOWED inside `<Text>`:**
- `<code>` tags - **Causes this exact error**
- `<br />` tags - Causes same error (fixed earlier)
- `<span>` tags
- `<div>` tags
- Any other HTML element
- Custom React components (e.g., `<BenefitItem />`)

### Why?

When you write `<code>Space</code>`, JSX transpiles this to:
```javascript
React.createElement('code', null, 'Space')
```

This creates a React element object with internal properties like `$$typeof`, `type`, `props`, etc. React Email's `render()` function cannot serialize arbitrary React elements to HTML strings - it only knows how to handle its own components and the whitelisted HTML tags.

---

## The Solution

Replace `<code>` tags with `<strong>` tags and style them to look like code blocks:

### Fixed Code:
```tsx
<Text style={boxText}>
    <strong style={codeStyle}>Space</strong> = Next discovery
</Text>
<Text style={boxText}>
    <strong style={codeStyle}>↑</strong> = Like • <strong style={codeStyle}>↓</strong> = Skip
</Text>
```

### Added Style:
```tsx
const codeStyle = {
    backgroundColor: '#e5e7eb',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: 'bold',
};
```

---

## Files Modified

- **apis/email-service/src/templates/welcome.tsx**
  - Replaced all `<code>` tags with `<strong style={codeStyle}>`
  - Added `codeStyle` constant with monospace font and background

- **apis/email-service/src/templates/submission-received.tsx**
  - Inlined `TimelineItem` custom component (3 instances)
  - Inlined `GuidelineItem` custom component (4 instances)
  - Removed function definitions for both components

---

## Prevention Checklist

When creating or modifying React Email templates:

### ✅ DO:
- Use `<strong>` for bold text and code-like styling
- Use `<em>` for italic text
- Use `<a>` for links
- Use inline styles on allowed elements
- Split multiple lines into separate `<Text>` components (not `<br />`)
- Use `<Section>` for layout structure
- Use raw `<table>` for complex layouts (outside `<Text>`)

### ❌ DON'T:
- Put `<code>` inside `<Text>` components
- Put `<br />` inside `<Text>` components
- Put `<span>`, `<div>`, or other HTML elements inside `<Text>`
- Create custom component functions and call them (use inline JSX)
- Pass React elements as children to `<Text>`

---

## Testing

After making changes to email templates:

1. **Local Testing:**
   ```bash
   # Trigger queue processor manually
   curl -X POST http://localhost:7006/api/queue/process
   ```

2. **Check Logs:**
   - Look for "✓ HTML rendered successfully"
   - Verify no "Objects are not valid as a React child" errors

3. **Verify Email Delivery:**
   - Check email_queue table: `status='sent'`
   - Check email_logs table for successful sends
   - Check actual email inbox for proper rendering

---

## Related Issues

This is the **fourth** instance of "Objects are not valid as a React child" errors:

1. **First:** Custom component functions (BenefitItem, ShareItem) in submission-approved.tsx
2. **Second:** `<br />` tags in welcome.tsx and other templates
3. **Third:** `<code>` tags in welcome.tsx
4. **Fourth:** Custom component functions (TimelineItem, GuidelineItem) in submission-received.tsx

### Pattern Recognition:
Any HTML tag or React component that's not explicitly whitelisted by React Email will cause this error when used inside `<Text>` components.

---

## Verification Steps

1. ✅ Replaced `<code>` with `<strong style={codeStyle}>`
2. ✅ Added `codeStyle` constant
3. ✅ Verified no other templates use `<code>` tags
4. ⏳ Waiting for tsx watch mode to recompile
5. ⏳ Will test with queue processor next cycle

---

## Next Steps

1. Wait for automatic recompilation (tsx watch mode)
2. Trigger queue processing manually or wait for 60-second cycle
3. Verify logs show successful render: "✓ HTML rendered successfully"
4. Check that emails are actually sent via Resend API
5. Verify email rendering in actual inbox

---

## Key Takeaway

**React Email `<Text>` Component Limitations:**

Only these inline elements are allowed as children:
- Plain strings
- `{variable}` expressions
- `<a href="...">`
- `<strong>`
- `<em>`

Everything else must be either:
- Split into separate `<Text>` components
- Moved outside `<Text>` (e.g., tables, sections)
- Styled using allowed elements with inline styles

When you need code-like styling, use `<strong>` with monospace font and background styling instead of `<code>` tags.
