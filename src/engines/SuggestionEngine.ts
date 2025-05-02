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
  guaranteed?: boolean; // true if purposely generated to ensure AA pass
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

  const deltas = [2, 4, 6, 8, 10, 12, 14, 16]; // extended range for diversity

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
    deltas.forEach((Δ) => {
      ast.colorStops.forEach((stop, idx) => {
        const newStops = origStops.map((s) => ({ ...s }));
        const base = culori.oklch(newStops[idx].color);
        const newL = Math.max(0, Math.min(1, base.l + (dir * Δ) / 100));
        newStops[idx].color = culori.formatHex({ ...base, mode: 'oklch', l: newL });
        tryCandidate(newStops);
      });
    });
  });

  // If we still have few candidates, just return sorted unique list
  if (candidates.length <= max) {
    const unique = new Map<string, GradientSuggestion>();
    candidates
      .sort((a, b) => b.minRatio - a.minRatio)
      .forEach((cand) => {
        if (!unique.has(cand.css) && unique.size < max) unique.set(cand.css, cand);
      });
    return Array.from(unique.values());
  }

  // --- diversity filtering via simple k-means on OKLab --------------------------------
  // Represent each gradient by mean OKLab of its stops
  const toPoint = (css: string): [number, number, number] => {
    const node = parse(css)[0];
    if (!node) return [0, 0, 0];
    const coords = (node.colorStops as ColorStop[]).map((s) => culori.oklab(s.type === 'hex' ? `#${s.value}` : s.value));
    const { l, a, b } = coords.reduce(
      (acc, c) => ({ l: acc.l + c.l, a: acc.a + c.a, b: acc.b + c.b }),
      { l: 0, a: 0, b: 0 }
    );
    const n = coords.length;
    return [l / n, a / n, b / n];
  };

  const points = candidates.map((c) => toPoint(c.css));

  // initialise centroids with top-k brightest candidates by contrast
  const initialCentroids = candidates
    .slice()
    .sort((a, b) => b.minRatio - a.minRatio)
    .slice(0, max)
    .map((c) => toPoint(c.css));

  let centroids = initialCentroids;
  const assign: number[] = new Array(points.length).fill(0);

  for (let iter = 0; iter < 10; iter += 1) {
    // assignment step
    for (let i = 0; i < points.length; i += 1) {
      let best = 0;
      let bestDist = Infinity;
      for (let k = 0; k < centroids.length; k += 1) {
        const d = (points[i][0] - centroids[k][0]) ** 2 + (points[i][1] - centroids[k][1]) ** 2 + (points[i][2] - centroids[k][2]) ** 2;
        if (d < bestDist) { bestDist = d; best = k; }
      }
      assign[i] = best;
    }

    // update step
    const newCentroids: Array<[number, number, number]> = centroids.map(() => [0, 0, 0]);
    const counts = centroids.map(() => 0);
    for (let i = 0; i < points.length; i += 1) {
      const k = assign[i];
      newCentroids[k][0] += points[i][0];
      newCentroids[k][1] += points[i][1];
      newCentroids[k][2] += points[i][2];
      counts[k] += 1;
    }
    centroids = newCentroids.map((sum, idx) => (counts[idx] ? (sum.map((v) => v / counts[idx]) as [number, number, number]) : centroids[idx]));
  }

  // pick best candidate per cluster
  const chosen: GradientSuggestion[] = [];
  for (let k = 0; k < max; k += 1) {
    const clusterCandidates = candidates.filter((_, idx) => assign[idx] === k);
    if (clusterCandidates.length === 0) continue;
    const best = clusterCandidates.sort((a, b) => b.minRatio - a.minRatio)[0];
    chosen.push(best);
  }

  // Ensure ΔE ≥ 20 between selections; if violation, swap
  const distinct: GradientSuggestion[] = [];
  const lab = culori.converter('lab');
  const isDistinct = (css: string): boolean => {
    const node = parse(css)[0];
    if (!node) return true;
    const c = lab((node.colorStops[0] as ColorStop).type === 'hex' ? `#${(node.colorStops[0] as ColorStop).value}` : (node.colorStops[0] as ColorStop).value);
    return distinct.every((sel) => {
      const n = parse(sel.css)[0];
      const c2 = lab((n.colorStops[0] as ColorStop).type === 'hex' ? `#${(n.colorStops[0] as ColorStop).value}` : (n.colorStops[0] as ColorStop).value);
      return deltaE(c, c2) >= 20;
    });
  };

  chosen
    .sort((a, b) => b.minRatio - a.minRatio)
    .forEach((cand) => {
      if (distinct.length < max && isDistinct(cand.css)) distinct.push(cand);
    });

  // Fallback: fill remaining slots if some clusters too similar
  if (distinct.length < max) {
    candidates
      .sort((a, b) => b.minRatio - a.minRatio)
      .forEach((cand) => {
        if (distinct.length >= max) return;
        if (!distinct.some((d) => d.css === cand.css) && isDistinct(cand.css)) distinct.push(cand);
      });
  }

  // ---------------------------------------------------------------------------
  // Guarantee: ensure at least one suggestion passes AA (≥4.5)
  // ---------------------------------------------------------------------------
  const hasAAPass = distinct.some((d) => d.minRatio >= 4.5);

  if (!hasAAPass) {
    const attemptShift = (dir: number): GradientSuggestion | null => {
      const globalDeltas = [2,4,6,8,10,12,15,20,25,30,35,40,50,60,70,80,90,100];
      for (const Δ of globalDeltas) {
        const newStops = origStops.map((s) => {
          const oklch = culori.oklch(s.color);
          const newL = Math.max(0, Math.min(1, oklch.l + (dir * Δ) / 100));
          return { ...s, color: culori.formatHex({ ...oklch, mode: 'oklch', l: newL }) };
        });
        const css = `${ast.type}(${(ast as any).orientation?.value ?? '135'}deg, ${newStops
          .map((s) => `${s.color} ${s.position}%`)
          .join(', ')})`;
        const res = sampleGradient(css, textColor, grid);
        if (res.min >= 4.5) {
          return {
            css,
            minRatio: res.min,
            deltaE: avgDeltaE(newStops, origStops),
            guaranteed: true,
          };
        }
      }
      return null;
    };

    let guaranteed: GradientSuggestion | null = null;
    const dirPrimary = textLum > 0.5 ? -1 : 1;
    guaranteed = attemptShift(dirPrimary);
    if (!guaranteed) {
      // Try opposite direction (edge case where primary fails)
      guaranteed = attemptShift(-dirPrimary);
    }

    if (!guaranteed) {
      // Fallback: pure dark or light gradient
      const fallbackColor = dirPrimary === -1 ? '#000000' : '#ffffff';
      const css = `linear-gradient(135deg, ${fallbackColor} 0%, ${fallbackColor} 100%)`;
      const res = sampleGradient(css, textColor, grid);
      guaranteed = { css, minRatio: res.min, deltaE: 100, guaranteed: true };
    }

    // Prepend guaranteed suggestion
    const withoutDup = distinct.filter((d) => d.css !== guaranteed.css);
    distinct.splice(0, distinct.length, guaranteed, ...withoutDup);
  }

  return distinct.slice(0, max);
} 