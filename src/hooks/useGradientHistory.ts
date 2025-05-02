import { useRef, useState } from 'react';
import { HistoryEntry } from '@/types';

export function useGradientHistory(initial: HistoryEntry) {
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const prevRef = useRef<HistoryEntry>(initial);
  const skipRef = useRef(false);

  const record = (current: HistoryEntry) => {
    if (skipRef.current) {
      skipRef.current = false;
      prevRef.current = current;
      return;
    }
    const prev = prevRef.current;
    if (prev.gradient !== current.gradient || prev.textColor !== current.textColor) {
      setPast((p) => [...p, prev]);
      setFuture([]);
    }
    prevRef.current = current;
  };

  const undo = (setState: (entry: HistoryEntry) => void) => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [prevRef.current, ...f]);
      skipRef.current = true;
      setState(prev);
      return p.slice(0, -1);
    });
  };

  const redo = (setState: (entry: HistoryEntry) => void) => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast((p) => [...p, prevRef.current]);
      skipRef.current = true;
      setState(next);
      return f.slice(1);
    });
  };

  return {
    past,
    future,
    record,
    undo,
    redo,
  };
}

export default useGradientHistory; 