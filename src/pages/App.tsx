import { FC, useEffect, useState, useRef } from 'react';
import { Menu, Layers, Clipboard, Undo, Redo } from 'lucide-react';
import GradientCanvas from '@/components/GradientCanvas';
import { ContrastResult } from '@/types';
import ContrastAnalysisPanel from '@/components/ContrastAnalysisPanel';
import TextOverlay from '@/components/TextOverlay';
import {
  suggestTextColors,
  suggestGradientFixes,
  type SuggestedColor,
  type GradientSuggestion,
} from '@/engines/SuggestionEngine';
import GradientEditor from '@/components/GradientEditor';
import TextSettings from '@/components/TextSettings';
import SavedDrawer from '@/components/SavedDrawer';
import { loadSaved, saveAll } from '@/utils/storage';
import { toast } from 'sonner';
import Tooltip from '@/components/Tooltip';
import {
  CustomFont,
  CustomFontStyles,
  SavedGradient,
  TextAlignment,
  HistoryEntry
} from '@/types';
import useFontManager from '@/hooks/useFontManager';

const App: FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [analysis, setAnalysis] = useState<ContrastResult | null>(null);

  const initialGradient = 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)';

  // Committed gradient – basis for generating suggestions
  const [baseGradient, setBaseGradient] = useState<string>(initialGradient);
  // Currently displayed gradient (can be preview)
  const [gradient, setGradient] = useState<string>(initialGradient);

  const [textColor, setTextColor] = useState<string>('#ffffff');

  const [textSuggestions, setTextSuggestions] = useState<SuggestedColor[]>([]);
  const [gradientFixes, setGradientFixes] = useState<GradientSuggestion[]>([]);

  // Track which suggestion is being previewed
  const [activeSuggestionCss, setActiveSuggestionCss] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'text' | 'gradient'>('text');

  const [headline, setHeadline] = useState('A TITLE GOES HERE');
  const [paragraph, setParagraph] = useState(
    'Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor. Donec sed odio dui.'
  );

  const [saved, setSaved] = useState<SavedGradient[]>(() => loadSaved());
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Grid resolution for sampling (50–200)
  const [grid, setGrid] = useState(100);

  const [textAlign, setTextAlign] = useState<TextAlignment>('center');

  // Font management
  const {
    customFonts,
    currentFont,
    customFontStyles,
    setCurrentFont,
    handleFontUpload,
    updateCustomFontStyles
  } = useFontManager();

  // history for gradient+textColor
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const prevRef = useRef<HistoryEntry>({ gradient: baseGradient, textColor });
  const skipHistory = useRef(false);

  // preview split
  const [previewMode, setPreviewMode] = useState<'gradient' | 'imageSplit'>('gradient');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (skipHistory.current) {
      skipHistory.current = false;
    } else {
      const prev = prevRef.current;
      if (prev.gradient !== baseGradient || prev.textColor !== textColor) {
        setPast((p) => [...p, prev]);
        setFuture([]);
      }
    }
    prevRef.current = { gradient: baseGradient, textColor };
  }, [baseGradient, textColor]);

  const undo = () => {
    setPast((p) => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [{ gradient: baseGradient, textColor }, ...f]);
      skipHistory.current = true;
      setBaseGradient(prev.gradient);
      setGradient(prev.gradient);
      setTextColor(prev.textColor);
      return p.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const nxt = f[0];
      setPast((p) => [...p, { gradient: baseGradient, textColor }]);
      skipHistory.current = true;
      setBaseGradient(nxt.gradient);
      setGradient(nxt.gradient);
      setTextColor(nxt.textColor);
      return f.slice(1);
    });
  };

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
    setBaseGradient(item.gradient);
    setGradient(item.gradient);
    setActiveSuggestionCss(null);
    setTextColor(item.textColor);
  };

  // Regenerate suggestions only when committed gradient or text color changes
  useEffect(() => {
    setTextSuggestions(suggestTextColors(baseGradient));
    setGradientFixes(suggestGradientFixes(baseGradient, textColor, grid));
  }, [baseGradient, textColor, grid]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-semibold">Contrast Checker</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={past.length === 0}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-100 disabled:opacity-30"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={future.length === 0}
            className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-100 disabled:opacity-30"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(baseGradient);
              toast.success('Gradient CSS copied');
            }}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-100"
          >
            <Clipboard className="w-4 h-4" />
            Copy CSS
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode(previewMode === 'gradient' ? 'imageSplit' : 'gradient')}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-100"
          >
            {previewMode === 'gradient' ? 'Image Split' : 'Gradient Only'}
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-100"
          >
            <Menu className="w-4 h-4" />
            Saved Gradients
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[350px] overflow-y-auto border-r bg-white p-4">
          {/* Editing in editor commits immediately */}
          <GradientEditor
            gradient={gradient}
            onChange={(css) => {
              setGradient(css);
              if (activeSuggestionCss === null) {
                // direct edit – commit immediately
                setBaseGradient(css);
              }
            }}
          />
          <TextSettings
            headline={headline}
            onHeadlineChange={setHeadline}
            paragraph={paragraph}
            onParagraphChange={setParagraph}
            textColor={textColor}
            onTextColorChange={setTextColor}
            textAlign={textAlign}
            onTextAlignChange={setTextAlign}
            currentFont={currentFont}
            onFontChange={setCurrentFont}
            customFonts={customFonts}
            onFontUpload={handleFontUpload}
            customFontStyles={customFontStyles}
            onCustomFontStyleChange={updateCustomFontStyles}
          />
        </aside>

        {/* Center content */}
        <section className="flex-1 overflow-y-auto p-6">
          <div className="w-full rounded-lg border flex flex-col h-full">
            {/* Gradient Preview */}
            <div className="relative h-80 border-b group">
              <button
                type="button"
                onClick={() => setShowOverlay((v) => !v)}
                className="absolute top-2 right-2 z-20 p-2 text-gray-600 hover:text-gray-900"
                title="Toggle overlay"
              >
                <Tooltip content="Toggle heat-map overlay">
                  <Layers className="w-4 h-4" />
                </Tooltip>
              </button>
              <div className="absolute inset-0 pointer-events-none">
                {previewMode === 'gradient' ? (
                  <div className="relative h-full">
                    <GradientCanvas
                      gradient={gradient}
                      textColor={textColor}
                      grid={grid}
                      showOverlay={showOverlay}
                      onAnalysis={setAnalysis}
                      className="h-full"
                    />
                    <TextOverlay
                      headline={headline}
                      paragraph={paragraph}
                      textColor={textColor}
                      textAlign={textAlign}
                      currentFont={currentFont}
                      customFonts={customFonts}
                      customFontStyles={customFontStyles}
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full flex-col md:flex-row">
                    {/* Image half */}
                    <div className="w-full md:w-1/2 h-1/2 md:h-full relative group">
                      {previewImage ? (
                        <>
                          <img src={previewImage} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <label className="cursor-pointer px-3 py-2 bg-white/90 rounded-md text-sm hover:bg-white pointer-events-auto">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => setPreviewImage(ev.target?.result as string);
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              Replace Image
                            </label>
                          </div>
                        </>
                      ) : (
                        <label className="w-full h-full flex items-center justify-center border-dashed border-2 text-xs cursor-pointer" style={{ pointerEvents: 'auto' }}>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setPreviewImage(ev.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          Upload Image
                        </label>
                      )}
                    </div>
                    {/* Gradient half */}
                    <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
                      <GradientCanvas
                        gradient={gradient}
                        textColor={textColor}
                        grid={grid}
                        showOverlay={showOverlay}
                        onAnalysis={setAnalysis}
                        className="h-full w-full"
                      />
                      <TextOverlay
                        headline={headline}
                        paragraph={paragraph}
                        textColor={textColor}
                        textAlign={textAlign}
                        currentFont={currentFont}
                        customFonts={customFonts}
                        customFontStyles={customFontStyles}
                      />
                    </div>
                  </div>
                )}
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

            {/* Grid resolution slider (visible only when overlay is on) */}
            {showOverlay && (
              <div className="px-4 py-2 flex items-center gap-2 text-xs border-b">
                <span>Grid:</span>
                <input
                  type="range"
                  min={50}
                  max={200}
                  step={10}
                  value={grid}
                  onChange={(e) => setGrid(Number(e.target.value))}
                  className="flex-1"
                />
                <span>{grid}×{grid}</span>
              </div>
            )}

            {/* Suggestions content */}
            <div className="p-4 flex-1 overflow-y-auto grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  gradientFixes.map((g) => {
                    const isActive = activeSuggestionCss === g.css;
                    return (
                      <div
                        key={g.css}
                        onClick={() => {
                          if (!isActive) {
                            setGradient(g.css);
                            setActiveSuggestionCss(g.css);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={`border rounded-md flex flex-col overflow-hidden cursor-pointer focus:outline-none ${isActive ? 'ring-2 ring-emerald-500' : 'hover:bg-gray-50'}`}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && !isActive) {
                            setGradient(g.css);
                            setActiveSuggestionCss(g.css);
                          }
                        }}
                      >
                        <div className="h-24" style={{ background: g.css }} />
                        <div className="p-2 text-xs flex justify-between items-center">
                          <span>Min {g.minRatio.toFixed(1)}:1</span>
                          <Tooltip content={g.minRatio >= 7 ? 'Contrast ≥ 7:1 (AAA)' : g.minRatio >= 4.5 ? 'Contrast ≥ 4.5:1 (AA)' : 'Below AA'}>
                            <span className={`px-1 rounded ${g.minRatio >= 7 ? 'bg-emerald-100 text-emerald-700' : g.minRatio >= 4.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{g.minRatio >= 7 ? 'AAA' : g.minRatio >= 4.5 ? 'AA' : 'Fail'}</span>
                          </Tooltip>
                          {g.guaranteed && (
                            <Tooltip content="Always passes AA with current text color">
                              <span className="ml-2 text-[10px] text-emerald-700 bg-emerald-50 px-1 rounded">Guaranteed</span>
                            </Tooltip>
                          )}
                        </div>

                        {isActive ? (
                          <div className="flex text-xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBaseGradient(g.css);
                                setActiveSuggestionCss(null);
                              }}
                              className="flex-1 border-t py-1 text-emerald-700 hover:bg-emerald-50"
                            >
                              Apply
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGradient(baseGradient);
                                setActiveSuggestionCss(null);
                              }}
                              className="flex-1 border-t py-1 text-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
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