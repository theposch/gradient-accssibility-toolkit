import { FC, useRef } from 'react';
import * as culori from 'culori';

interface Stop {
  id: string;
  color: string;
  position: number; // 0–100
}

interface Props {
  stops: Stop[];
  angle: number;
  selected: Set<string>;
  onChange: (stops: Stop[]) => void;
  onSelect: (id: string) => void;
  onAdd: (stop: Stop) => void;
}

const GradientBar: FC<Props> = ({ stops, angle, selected, onChange, onSelect, onAdd }) => {
  const barRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    stopId: string,
  ) => {
    e.preventDefault();
    onSelect(stopId);
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();

    const move = (ev: PointerEvent) => {
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      onChange(
        stops.map((s) =>
          s.id === stopId ? { ...s, position: Math.max(0, Math.min(100, pct)) } : s,
        ),
      );
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== barRef.current) return; // avoid bubble clicks
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;

    // interpolate color
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    let left = sorted[0];
    let right = sorted[sorted.length - 1];
    for (let i = 0; i < sorted.length - 1; i += 1) {
      if (pct >= sorted[i].position && pct <= sorted[i + 1].position) {
        left = sorted[i];
        right = sorted[i + 1];
        break;
      }
    }
    const t = (pct - left.position) / (right.position - left.position || 1);
    const mixed = culori.mix(left.color, right.color, 'oklch')(t);
    const hex = culori.formatHex(mixed);

    const newStop: Stop = { id: `${crypto.randomUUID()}`, color: hex, position: pct };
    onAdd(newStop);
  };

  const gradientCss = `linear-gradient(${angle}deg, ${stops
    .map((s) => `${s.color} ${s.position}%`)
    .join(', ')})`;

  return (
    <div
      ref={barRef}
      className="relative h-8 rounded cursor-pointer"
      style={{ background: gradientCss }}
      onClick={handleBarClick}
    >
      {stops.map((s) => (
        <div
          key={s.id}
          role="button"
          tabIndex={0}
          onPointerDown={(e) => handlePointerDown(e, s.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSelect(s.id);
          }}
          className={`absolute -top-2 w-4 h-4 rounded-full border-2 border-white shadow cursor-pointer ${
            selected.has(s.id) ? 'ring-2 ring-emerald-500' : ''
          }`}
          style={{ left: `calc(${s.position}% - 8px)`, background: s.color }}
        />
      ))}
    </div>
  );
};

export default GradientBar; 