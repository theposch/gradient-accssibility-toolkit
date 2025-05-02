import { FC, useEffect, useState, useRef } from 'react';
import { parse } from 'gradient-parser';
import * as culori from 'culori';
import GradientBar from './GradientBar';
import { GRADIENT_PRESETS } from '@/constants/gradientPresets';

interface Stop {
  id: string;
  color: string;
  position: number; // 0-100
}

interface Props {
  gradient: string;
  onChange: (css: string) => void;
}

const PRESETS = GRADIENT_PRESETS;

const toStops = (css: string): { angle: number; stops: Stop[] } => {
  try {
    const ast = parse(css)[0];
    if (!ast) throw new Error('parse');
    const rawAngle = (ast as any).orientation?.value;
    const angle = rawAngle ? Number(rawAngle) : 135;
    const stops = ast.colorStops.map((s, idx) => ({
      id: `${idx}`,
      color: s.type === 'hex' ? `#${s.value.replace(/^#/, '')}` : s.value,
      position: s.length ? Number(s.length.value) : 0,
    }));
    return { angle, stops };
  } catch {
    return {
      angle: 135,
      stops: [
        { id: '0', color: '#ff9a9e', position: 0 },
        { id: '1', color: '#fad0c4', position: 100 },
      ],
    };
  }
};

const serialize = (angle: number, stops: Stop[]): string =>
  `linear-gradient(${angle}deg, ${stops
    .map((s) => `${s.color.startsWith('#') ? s.color : `#${s.color}`} ${s.position}%`)
    .join(', ')})`;

// Utility: adjust OKLCH lightness by delta [-1,1]
const adjustLightness = (color: string, delta: number): string => {
  try {
    const oklch = culori.oklch(color);
    if (!oklch) return color;
    const l = Math.max(0, Math.min(1, oklch.l + delta));
    return culori.formatHex({ ...oklch, mode: 'oklch', l });
  } catch {
    return color; // fallback if parse fails
  }
};

const GradientEditor: FC<Props> = ({ gradient, onChange }) => {
  const initial = toStops(gradient);
  const [angle, setAngle] = useState<number>(initial.angle);
  const [stops, setStops] = useState<Stop[]>(initial.stops);
  const internalRef = useRef(gradient);

  // selection for highlighting/Bar sync
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (gradient !== internalRef.current) {
      const parsed = toStops(gradient);
      setAngle(parsed.angle);
      setStops(parsed.stops);
    }
  }, [gradient]);

  useEffect(() => {
    const css = serialize(angle, stops);
    internalRef.current = css;
    onChange(css);
  }, [stops, angle]);

  const sortByPos = (arr: Stop[]): Stop[] =>
    arr
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s, i) => ({ ...s, id: `${i}` }));

  const updateStop = (id: string, patch: Partial<Stop>) => {
    setStops((prev) => sortByPos(prev.map((s) => (s.id === id ? { ...s, ...patch } : s))));
  };

  const addStop = () => {
    setStops((prev) => [
      ...prev,
      {
        id: `${stops.length}`,
        color: prev[prev.length - 1]?.color ?? '#ffffff',
        position: 50,
      },
    ]);
  };

  const removeStop = (id: string) => {
    setStops((prev) => (prev.length > 2 ? prev.filter((s) => s.id !== id) : prev));
  };

  // Light/Dark step helpers
  const shiftLightness = (delta: number) => {
    setStops((prev) =>
      prev.map((s) => ({ ...s, color: adjustLightness(s.color, delta) }))
    );
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (e.metaKey || e.ctrlKey) {
        next.has(id) ? next.delete(id) : next.add(id);
      } else if (e.shiftKey && prev.size) {
        const ids = stops.map((s) => s.id);
        const last = ids.findIndex((i) => prev.has(i));
        const curr = ids.findIndex((i) => i === id);
        const [start, end] = [last, curr].sort((a, b) => a - b);
        for (let i = start; i <= end; i += 1) next.add(ids[i]);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm">
        Preset
        <select
          className="mt-1 w-full border rounded px-1 py-1 text-sm"
          value={
            PRESETS.find((p) => p.css === internalRef.current) ? internalRef.current : 'custom'
          }
          onChange={(e) => {
            if (e.target.value !== 'custom') {
              const css = e.target.value;
              const parsed = toStops(css);
              setAngle(parsed.angle);
              setStops(parsed.stops);
              internalRef.current = css;
              onChange(css);
            }
          }}
        >
          <option value="custom">Custom</option>
          {PRESETS.map((p) => (
            <option
              key={p.name}
              value={p.css}
              style={{ backgroundImage: p.css, backgroundSize: '100% 100%' }}
            >
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-2">
        <label className="block text-sm flex-1">Angle: {angle}°
          <input
            type="range"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full"
          />
        </label>
      </div>

      {/* Gradient bar preview */}
      <GradientBar
        stops={stops}
        angle={angle}
        selected={selected}
        onChange={(upd) => {
          setStops(sortByPos(upd));
        }}
        onSelect={(id) => setSelected(new Set([id]))}
        onAdd={(stop) => setStops((prev) => sortByPos([...prev, stop]))}
      />

      {/* Lighten / Darken controls */}
      <div className="flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => shiftLightness(0.05)}
          className="flex-1 rounded border px-2 py-1 hover:bg-gray-50"
        >
          ▲ Lighter
        </button>
        <button
          type="button"
          onClick={() => shiftLightness(-0.05)}
          className="flex-1 rounded border px-2 py-1 hover:bg-gray-50"
        >
          ▼ Darker
        </button>
      </div>

      {stops.map((stop, idx) => (
        <div
          key={stop.id}
          className={`flex items-center gap-2 ${selected.has(stop.id) ? 'bg-emerald-50 ring-2 ring-emerald-400' : ''}`}
          onClick={(e) => toggleSelect(stop.id, e)}
        >
          <input
            type="color"
            value={stop.color}
            onChange={(e) => updateStop(stop.id, { color: e.target.value })}
            className="h-8 w-8 border p-0"
          />
          <input
            type="text"
            value={stop.color}
            onChange={(e) => updateStop(stop.id, { color: e.target.value })}
            className="w-24 border rounded px-1 text-sm"
          />
          <input
            type="number"
            min={0}
            max={100}
            value={stop.position}
            onChange={(e) => updateStop(stop.id, { position: Number(e.target.value) })}
            className="w-20 border rounded px-1 text-xs"
          />
          <span className="text-xs">%</span>
          {stops.length > 2 && (
            <button
              type="button"
              onClick={() => removeStop(stop.id)}
              className="text-red-500 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addStop}
        className="mt-2 rounded border px-2 py-1 text-xs hover:bg-gray-50"
      >
        + Add Stop
      </button>
    </div>
  );
};

export default GradientEditor; 