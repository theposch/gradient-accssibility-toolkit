export type SavedGradient = {
  id: string;
  gradient: string;
  textColor: string;
  passPct: number; // percent AA+ pass at save time
};

const KEY = 'cc-saved-gradients-v1';

export function loadSaved(): SavedGradient[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedGradient[];
  } catch {
    return [];
  }
}

export function saveAll(list: SavedGradient[]): void {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
} 