# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Scout
**Generated:** 2026-08-11 08:05:48
**Category:** Marketplace (P2P)

---

## Global Rules

### Color Palette

> **Manual override, not a database match.** Scout already has a deliberately designed
> brand palette (warm cream editorial, orange-red accent) from `plan-saas-fitscan.html`,
> already in production use in the Chrome extension's icon and popup. Keeping it here as
> the single source of truth instead of the tool's generic "editorial black + pink" match,
> so the extension and the web dashboard stay visually consistent.

**Light mode**

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background | `#EEF0EA` | `--color-background` |
| Background Raised (cards) | `#F8F9F4` | `--color-card` |
| Foreground (ink) | `#1A1D18` | `--color-foreground` |
| Muted Foreground | `#565B4F` | `--color-muted-foreground` |
| Primary / Accent | `#FF4A26` | `--color-primary` |
| On Primary | `#FFF8F4` | `--color-primary-foreground` |
| Border | `rgba(26,29,24,0.13)` | `--color-border` |
| Success | `#2F7D4F` | `--color-success` |
| Warning | `#A3690F` | `--color-warning` |
| Destructive | `#DC2626` | `--color-destructive` |
| Ring | `#FF4A26` | `--color-ring` |

**Dark mode**

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background | `#15170F` | `--color-background` |
| Background Raised (cards) | `#1E2117` | `--color-card` |
| Foreground (ink) | `#ECE9DF` | `--color-foreground` |
| Muted Foreground | `#A7AC9B` | `--color-muted-foreground` |
| Primary / Accent | `#FF6A44` | `--color-primary` |
| On Primary | `#1A0D08` | `--color-primary-foreground` |
| Border | `rgba(236,233,223,0.14)` | `--color-border` |
| Success | `#55B478` | `--color-success` |
| Warning | `#E0A83E` | `--color-warning` |
| Destructive | `#F87171` | `--color-destructive` |
| Ring | `#FF6A44` | `--color-ring` |

**Color Notes:** Warm cream + charcoal ink + orange-red accent. Quiet editorial confidence,
not loud/bold — reserve the accent color for primary actions and highlights, not large
color blocks.

### Typography

- **Heading Font:** Playfair Display
- **Body Font:** Inter
- **Mood:** elegant, luxury, sophisticated, timeless, premium, editorial
- **Google Fonts:** [Playfair Display + Inter](https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

> Component specs below use shadcn/ui token names (`--color-*` from the table above,
> exposed to Tailwind as `bg-primary`, `text-foreground`, etc.) — see Implementation Notes.

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-primary-foreground);
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.92;
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 16px;
  background: var(--color-card);
  color: var(--color-foreground);
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgb(255 74 38 / 0.15);
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Editorial Warmth (manual override — see Color Palette note above)

**Keywords:** Warm, quiet confidence, editorial, approachable, generous whitespace, serif display + clean sans body, restrained color use

**Best For:** Consumer shopping tools aimed at non-insiders — plain language over hype, no "streetwear insider" posture

**Key Effects:** Generous section spacing (48px+), accent color reserved for CTAs/highlights only, subtle hover states (no scale/transform), 150-250ms transitions

### Page Pattern

**Pattern Name:** Marketplace / Directory, adapted for Scout's actual flow (search-first
CTA kept; "listing" sections replaced — Scout doesn't host P2P listings, it identifies
and searches on the user's behalf)

- **Conversion Strategy:** Reduce friction to the core loop (image → identification →
  results). The CTA is "install the extension" / "upload a photo", not a search bar.
- **CTA Placement:** Hero (upload/install CTA) + repeated CTA at the end.
- **Section Order:** 1. Hero (the "Photo it. Shop it." value prop + primary CTA),
  2. How it works (3 steps: image → identification → results/alerts),
  3. Feature highlights (price tracking, size-aware, plain language — no insider jargon),
  4. Trust/social proof (once available), 5. Final CTA.

---

## Implementation Notes

- **Stack:** Tailwind CSS + shadcn/ui (New York style), on top of `apps/web` (Next.js 14
  App Router, TypeScript).
- **Fonts:** loaded via `next/font/google` in `app/layout.tsx` (self-hosted, no external
  `<link>` — see Next.js stack guidance), exposed as CSS variables `--font-display`
  (Playfair Display) and `--font-sans` (Inter).
- **Tokens:** defined as CSS variables in `app/globals.css` under `:root` (light) and
  `.dark` (dark mode class), consumed by `tailwind.config.ts` via `hsl(var(--...))` so
  Tailwind utilities (`bg-primary`, `text-muted-foreground`, etc.) resolve to the tokens
  above — never hardcode hex values in components.
- **Base components:** `components/ui/` (shadcn convention) — start with `button.tsx` and
  `card.tsx`, add more as pages need them.
- **Icons:** lucide-react (matches the "SVG icons, no emoji" rule below).

---

## Anti-Patterns (Do NOT Use)

- ❌ Low trust signals
- ❌ Confusing layout

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
