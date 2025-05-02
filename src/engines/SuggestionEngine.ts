import { parse, type ColorStop } from 'gradient-parser';
import * as culori from 'culori';
import { sampleGradient, contrastFromColors } from './ContrastEngine';

export interface SuggestedColor {
  hex: string;
  ratio: number;
  deltaE: number;
}

export interface GradientFix {
  css: string;
  minRatio: number;
}

function ensureHex(color: string): string {
  const rgb = culori.converter('rgb')(culori.parse(color));
  return culori.formatHex(rgb);
}

// Simple ΔE (CIE76) on Lab space – good enough for distinctness check
function deltaE(c1: string, c2: string): number {
  const lab = culori.converter('lab');
  const a = lab(c1);
  const b = lab(c2);
  if (!a || !b) return 0;
  return Math.sqrt((a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

/**
 * Suggest up to 6 text colors based on HSL-L30 rule.
 */
export function suggestTextColors(
  gradientCSS: string,
  count = 6,
): SuggestedColor[] {
  const ast = parse(gradientCSS)[0];
  if (!ast) return [];

  const lightnessTargets = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95];
  const suggestions: SuggestedColor[] = [];

  const stopColors = ast.colorStops.map((s) => {
    const hex = ensureHex(s.type === 'hex' ? `#${s.value}` : s.value);
    return { hex, hsl: culori.hsl(hex) };
  });

  stopColors.forEach(({ hex: bgHex, hsl }) => {
    lightnessTargets.forEach((l) => {
      const candidate = culori.formatHex({ mode: 'hsl', h: hsl.h, s: hsl.s, l });
      const ratio = contrastFromColors(candidate, bgHex);
      suggestions.push({ hex: candidate, ratio, deltaE: 0 });
    });
  });

  // Deduplicate
  const uniq = Array.from(new Map(suggestions.map((s) => [s.hex, s])).values());

  // Compute diversity filter and sort
  const final: SuggestedColor[] = [];
  uniq
    .sort((a, b) => b.ratio - a.ratio)
    .forEach((cand) => {
      if (final.some((f) => deltaE(f.hex, cand.hex) < 10)) return;
      final.push(cand);
      if (final.length >= count) return;
    });
  return final.slice(0, count);
}

// utility to average Lab deltaE between stop lists
function avgDeltaE(a: Stop[], b: Stop[]): number {
  const lab = culori.converter('lab');
  return (
    a.reduce((sum, stop, i) => sum + deltaE(stop.color, b[i].color), 0) / a.length
  );
}

type Stop = { color: string; position: number };

export interface GradientSuggestion {
  css: string;
  minRatio: number;
  deltaE: number;
}

export function suggestGradientFixes(
  gradientCSS: string,
  textColor: string,
  grid = 100,
  max = 6,
): GradientSuggestion[] {
  const ast = parse(gradientCSS)[0];
  if (!ast) return [];

  // Determine light/dark text
  const textLum = culori.lch(textColor).l;
  const direction = textLum > 0.5 ? -1 : 1; // -1 darken, +1 lighten

  // Capture original stops for deltaE
  const origStops: Stop[] = ast.colorStops.map((s) => ({
    color: s.type === 'hex' ? `#${s.value}` : s.value,
    position: s.length ? Number(s.length.value) : 0,
  }));

  const deltas = [2, 4, 6, 8, 10];

  // baseline contrast
  const baseMin = sampleGradient(gradientCSS, textColor, grid).min;

  const directionsToTry = baseMin >= 4.5 ? [direction, -direction] : [direction];

  const candidates: GradientSuggestion[] = [];

  const tryCandidate = (stops: Stop[]): void => {
    const css = `${ast.type}(${(ast as any).orientation?.value ?? '135'}deg, ${stops
      .map((s) => `${s.color} ${s.position}%`)
      .join(', ')})`;
    const res = sampleGradient(css, textColor, grid);
    const dE = avgDeltaE(stops, origStops);
    if (res.min - baseMin > 0.05) {
      candidates.push({ css, minRatio: res.min, deltaE: dE });
    }
  };

  directionsToTry.forEach((dir) => {
    deltas.some((Δ) => {
      ast.colorStops.forEach((stop, idx) => {
        const newStops = origStops.map((s) => ({ ...s }));
        const base = culori.oklch(newStops[idx].color);
        const newL = Math.max(0, Math.min(1, base.l + (dir * Δ) / 100));
        newStops[idx].color = culori.formatHex({ ...base, mode: 'oklch', l: newL });
        tryCandidate(newStops);
      });
      return candidates.length >= max;
    });
  });

  // sort and dedupe
  const unique = new Map<string, GradientSuggestion>();
  candidates
    .sort((a, b) => b.minRatio - a.minRatio)
    .forEach((cand) => {
      if (!unique.has(cand.css) && unique.size < max) unique.set(cand.css, cand);
    });
  return Array.from(unique.values());
} 