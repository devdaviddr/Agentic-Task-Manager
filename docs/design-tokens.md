# Design Tokens (Tailwind)

This repo uses a strict **dark mode** design system that is enforced across the frontend by Tailwind tokens + linting.

## ✅ Goals
- **No light/white backgrounds** (no `bg-white` / `bg-white/*` usage)
- **Avoid Tailwind's default color palette** (e.g., `text-gray-500`, `border-blue-600`, etc.)
- Use **semantic tokens** for text color, spacing, and UI elements.
- Enforce token usage via an ESLint rule (`local/no-arbitrary-text-color`).

---

## 📦 Where tokens are defined
- **Tailwind config:** `apps/frontend/tailwind.config.js`
- The tokens are exposed through Tailwind's `theme.extend.colors`.

---

## 🎨 Color Tokens (Tailwind)
Use these tokens instead of raw Tailwind colors.

### Background / surface
- `bg-page` — app background
- `bg-panel` — panels, cards, drawers

### Accent colors
- `bg-primary`, `text-primary`
- `bg-secondary`, `text-secondary`
- `bg-tertiary`, `text-tertiary`
- `bg-danger`, `text-danger`

### Text (semantic)
- `text-heading` — primary heading text
- `text-body` — main body text
- `text-muted` — secondary/subdued text

### Other tokens
- `border-border` — border color used across panels
- `ring-primary` — focus ring color

---

## 🧩 Component Utilities (Tailwind @layer components)
Defined in: `apps/frontend/src/index.css`

- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-inverted`, `.btn-icon`
- `.card` — panel/card surface
- `.input`, `.textarea`, `.select` — form fields
- `.badge`, `.badge-primary`, etc.

These helpers ensure consistent spacing, focus rings, and hover states.

---

## ✅ Enforced Linting
A custom ESLint rule warns when raw Tailwind color classes are used in JSX `className` strings.

### ✅ What it enforces
It disallows using raw Tailwind text color classes such as:
- `text-white`, `text-gray-500`, `text-red-600`, `text-blue-600`, etc.

### ✅ What it allows
The rule allows:
- Semantic tokens: `text-heading`, `text-body`, `text-muted`, `text-primary`, etc.
- Text size & alignment utilities: `text-sm`, `text-center`, etc.

### How to run linting
```bash
npm run lint --workspace=apps/frontend
```

---

## 💡 Tips
- When you need a subtle text variation, use opacity on tokens (e.g., `text-body/70`).
- For hover/active backgrounds in the dark theme, prefer `bg-panel/10` / `bg-panel/20` instead of `bg-white/10`.

---

If you want additional tokens (e.g., `text-info`, `bg-accent`), add them to `tailwind.config.js` and update the lint rule allowance accordingly.
