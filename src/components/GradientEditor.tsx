import { FC, useEffect, useState, useRef } from 'react';
import { parse } from 'gradient-parser';
import * as culori from 'culori';
import GradientBar from './GradientBar';

interface Stop {
  id: string;
  color: string;
  position: number; // 0-100
}

interface Props {
  gradient: string;
  onChange: (css: string) => void;
}

const PRESETS = [
  { name: 'Peach Glow', css: 'linear-gradient(180deg, #FFB9B6 0%, #EED5A5 100%)' },
  { name: 'Lavender Mist', css: 'linear-gradient(180deg, #FEDFFF 0%, #938DC9 100%)' },
  { name: 'Cotton Candy Fate', css: 'linear-gradient(180deg, #F9F8F5 2%, #EFFFFF 10.5%, #FF8CB3 100%)' },
  { name: 'Golden Sunrise', css: 'linear-gradient(180deg, #FFFDCC 0%, #FEC1CF 100%)' },
  { name: 'Blush Bloom', css: 'linear-gradient(180deg, #FFB3BB 0%, #E3B5E5 100%)' },
  { name: 'Skyline Drift', css: 'linear-gradient(180deg, #B7E8F4 0%, #8F94CC 100%)' },
  { name: 'Rosy Horizon', css: 'linear-gradient(245deg, #FF9DBA 16.22%, #80C6EA 100.53%)' },
  { name: 'Dusky Rose', css: 'linear-gradient(180deg, #FE95B5 0%, #988FC6 100%)' },
  { name: 'Morning Light', css: 'linear-gradient(205deg, #FEFF8F 0%, #FE5A51 100%)' },
  { name: 'Ethereal Ice', css: 'linear-gradient(180deg, #FED6FD 0%, #9EEDF4 100%)' },
  { name: 'Soft Sunset', css: 'linear-gradient(180deg, #FFC2D5 0%, #55B9EA 100%)' },
  { name: 'Blueberry Dream', css: 'linear-gradient(180deg, #B3ECF3 0%, #8985D5 100%)' },
  { name: 'Lilac Mirage', css: 'linear-gradient(180deg, #A15CCE 0%, #FEA7EE 100%)' },
  { name: 'Velvet Ember', css: 'linear-gradient(180deg, #B00000 0%, #E4C2E7 100%)' },
  { name: 'Mint Breeze', css: 'linear-gradient(180deg, #FFFFC7 0%, #97E5D0 100%)' },
  { name: 'Ocean Depths', css: 'linear-gradient(180deg, #00A6E0 0%, #014DAD 100%)' },
  { name: 'Dawn Serenity', css: 'linear-gradient(180deg, #FBF9D2 0%, #0069B1 100%)' },
  { name: 'Amethyst Haze', css: 'linear-gradient(180deg, #ED97D4 0%, #793A6F 100%)' },
  { name: 'Molten Gold', css: 'linear-gradient(180deg, #B30E00 0%, #FEC700 100%)' },
  { name: 'Golden Olive', css: 'linear-gradient(180deg, #FBDA02 0%, #839A32 100%)' },
] as const;

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