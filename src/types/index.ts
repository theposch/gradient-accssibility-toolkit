export interface CustomFont {
  name: string;
  url: string;
}

export interface CustomFontStyles {
  headlineSize: string;
  headlineHeight: string;
  headlineSpacing: string;
  paragraphSize: string;
  paragraphHeight: string;
  paragraphSpacing: string;
}

export interface SavedGradient {
  id: string;
  gradient: string;
  textColor: string;
  passPct: number;
}

export interface GradientStop {
  id: string;
  color: string;
  position: number;
}

export interface ContrastResult {
  min: number;
  max: number;
  avg: number;
  passRate: number;
  map: Uint8Array;
  grid: number;
  aaaCount: number;
  aaCount: number;
  failCount: number;
}

export interface GradientSuggestion {
  css: string;
  minRatio: number;
  deltaE: number;
  guaranteed?: boolean;
}

export type TextAlignment = 'left' | 'center' | 'right';

export interface HistoryEntry {
  gradient: string;
  textColor: string;
} 