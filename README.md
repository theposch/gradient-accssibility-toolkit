# Gradient Accessibility Checker

A modern, interactive toolkit for designing, analyzing, and optimizing CSS gradients for accessible text overlays. Built with React, it provides real-time contrast analysis, smart suggestions, and a rich editing experience for designers and developers.

🔗 **[Live Demo](https://gradient-accessibility.netlify.app/)**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![WCAG 2.2](https://img.shields.io/badge/WCAG-2.2-green?style=for-the-badge)](https://www.w3.org/TR/WCAG22/)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-netlify-id/deploy-status)](https://app.netlify.com/)

> Keywords: accessibility, WCAG, contrast checker, gradient generator, CSS tools, web design, color contrast, a11y, React components, design tools

---

## Features

- **Visual Gradient Editor:** UI for creating and editing multi-stop CSS gradients.
- **Text Overlay & Typography:** Add, style, and align text over gradients. Upload custom fonts and adjust typography.
- **Contrast Analysis:** Real-time WCAG 2.2 contrast checking across the entire gradient, with pass/fail visualization.
- **Smart Suggestions:**
  - Suggests accessible text colors for your gradient.
  - Suggests gradient tweaks to improve contrast with your chosen text color.
- **Presets & Customization:** Start from beautiful presets or design your own.
- **Undo/Redo:** Full history support for gradient and text color changes.
- **Save & Load:** Save your favorite gradient+text combos locally for reuse.
- **Copy CSS:** One-click copy of the current gradient and text color CSS.

---

## Technical Architecture

- **React Frontend:**
  - Main entry: `src/pages/App.tsx` orchestrates state, UI, and logic.
  - **Components:**
    - `GradientEditor`: Visual editing of gradient stops, angles, and presets.
    - `GradientCanvas`: Renders the gradient and overlays contrast analysis.
    - `TextSettings`: Controls for text, color, alignment, and font.
    - `ContrastAnalysisPanel`, `SavedDrawer`, `Tooltip`, etc.
  - **Engines:**
    - `ContrastEngine`: Samples the gradient, computes per-pixel contrast ratios, and classifies regions as pass/fail (AA/AAA).
    - `SuggestionEngine`: Suggests accessible text colors and gradient modifications using color science (culori, gradient-parser).
  - **Hooks:**
    - `useFontManager`: Handles custom font uploads, selection, and typography settings.
    - `useGradientHistory`: Manages undo/redo stacks for gradient and text color.
  - **Utilities:**
    - `storage.ts`: Persists saved gradients in localStorage.
    - `constants/`: Preset gradients and font lists.

---

## How It Works (Technical Flow)

1. **Editing:**
   - User edits the gradient visually or via presets.
   - User customizes text overlay, color, font, and alignment.
2. **Contrast Analysis:**
   - The app samples the gradient (using an offscreen canvas) and computes the contrast ratio between each sampled color and the text color.
   - Results are visualized as overlays (green/yellow/red for AAA/AA/fail) and summarized numerically.
3. **Suggestions:**
   - Suggests text colors that maximize contrast with the current gradient.
   - Suggests gradient tweaks (lighten/darken stops) to improve contrast with the chosen text color.
4. **Persistence:**
   - Users can save up to 50 gradient+text combos locally.
   - Undo/redo is managed via a custom hook tracking history entries.
5. **Font Management:**
   - Users can upload custom fonts (via FontFace API) and adjust typography for both headline and paragraph text.

---

## Installation & Usage

### Prerequisites
- Node.js (v16+ recommended)
- npm (v8+ recommended)

### Install dependencies
```bash
npm install
```

### Run the development server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

---

## File Structure

```
youngnails-gradient-toolkit/
├── src/
│   ├── components/      # UI components (editor, canvas, settings, etc.)
│   ├── constants/       # Preset gradients, fonts
│   ├── engines/         # Core logic: contrast & suggestion engines
│   ├── hooks/           # Custom React hooks (font, history)
│   ├── pages/           # Main App entry
│   ├── types/           # TypeScript types
│   ├── utils/           # Utilities (storage, etc.)
│   └── main.tsx         # App bootstrap
├── public/              # Static assets
├── package.json         # Project metadata & scripts
└── ...
```

---

## Contributing

Pull requests and issues are welcome! Please open an issue to discuss major changes before submitting a PR.

---

## License

[MIT](LICENSE) 