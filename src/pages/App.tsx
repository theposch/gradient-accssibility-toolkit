import { FC, useEffect, useState } from 'react';
import { Menu, Layers } from 'lucide-react';
import GradientCanvas from '@/components/GradientCanvas';
import { type ContrastResult } from '@/engines/ContrastEngine';
import ContrastAnalysisPanel from '@/components/ContrastAnalysisPanel';
import {
  suggestTextColors,
  suggestGradientFixes,
  type SuggestedColor,
  type GradientSuggestion,
} from '@/engines/SuggestionEngine';
import GradientEditor from '@/components/GradientEditor';
import TextSettings from '@/components/TextSettings';
import SavedDrawer from '@/components/SavedDrawer';
import { loadSaved, saveAll, type SavedGradient } from '@/utils/storage';
import { toast } from 'sonner';

const App: FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [analysis, setAnalysis] = useState<ContrastResult | null>(null);

  const [gradient, setGradient] = useState<string>(
    'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
  );
  const [textColor, setTextColor] = useState<string>('#ffffff');

  const [textSuggestions, setTextSuggestions] = useState<SuggestedColor[]>([]);
  const [gradientFixes, setGradientFixes] = useState<GradientSuggestion[]>([]);

  const [activeTab, setActiveTab] = useState<'text' | 'gradient'>('text');

  const [headline, setHeadline] = useState('A TITLE GOES HERE');
  const [paragraph, setParagraph] = useState(
    'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec sed odio dui.'
  );

  const [saved, setSaved] = useState<SavedGradient[]>(() => loadSaved());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSave = () => {
    if (!analysis) return;
    const item: SavedGradient = { id: crypto.randomUUID(), gradient, textColor, passPct: Math.round(analysis.passRate * 100) };
    const existing = saved.filter((s) => s.gradient !== gradient || s.textColor !== textColor);
    const next = [item, ...existing].slice(0, 50);
    setSaved(next);
    saveAll(next);
    toast.success('Gradient saved');
  };

  const handleDelete = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    saveAll(next);
  };

  const handleLoad = (item: SavedGradient) => {
    setGradient(item.gradient);
    setTextColor(item.textColor);
  };

  useEffect(() => {
    setTextSuggestions(suggestTextColors(gradient));
    setGradientFixes(suggestGradientFixes(gradient, textColor));
  }, [gradient, textColor]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-semibold">Contrast Checker</h1>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-100"
        >
          <Menu className="w-4 h-4" />
          Saved Gradients
        </button>
      </header>

      {/* Body */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[350px] overflow-y-auto border-r bg-white p-4">
          <GradientEditor gradient={gradient} onChange={setGradient} />
          <TextSettings
            headline={headline}
            onHeadlineChange={setHeadline}
            paragraph={paragraph}
            onParagraphChange={setParagraph}
            textColor={textColor}
            onTextColorChange={setTextColor}
          />
        </aside>

        {/* Center content */}
        <section className="flex-1 overflow-y-auto p-6">
          <div className="w-full rounded-lg border flex flex-col h-full">
            {/* Gradient Preview */}
            <div className="relative h-60 border-b group">
              <button
                type="button"
                onClick={() => setShowOverlay((v) => !v)}
                className="absolute top-2 right-2 z-20 p-2 text-gray-600 hover:text-gray-900"
                title="Toggle overlay"
              >
                <Layers className="w-4 h-4" />
              </button>
              <div className="absolute inset-0 pointer-events-none">
                <GradientCanvas
                  gradient={gradient}
                  textColor={textColor}
                  showOverlay={showOverlay}
                  onAnalysis={setAnalysis}
                  className="h-full"
                />
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none px-4"
                  style={{ color: textColor }}
                >
                  <h1 className="text-5xl font-semibold tracking-wide">
                    {headline}
                  </h1>
                  <p className="max-w-xl mt-4 text-sm leading-relaxed">
                    {paragraph}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="border-b flex text-sm font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('gradient')}
                className={`flex-1 py-2 ${
                  activeTab === 'gradient' ? 'bg-gray-100' : ''
                }`}
              >
                Gradient Suggestion
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`flex-1 py-2 ${activeTab === 'text' ? 'bg-gray-100' : ''}`}
              >
                Text Color Suggestion
              </button>
            </div>

            {/* Suggestions content */}
            <div className="p-4 flex-1 overflow-y-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeTab === 'text' && (
                textSuggestions.length ? (
                  textSuggestions.map((s) => (
                    <button
                      key={s.hex}
                      type="button"
                      onClick={() => setTextColor(s.hex)}
                      className="border rounded-md p-3 flex flex-col items-center hover:bg-gray-50"
                    >
                      <div
                        className="w-10 h-10 rounded-full border mb-2"
                        style={{ background: s.hex }}
                      />
                      <span className="text-sm font-medium">{s.hex}</span>
                      <span className="text-xs text-gray-500 mb-1">{s.ratio.toFixed(1)}:1</span>
                      <span
                        className={`text-[10px] px-1 rounded ${s.ratio >= 7 ? 'bg-emerald-100 text-emerald-700' : s.ratio >= 4.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}
                      >
                        {s.ratio >= 7 ? 'AAA' : s.ratio >= 4.5 ? 'AA' : 'Fail'}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="col-span-full text-center text-xs text-gray-500">No text suggestions yet. Adjust gradient or angle.</p>
                )
              )}

              {activeTab === 'gradient' && (
                gradientFixes.length ? (
                  gradientFixes.map((g) => (
                    <button
                      key={g.css}
                      type="button"
                      onClick={() => setGradient(g.css)}
                      className="border rounded-md flex flex-col hover:bg-gray-50 overflow-hidden"
                    >
                      <div className="h-24" style={{ background: g.css }} />
                      <div className="p-2 text-xs flex justify-between items-center">
                        <span>Min {g.minRatio.toFixed(1)}:1</span>
                        <span className={`px-1 rounded ${g.minRatio >= 7 ? 'bg-emerald-100 text-emerald-700' : g.minRatio >= 4.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{g.minRatio >= 7 ? 'AAA' : g.minRatio >= 4.5 ? 'AA' : 'Fail'}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="col-span-full text-center text-xs text-gray-500">No gradient fixes yet. Try adjusting text color.</p>
                )
              )}
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="w-[350px] overflow-y-auto border-l bg-white p-4">
          <ContrastAnalysisPanel result={analysis} />
          <button type="button" onClick={handleSave} className="w-full mt-2 rounded-md bg-emerald-600 text-white py-2 text-sm hover:bg-emerald-700">
            Save
          </button>
        </aside>
      </main>

      <SavedDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        list={saved}
        onLoad={handleLoad}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default App; 