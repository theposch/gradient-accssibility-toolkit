declare module 'gradient-parser' {
  export interface ColorStop {
    type: string;
    value: string;
    length?: { value: string };
  }
  export interface GradientNode {
    type: string;
    colorStops: ColorStop[];
  }
  export function parse(input: string): GradientNode[];
}

declare module 'culori' {
  export interface Rgb {
    mode: 'rgb';
    r: number;
    g: number;
    b: number;
    alpha?: number;
  }

  // Color conversion factory
  export function converter(mode: 'rgb'): (c: any) => Rgb;

  // Parse any CSS color / gradient string into culori data structure (we treat as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function parse(input: string): any;

  // fallback export (any)
  const culori: any;
  export = culori;
} 