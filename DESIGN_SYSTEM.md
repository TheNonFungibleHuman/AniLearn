# AniLearn Design System Specification
*Adhering to the Minimalist Standards of Vercel, Cloudflare, and Aster.*

---

## 1. Core Principles

1. **Information Over Decoration**: University course content is dense. The interface must get out of the way. No loud rainbow gradients, neon glow halos, or competing saturated badges.
2. **Monochrome Foundation**: Surface depth is created with dark neutral values (`#000000` to `#18181b`) and razor-thin borders (`border-white/[0.08]`), not color soup.
3. **Restrained Actions**: One single high-contrast primary action on screen (`bg-white text-black`), with all secondary controls rendered as clean neutral ghost or zinc elements.
4. **Zero Horizontal Overflow**: No horizontal scrollbars or sprawling pill tags. Clean top-bar selectors and vertical hierarchy only.
5. **Ergonomic Typography Floor**: Minimum 12px for meta/kickers; 14px for body; tight tracking (`tracking-tight`) for headings.

---

## 2. Color Palette & Surface Tokens

| Token | Hex / Class | Usage |
|---|---|---|
| **Page Background** | `#000000` (`bg-black`) | Global backdrop. Pure black for maximum contrast and zero OLED/LCD glow. |
| **Surface 1 (Cards)** | `#09090b` (`bg-zinc-950`) | Primary card containers (Canvas, Metaphor card, Chat frame). |
| **Surface 2 (Elevated)** | `#121215` (`bg-zinc-900`) | Input fields, active card states, secondary button backgrounds. |
| **Surface 3 (Hover)** | `#18181b` (`bg-zinc-850`) | Hover feedback on interactive rows and dropdown options. |
| **Subtle Border** | `rgba(255, 255, 255, 0.08)` | Default 1px card and container outlines. |
| **Hover Border** | `rgba(255, 255, 255, 0.16)` | Focus and hover state outlines. |
| **Text Primary** | `#ffffff` / `#f4f4f5` (`text-zinc-100`) | Headings, active values, card titles. |
| **Text Muted** | `#a1a1aa` (`text-zinc-400`) | Body explanations, subtitles, secondary metadata. |
| **Text Subdued** | `#71717a` (`text-zinc-500`) | Micro-kickers, hotkeys, status tags, inactive indicators. |

---

## 3. Typography & Hierarchy

- **Font Family**: `Plus Jakarta Sans` (UI & Body), `JetBrains Mono` (Code, Bitfields, Hotkeys).
- **Category Kicker**: `text-[11px] font-mono uppercase tracking-wider text-zinc-500`.
- **Module Title**: `text-xl sm:text-2xl font-bold tracking-tight text-white`.
- **Section Headers**: `text-xs font-semibold uppercase tracking-wider text-zinc-400`.
- **Body Prose**: `text-sm text-zinc-300 leading-relaxed`.
- **Code / Monospace**: `font-mono text-xs px-1 py-0.5 rounded bg-black border border-white/[0.06] text-zinc-200`.

---

## 4. Component Patterns

### A. Primary Buttons (Vercel Style)
```jsx
// Solid crisp white with instant contrast against the pure black canvas
<button className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer">
  + New Topic
</button>
```

### B. Segmented Controls (Tab Switcher)
```jsx
// Clean nested segment pill container
<div className="flex bg-zinc-900 border border-white/[0.08] rounded-lg p-1">
  <button className={active ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}>
    Concept & Metaphor
  </button>
</div>
```

### C. Dropdown Navigation (Cloudflare Style)
```jsx
// Native accessible select with custom styled zinc wrapper, replacing horizontal pill overflow
<select className="appearance-none bg-zinc-900 text-zinc-200 hover:text-white text-xs sm:text-sm font-medium pl-3 pr-8 py-1.5 rounded-lg border border-white/[0.08]">
  {topics.map(...)}
</select>
```

### D. 3D Mnemonic Cue Card (Keyboard Ergonomics)
- **Flip**: Click anywhere or press `[Space]`.
- **Navigate**: Use `<` / `>` buttons or press `[ArrowLeft]` / `[ArrowRight]`.
- **Front**: Visual Anchor description + Core Formula / Law.
- **Back**: Active Recall Question + Senpai Answer.
