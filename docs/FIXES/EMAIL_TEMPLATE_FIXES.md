# React Email Template Issues - Resolution

**Date:** October 7, 2025  
**Issue:** "Objects are not valid as a React child" errors when rendering email templates

## Root Causes Found

### 1. Custom Component Functions (Fixed in submission-approved.tsx)

**Problem:**
```tsx
function BenefitItem({ icon, title, description }: BenefitItemProps) {
    return <table>...</table>;
}

// Usage in template:
<BenefitItem icon="🌍" title="Now Discoverable" description="..." />
```

**Why It Failed:**
React Email's `render()` function doesn't properly handle nested custom component functions. They create React element objects that can't be serialized to HTML.

**Solution:**
Inline all JSX directly in the main component function. Don't create helper components within the same file.

```tsx
// Instead of <BenefitItem />, use:
<table width="100%" cellPadding="0" cellSpacing="0">
    <tr>
        <td><Text style={benefitIcon}>🌍</Text></td>
        <td><Text style={benefitTitle}>Now Discoverable</Text></td>
    </tr>
</table>
```

### 2. `<br />` Tags Inside `<Text>` Components (Fixed in welcome.tsx)

**Problem:**
```tsx
<Text style={text}>
    Line 1
    <br />
    Line 2
    <br />
    Line 3
</Text>
```

**Why It Failed:**
React Email's `<Text>` component cannot accept React element children like `<br />`. The `<br />` tag is a React element object, not a string.

**Solution:**
Use separate `<Text>` components for each line:

```tsx
<Text style={text}>Line 1</Text>
<Text style={text}>Line 2</Text>
<Text style={text}>Line 3</Text>
```

## React Email Best Practices

### ✅ DO:

1. **Use separate `<Text>` components for each paragraph/line**
   ```tsx
   <Text>First line</Text>
   <Text>Second line</Text>
   ```

2. **Inline all JSX** - Don't create helper component functions
   ```tsx
   export function MyEmail(props) {
       return (
           <EmailLayout>
               {/* All JSX directly here */}
           </EmailLayout>
       );
   }
   ```

3. **Use `<Section>` for grouping**
   ```tsx
   <Section style={box}>
       <Text>Line 1</Text>
       <Text>Line 2</Text>
   </Section>
   ```

4. **Use HTML tables for layout** (email-safe)
   ```tsx
   <table width="100%" cellPadding="0" cellSpacing="0">
       <tr>
           <td><Text>Content</Text></td>
       </tr>
   </table>
   ```

### ❌ DON'T:

1. **Don't use `<br />` inside `<Text>`**
   ```tsx
   // WRONG:
   <Text>Line 1<br />Line 2</Text>
   ```

2. **Don't create helper component functions**
   ```tsx
   // WRONG:
   function ListItem({ text }) {
       return <Text>{text}</Text>;
   }
   ```

3. **Don't nest custom components**
   ```tsx
   // WRONG:
   <MySection>
       <MyListItem />
   </MySection>
   ```

## Testing Email Templates

### Method 1: Queue System (Production-like)
```javascript
// test-email-service.js
const payload = {
    userId: 'user-id',
    emailType: 'welcome',
    recipientEmail: 'test@example.com',
    templateData: {
        firstName: 'Test',
        email: 'test@example.com',
        // ... other required props
    }
};
```

### Method 2: Direct Rendering (Debug)
```typescript
import { render } from '@react-email/render';
import { WelcomeEmail } from './templates/welcome';

const html = await render(WelcomeEmail({
    firstName: 'Test',
    email: 'test@example.com',
    frontendUrl: 'http://localhost:3000',
    unsubscribeUrl: 'http://localhost:3000/unsubscribe'
}), {
    pretty: true
});

console.log(html);
```

## Debugging Template Errors

### Enhanced Logging (Added to queue.ts)

```typescript
console.log(`      Component type:`, component.type?.name || 'unknown');
console.log(`      Full template data:`, JSON.stringify(fullData, null, 2));
```

### Common Error Messages

1. **"Objects are not valid as a React child"**
   - Cause: Passing React elements where strings are expected
   - Solution: Check for `<br />` tags, custom components, or object values

2. **"Cannot read properties of undefined"**
   - Cause: Missing required props in template data
   - Solution: Verify all required props are passed

3. **"React is not defined"**
   - Cause: Missing `import * as React from 'react'` at top of template
   - Solution: Add React import

## Template Checklist

Before considering a template complete:

- [ ] No custom component functions defined
- [ ] No `<br />` tags inside `<Text>` components
- [ ] All JSX inlined in main component
- [ ] React imported at top of file
- [ ] All props properly typed with interface
- [ ] Default export included
- [ ] Tested with real data via queue system
- [ ] Verified rendering with `pretty: true` in dev mode

## Files Modified

1. `apis/email-service/src/templates/submission-approved.tsx` - Removed `BenefitItem` and `ShareItem` helper components
2. `apis/email-service/src/templates/welcome.tsx` - Removed `<br />` tags, split into multiple `<Text>` components
3. `apis/email-service/src/lib/queue.ts` - Added detailed logging for debugging

## Resolution Status

- ✅ submission-approved template: Fixed (custom components inlined)
- ✅ welcome template: Fixed (`<br />` tags removed)
- ⏳ Testing: Waiting for next queue cycle to verify emails send successfully

## Next Steps

1. Wait for queue processor to run (60-second interval)
2. Verify emails render and send without errors
3. Check all other templates for similar issues
4. Update template creation guidelines for team
