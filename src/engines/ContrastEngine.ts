/*
 * ContrastEngine
 * Pure functions to sample a CSS gradient against a text color and compute WCAG 2.2 contrast statistics.
 */
import { parse, type ColorStop } from 'gradient-parser';
import * as culori from 'culori';

export type ContrastResult = {
  min: number;
  max: number;
  avg: number;
  passRate: number; // AA or AAA pass
  grid: number;
  // counts
  aaaCount: number;
  aaCount: number; // counts category 1 (AA only)
  failCount: number;
  map: Uint8Array; // 0 = fail, 1 = AA, 2 = AAA
};

function srgbToLinear(v: number): number {
  const val = v <= 1 ? v : v / 255; // if >1 assume 0-255 range
  return val <= 0.03928 ? val / 12.92 : ((val + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb: culori.Rgb): number {
  const r = srgbToLinear((rgb as any).r);
  const g = srgbToLinear((rgb as any).g);
  const b = srgbToLinear((rgb as any).b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(l1: number, l2: number): number {
  const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

function stopToColor(stop: ColorStop): string {
  switch (stop.type) {
    case 'hex':
      return `#${stop.value}`;
    case 'rgb':
    case 'rgba':
    case 'hsl':
    case 'hsla':
      return stop.value;
    default:
      // literal keyword like 'red'
      return stop.value;
  }
}

export function sampleGradient(
  gradientCSS: string,
  textColor: string,
  grid = 100,
): ContrastResult {
  // Create off-screen canvas
  const canvas = document.createElement('canvas');
  canvas.width = grid;
  canvas.height = grid;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D context unavailable');
  }

  // Fill gradient via ctx API for pixel-perfect browser rendering
  // We only support linear/radial for now (conic later)
  const gradientAst = parse(gradientCSS)[0];
  if (!gradientAst) throw new Error('Invalid gradient');

  let grad: CanvasGradient;
  if (gradientAst.type === 'linear-gradient') {
    grad = ctx.createLinearGradient(0, 0, grid, grid);
  } else if (gradientAst.type === 'radial-gradient') {
    grad = ctx.createRadialGradient(
      grid / 2,
      grid / 2,
      0,
      grid / 2,
      grid / 2,
      grid / 2,
    );
  } else {
    throw new Error(`${gradientAst.type} not supported yet`);
  }

  gradientAst.colorStops.forEach((stop: ColorStop) => {
    let pos = stop.length ? Number(stop.length.value) / 100 : undefined;
    if (pos !== undefined) {
      pos = Math.min(1, Math.max(0, pos));
    }
    const color = stopToColor(stop);
    grad.addColorStop(pos ?? 0, color);
  });

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, grid, grid);

  // Read pixels once
  const { data } = ctx.getImageData(0, 0, grid, grid);

  // Text color luminance
  const textRgb = culori.converter('rgb')(culori.parse(textColor));
  const textL = relativeLuminance(textRgb);

  const map = new Uint8Array(grid * grid);
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let aaaCount = 0;
  let aaOnlyCount = 0;

  for (let i = 0; i < grid * grid; i += 1) {
    const offset = i * 4;
    const rgb: culori.Rgb = {
      mode: 'rgb',
      r: data[offset],
      g: data[offset + 1],
      b: data[offset + 2],
    } as any;
    const l1 = relativeLuminance(rgb);
    const ratio = contrastRatio(l1, textL);

    // Map categories
    let cat = 0;
    if (ratio >= 7) cat = 2; // AAA
    else if (ratio >= 4.5) cat = 1; // AA
    map[i] = cat;

    if (cat === 2) aaaCount += 1;
    else if (cat === 1) aaOnlyCount += 1;

    min = Math.min(min, ratio);
    max = Math.max(max, ratio);
    sum += ratio;
  }

  const passCount = aaaCount + aaOnlyCount;

  return {
    min,
    max,
    avg: sum / (grid * grid),
    passRate: passCount / (grid * grid),
    aaaCount,
    aaCount: aaOnlyCount,
    failCount: grid * grid - passCount,
    map,
    grid,
  };
}

export function contrastFromColors(c1: string, c2: string): number {
  const rgb1 = culori.converter('rgb')(culori.parse(c1));
  const rgb2 = culori.converter('rgb')(culori.parse(c2));
  return contrastRatio(relativeLuminance(rgb1), relativeLuminance(rgb2));
} 