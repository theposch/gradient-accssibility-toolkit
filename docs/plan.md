# Gradient Contrast Checker – Implementation Plan

| Phase | Scope / Deliverables | Acceptance Criteria | Target ETA |
|-------|----------------------|---------------------|-------------|
| **P1 – Scaffold & UI Skeleton** | • Initialise Vite + React 18 + TS  
• TailwindCSS + shadcn/ui setup  
• Static three-column layout matching mock (no logic)  
• ESLint/Prettier/Vitest pipeline  | `npm run dev` shows static mock; lint & tests pass; Lighthouse a11y ≥ 95 (static) | **Day 1** |
| **P2 – GradientCanvas & ContrastEngine** | • Draw gradient on `<canvas>` 720×300  
• `ContrastEngine.sample(grid=100)` returns min/avg/max + pass-map  
• Perf test: ≤ 250 ms for 10 k samples (Vitest) | Unit tests ≥ 95 % for engine; perf test green | **Day 2** |
| **P3 – Heat-Map & Analysis Panel** | • Overlay heat-map (AAA/AA/Fail) toggle  
• ContrastAnalysisPanel shows live metrics  
• Pass-rate legend | Visual diff ≤ 4 px vs. mock; metrics update in < 100 ms on change | **Day 3** |
| **P4 – SuggestionEngine** | • Text-color HSL-L30 rule + ΔE filter  
• Gradient Auto-Fix (Δ ≤ 8 %) + fallback message  
• "Apply" hooks to editor  | Suggestions differ by ≥ 10 ΔE; AA pass once applied (unit tests) | **Day 4** |
| **P5 – Save, Export & Polish** | • `localStorage` saved-gradients modal  
• Copy-CSS button  
• Final Lighthouse: Perf ≥ 90, A11y ≥ 98  | CI passes; manual review gates 3-4 satisfied | **Day 5** |

## Dev-Ex Commands

```bash
# install deps
pnpm i

# run dev server
pnpm dev

# lint & format
pnpm lint && pnpm format

# unit tests + perf
pnpm test

# storybook visual review (optional)
pnpm storybook
```

## Branch Strategy

`main` → protected; feature branches `feat/<phase>`; PRs require green CI + review.

---
Approval of this plan unlocks Phase P1 scaffolding. 