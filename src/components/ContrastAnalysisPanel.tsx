import { FC } from 'react';
import { type ContrastResult } from '@/engines/ContrastEngine';

interface Props {
  result: ContrastResult | null;
}

const ratingLabel = (aaPercent: number): { label: string; color: string } => {
  if (aaPercent >= 80) return { label: 'Good', color: 'bg-emerald-100 text-emerald-800' };
  if (aaPercent >= 40) return { label: 'Fair', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Poor', color: 'bg-red-100 text-red-800' };
};

const ContrastAnalysisPanel: FC<Props> = ({ result }) => {
  if (!result) {
    return <p className="text-gray-500 text-sm">Calculating…</p>;
  }

  const total = result.grid * result.grid;
  const aaaPct = (result.aaaCount / total) * 100;
  const aaPct = (result.aaCount / total) * 100;
  const failPct = (result.failCount / total) * 100;
  const aaOverallPct = aaPct + aaaPct;

  const rating = ratingLabel(aaOverallPct);

  return (
    <div className="space-y-4">
      {/* Overall Rating */}
      <div className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${rating.color}`}>
        {rating.label} ({Math.round(aaOverallPct)}% AA Pass)
      </div>

      {/* Min/Avg/Max Tiles */}
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="border rounded-md p-2">
          <div className="font-semibold">Min</div>
          <div>{result.min.toFixed(1)}</div>
        </div>
        <div className="border rounded-md p-2">
          <div className="font-semibold">Avg</div>
          <div>{result.avg.toFixed(1)}</div>
        </div>
        <div className="border rounded-md p-2">
          <div className="font-semibold">Max</div>
          <div>{result.max.toFixed(1)}</div>
        </div>
      </div>

      {/* Compliance Bar */}
      <div className="space-y-1">
        <div className="flex h-3 w-full overflow-hidden rounded-md">
          <div className="bg-emerald-500" style={{ width: `${aaaPct}%` }} />
          <div className="bg-yellow-500" style={{ width: `${aaPct}%` }} />
          <div className="bg-red-500" style={{ width: `${failPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>AAA ({Math.round(aaaPct)}%)</span>
          <span>AA ({Math.round(aaPct)}%)</span>
          <span>Fail ({Math.round(failPct)}%)</span>
        </div>
      </div>

      {/* AA/AAA info cards */}
      <div className="space-y-2 text-xs">
        <div className="border rounded-md p-2 flex justify-between items-center">
          <div>
            <div className="font-medium">AA Standard</div>
            <div>Contrast ≥ 4.5:1</div>
          </div>
          <div className={`text-sm font-semibold ${aaOverallPct >= 40 ? 'text-emerald-600' : 'text-red-600'}`}>
            {aaOverallPct >= 40 ? 'Pass' : 'Fail'}
          </div>
        </div>
        <div className="border rounded-md p-2 flex justify-between items-center">
          <div>
            <div className="font-medium">AAA Standard</div>
            <div>Contrast ≥ 7:1</div>
          </div>
          <div className={`text-sm font-semibold ${aaaPct >= 20 ? 'text-emerald-600' : 'text-red-600'}`}>
            {aaaPct >= 20 ? 'Pass' : 'Fail'}
          </div>
        </div>
      </div>

      {/* Save button moved to parent */}
    </div>
  );
};

export default ContrastAnalysisPanel; 