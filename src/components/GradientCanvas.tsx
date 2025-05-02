import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FC,
} from 'react';
import { sampleGradient, type ContrastResult } from '@/engines/ContrastEngine';

export interface GradientCanvasProps {
  gradient: string;
  textColor: string;
  grid?: number;
  showOverlay?: boolean;
  onAnalysis?: (res: ContrastResult) => void;
  className?: string;
}

const cellColor = (cat: number): string => {
  switch (cat) {
    case 2:
      return 'rgba(34,197,94,0.6)'; // AAA green
    case 1:
      return 'rgba(234,179,8,0.8)'; // AA yellow
    default:
      return 'rgba(239,68,68,0.9)'; // fail red
  }
};

const GradientCanvas: FC<GradientCanvasProps> = ({
  gradient,
  textColor,
  grid = 100,
  showOverlay = false,
  onAnalysis,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Resize observer to redraw on container resize
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { width, height } = size;
    if (width === 0 || height === 0) return;
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    // Instead of drawing gradient via Canvas API (complex), simply set canvas background
    canvasRef.current.style.background = gradient;
    ctx.clearRect(0, 0, width, height); // ensure overlay transparency
  }, [gradient, size]);

  const analyse = useCallback(() => {
    const res = sampleGradient(gradient, textColor, grid);
    if (onAnalysis) onAnalysis(res);

    if (!overlayRef.current || !showOverlay) return;
    const ctx = overlayRef.current.getContext('2d');
    if (!ctx) return;

    const { width, height } = size;
    overlayRef.current.width = width;
    overlayRef.current.height = height;

    const cellW = width / grid;
    const cellH = height / grid;

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    for (let y = 0; y < grid; y += 1) {
      for (let x = 0; x < grid; x += 1) {
        const cat = res.map[y * grid + x];
        ctx.strokeStyle = cellColor(cat);
        ctx.strokeRect(Math.floor(x * cellW) + 0.5, Math.floor(y * cellH) + 0.5, cellW, cellH);
      }
    }
    ctx.restore();
  }, [gradient, textColor, grid, onAnalysis, showOverlay, size]);

  useEffect(() => {
    draw();
    analyse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw, analyse]);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className ?? ''}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {showOverlay && (
        <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      )}
    </div>
  );
};

export default GradientCanvas; 