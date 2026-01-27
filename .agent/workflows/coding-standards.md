---
description: Coding standards and style guidelines for collaborative-canvas project
---

# Coding Standards

## Styling Rules

1. **Use Tailwind CSS by default** for all styling
2. **Ask before using inline styles** - only use when:
   - Dynamic values (user-selected colors, computed sizes)
   - Complex JS-driven animations (hover effects, sliders)
   - Runtime-computed positions

## Component Patterns

1. **Export pattern**: `export function ComponentName()`
2. **Interface naming**: `ComponentNameProps`
3. **No `React.FC`** - use plain function declarations
4. **No default exports** for components (only pages use default export)

## File Organization

```
components/
├── room/       # Room-specific components
├── toolbar/    # Toolbar components
└── ui/         # Reusable UI components

hooks/          # Custom hooks
├── tools/      # Tool-specific hooks

services/       # API/Socket services
stores/         # Zustand state stores
theme/          # Design tokens (for Button, Input)
types/          # TypeScript types
utils/          # Helper functions
pages/          # Route pages (use default export)
```

## Code Style

- PascalCase for components and files
- camelCase for functions and variables
- Interfaces before components in files
- Internal helper components use `const Name = () => {}`
- Exported components use `export function Name() {}`

## TypeScript

- Fully type all props and returns
- Use `interface` for props
- Use `type` for unions/aliases
- No `any` types
