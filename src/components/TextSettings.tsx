import { FC } from 'react';

interface Props {
  headline: string;
  onHeadlineChange: (v: string) => void;
  paragraph: string;
  onParagraphChange: (v: string) => void;
  textColor: string;
  onTextColorChange: (v: string) => void;
  textAlign: 'left' | 'center' | 'right';
  onTextAlignChange: (v: 'left' | 'center' | 'right') => void;
}

const TextSettings: FC<Props> = ({
  headline,
  onHeadlineChange,
  paragraph,
  onParagraphChange,
  textColor,
  onTextColorChange,
  textAlign,
  onTextAlignChange,
}) => (
  <div className="space-y-4 mt-8">
    <h2 className="font-medium">Text Settings</h2>
    <div className="space-y-2 text-sm">
      <label className="block">
        <span className="block mb-1">Headline</span>
        <input
          type="text"
          value={headline}
          onChange={(e) => onHeadlineChange(e.target.value)}
          className="w-full border rounded px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="block mb-1">Paragraph</span>
        <textarea
          value={paragraph}
          onChange={(e) => onParagraphChange(e.target.value)}
          className="w-full border rounded px-2 py-1 h-20 resize-none"
        />
      </label>
      <label className="block flex items-center gap-2">
        <span>Text Color</span>
        <input
          type="color"
          value={textColor}
          onChange={(e) => onTextColorChange(e.target.value)}
          className="h-6 w-6 p-0 border"
        />
        <input
          type="text"
          value={textColor}
          onChange={(e) => onTextColorChange(e.target.value)}
          className="w-24 border rounded px-1"
        />
      </label>
      <div className="flex items-center gap-2 text-xs">
        <span>Align:</span>
        {(['left', 'center', 'right'] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onTextAlignChange(opt)}
            className={`px-2 py-1 border rounded ${textAlign === opt ? 'bg-gray-200' : 'hover:bg-gray-50'}`}
          >
            {opt.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default TextSettings; 