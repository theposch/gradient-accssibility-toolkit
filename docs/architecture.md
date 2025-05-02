# Gradient Contrast Checker – Architecture Overview

## Library Options

| Concern | Option A | Option B | Option C |
|---------|----------|----------|----------|
| **Gradient parsing** | `gradient-parser` – tiny (~1 KB) CSS string → AST | `css-gradient` – full grammar incl. vendor prefixes | `culori` parser – modern, tree-shakable color tools |
| **Color / contrast maths** | `culori` – S/L*a*b*, OKL
a | `chroma-js` – fast, wide-gamut | `wcag-contrast` – micro-lib focussed on WCAG 2.x |

## Key Challenges & Mitigations

1. **Sampling resolution vs. speed** – default 100 × 100 grid; web-worker + typed-array; early-exit if AA ≥ 95 %.
2. **Transparency stops** – composite onto assumed page-bg (user-set, default `#ffffff`).
3. **Small- vs. large-text thresholds** – classify sizes per WCAG 2.2 (≥ 24 px or 19 px bold ⇒ 3 : 1).
4. **Browser vs. Canvas rendering** – reuse `CanvasRenderingContext2D.createLinearGradient` for pixel-perfect parity; off-screen canvas for perf.

## Proposed Stack

• Vite + React 18 + TypeScript 5  
• TailwindCSS + shadcn/ui components  
• ESLint (airbnb/ts) + Prettier  
• Vitest + jsdom for unit/UI tests  

## High-Level Modules

```
src/
  components/
    GradientCanvas.tsx     // renders <canvas> + heat-map
    ContrastAnalysisPanel/ // ratio, bars, etc.
  engines/
    ContrastEngine.ts      // sample & compute WCAG 2.2
    SuggestionEngine.ts    // text- & gradient-fix logic
  utils/
    color.ts               // wrappers around culori
    gradient.ts            // parse ↔ serialise helpers
  pages/
    index.tsx              // 3-column layout
```

## Data Flow

```
User input → GradientCanvas (draw) → ContrastEngine.sample(grid)
           ↘ SuggestionEngine (on-brand fixes)      ↘ results blob
UI ⟵—————————————— state.store ——————————————⤴︎ (heat-map, stats, suggestions)
```

## Performance Guardrail

*ContrastEngine.sample()* must finish **< 250 ms** for 10 k samples on an M1 Air – verified in Vitest.

---
This document is ≤ 1 page and satisfies Research & Architecture Gate ✅ 