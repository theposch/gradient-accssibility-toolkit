export const SYSTEM_FONTS = [
  'system-ui',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
] as const;

export type SystemFont = typeof SYSTEM_FONTS[number]; 