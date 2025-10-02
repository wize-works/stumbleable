# Icon Usage Standards for Stumbleable

## ✅ Correct Font Awesome Usage

### For Regular Icons
Always use **`fa-solid fa-duotone`** for solid duotone icons:

```tsx
<i className="fa-solid fa-duotone fa-bookmark"></i>
<i className="fa-solid fa-duotone fa-heart text-primary"></i>
```

### For Brand Icons
Use **`fa-brands`** for social media and brand icons:

```tsx
<i className="fa-brands fa-facebook"></i>
<i className="fa-brands fa-twitter"></i>
<i className="fa-brands fa-github"></i>
```

## ❌ Incorrect Usage

### Never use `fa-solid` alone
```tsx
<!-- WRONG -->
<i className="fa-solid fa-bookmark"></i>

<!-- CORRECT -->
<i className="fa-solid fa-duotone fa-bookmark"></i>
```

### Never use emojis instead of icons
```tsx
<!-- WRONG -->
<span>📚</span>
<span>🔖</span>

<!-- CORRECT -->
<i className="fa-solid fa-duotone fa-book"></i>
<i className="fa-solid fa-duotone fa-bookmark"></i>
```

## 📚 Common Icon Patterns

### Navigation & UI
- **Lists**: `fa-solid fa-duotone fa-list`
- **Plus/Add**: `fa-solid fa-duotone fa-plus`
- **Delete**: `fa-solid fa-duotone fa-trash`
- **Edit**: `fa-solid fa-duotone fa-pencil`
- **Search**: `fa-solid fa-duotone fa-search`
- **Close**: `fa-solid fa-duotone fa-times`

### Content Actions
- **Like**: `fa-solid fa-duotone fa-thumbs-up`
- **Dislike**: `fa-solid fa-duotone fa-thumbs-down`
- **Save/Bookmark**: `fa-solid fa-duotone fa-bookmark`
- **Share**: `fa-solid fa-duotone fa-share`
- **Heart/Favorite**: `fa-solid fa-duotone fa-heart`

### List Categories (20 Common Icons)
```typescript
const listIcons = [
    { icon: 'fa-solid fa-duotone fa-bookmark', label: 'Bookmark' },
    { icon: 'fa-solid fa-duotone fa-star', label: 'Star' },
    { icon: 'fa-solid fa-duotone fa-heart', label: 'Heart' },
    { icon: 'fa-solid fa-duotone fa-book', label: 'Book' },
    { icon: 'fa-solid fa-duotone fa-lightbulb', label: 'Idea' },
    { icon: 'fa-solid fa-duotone fa-rocket', label: 'Rocket' },
    { icon: 'fa-solid fa-duotone fa-folder', label: 'Folder' },
    { icon: 'fa-solid fa-duotone fa-list', label: 'List' },
    { icon: 'fa-solid fa-duotone fa-graduation-cap', label: 'Learn' },
    { icon: 'fa-solid fa-duotone fa-briefcase', label: 'Work' },
    { icon: 'fa-solid fa-duotone fa-code', label: 'Code' },
    { icon: 'fa-solid fa-duotone fa-palette', label: 'Design' },
    { icon: 'fa-solid fa-duotone fa-music', label: 'Music' },
    { icon: 'fa-solid fa-duotone fa-film', label: 'Video' },
    { icon: 'fa-solid fa-duotone fa-gamepad', label: 'Gaming' },
    { icon: 'fa-solid fa-duotone fa-utensils', label: 'Food' },
    { icon: 'fa-solid fa-duotone fa-plane', label: 'Travel' },
    { icon: 'fa-solid fa-duotone fa-dumbbell', label: 'Fitness' },
    { icon: 'fa-solid fa-duotone fa-camera', label: 'Photo' },
    { icon: 'fa-solid fa-duotone fa-pencil', label: 'Writing' },
];
```

## 🎨 Styling Icons

### Size Classes
```tsx
<i className="fa-solid fa-duotone fa-bookmark text-sm"></i>    // Small
<i className="fa-solid fa-duotone fa-bookmark text-base"></i>  // Normal
<i className="fa-solid fa-duotone fa-bookmark text-lg"></i>    // Large
<i className="fa-solid fa-duotone fa-bookmark text-xl"></i>    // Extra Large
<i className="fa-solid fa-duotone fa-bookmark text-2xl"></i>   // 2X Large
```

### Color Classes
```tsx
<i className="fa-solid fa-duotone fa-heart text-primary"></i>
<i className="fa-solid fa-duotone fa-star text-warning"></i>
<i className="fa-solid fa-duotone fa-check text-success"></i>
<i className="fa-solid fa-duotone fa-times text-error"></i>
<i className="fa-solid fa-duotone fa-info text-info"></i>
```

### Spacing
```tsx
<i className="fa-solid fa-duotone fa-bookmark mr-2"></i> Text after icon
Text before icon <i className="fa-solid fa-duotone fa-bookmark ml-2"></i>
```

## 🔄 Migration from Emojis

When migrating from emoji to Font Awesome:

1. **Identify the emoji meaning**: What does the emoji represent?
2. **Choose appropriate icon**: Find the closest Font Awesome equivalent
3. **Use correct syntax**: Always `fa-solid fa-duotone` or `fa-brands`
4. **Test visual hierarchy**: Ensure icon size matches design intent

### Example Migration

```tsx
// BEFORE (with emoji)
{list.emoji && <span className="text-2xl">{list.emoji}</span>}

// AFTER (with Font Awesome)
{list.emoji && <i className={`${list.emoji} text-xl text-primary`}></i>}
```

Note: Backend still uses `emoji` field name for backward compatibility, but stores Font Awesome class strings.

## 📝 Icon Picker Implementation

The lists feature includes a visual icon picker that:
- Shows 20 common icons in a 5-column grid
- Highlights selected icon with `btn-primary` style
- Stores full Font Awesome class string (e.g., `"fa-solid fa-duotone fa-bookmark"`)
- Renders icons dynamically using stored class names

```tsx
<button
    type="button"
    onClick={() => setSelectedIcon(iconItem.icon)}
    className={`btn btn-square btn-sm ${
        selectedIcon === iconItem.icon ? 'btn-primary' : 'btn-ghost'
    }`}
>
    <i className={`${iconItem.icon} text-xl`}></i>
</button>
```

## 🎯 Best Practices

1. **Consistency**: Use the same icon for the same action throughout the app
2. **Accessibility**: Always provide `title` or `aria-label` for icon-only buttons
3. **Semantic meaning**: Choose icons that clearly represent their purpose
4. **Size harmony**: Keep icon sizes consistent within the same UI section
5. **Color purpose**: Use color to indicate state (primary, success, error, etc.)

## 🚫 What NOT to Do

1. ❌ Don't mix emoji and Font Awesome icons
2. ❌ Don't use `fa-solid` without `fa-duotone`
3. ❌ Don't use brand icons with `fa-solid` (use `fa-brands` instead)
4. ❌ Don't hardcode icon colors (use Tailwind/DaisyUI classes)
5. ❌ Don't forget accessibility attributes on icon-only buttons

## 📚 Resources

- [Font Awesome Documentation](https://fontawesome.com/docs)
- [Font Awesome Icon Gallery](https://fontawesome.com/icons)
- [DaisyUI Button Styles](https://daisyui.com/components/button/)
