import { FC } from 'react';

interface Props {
  headline: string;
  onHeadlineChange: (text: string) => void;
  paragraph: string;
  onParagraphChange: (text: string) => void;
  textColor: string;
  onTextColorChange: (color: string) => void;
  textAlign: 'left' | 'center' | 'right';
  onTextAlignChange: (align: 'left' | 'center' | 'right') => void;
  currentFont: string;
  onFontChange: (font: string) => void;
  customFonts: Array<{ name: string; url: string }>;
  onFontUpload: (file: File) => void;
  customFontStyles: {
    headlineSize: string;
    headlineHeight: string;
    headlineSpacing: string;
    paragraphSize: string;
    paragraphHeight: string;
    paragraphSpacing: string;
  };
  onCustomFontStyleChange: (styles: Partial<Props['customFontStyles']>) => void;
}

const SYSTEM_FONTS = [
  'system-ui',
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New'
];

const TextSettings: FC<Props> = ({
  headline,
  onHeadlineChange,
  paragraph,
  onParagraphChange,
  textColor,
  onTextColorChange,
  textAlign,
  onTextAlignChange,
  currentFont,
  onFontChange,
  customFonts,
  onFontUpload,
  customFontStyles,
  onCustomFontStyleChange,
}) => {
  const isCustomFont = customFonts.some(f => f.name === currentFont);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm mb-1">Font</label>
        <div className="flex gap-2">
          <select
            value={currentFont}
            onChange={(e) => onFontChange(e.target.value)}
            className="flex-1 border rounded px-2 py-1 text-sm"
          >
            <optgroup label="System Fonts">
              {SYSTEM_FONTS.map(font => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </optgroup>
            {customFonts.length > 0 && (
              <optgroup label="Custom Fonts">
                {customFonts.map(font => (
                  <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                    {font.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <label className="px-2 py-1 border rounded text-sm hover:bg-gray-50 cursor-pointer">
            Upload
            <input
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFontUpload(file);
              }}
            />
          </label>
        </div>
      </div>

      {isCustomFont && (
        <>
          <div className="space-y-3 border-t pt-3">
            <label className="block text-sm font-medium">Headline Typography</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs mb-1 text-gray-500">Size</label>
                <input
                  type="text"
                  value={customFontStyles.headlineSize}
                  onChange={(e) => onCustomFontStyleChange({ headlineSize: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-500">Line Height</label>
                <input
                  type="number"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={customFontStyles.headlineHeight}
                  onChange={(e) => onCustomFontStyleChange({ headlineHeight: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-500">Letter Spacing</label>
                <input
                  type="text"
                  value={customFontStyles.headlineSpacing}
                  onChange={(e) => onCustomFontStyleChange({ headlineSpacing: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-3">
            <label className="block text-sm font-medium">Paragraph Typography</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs mb-1 text-gray-500">Size</label>
                <input
                  type="text"
                  value={customFontStyles.paragraphSize}
                  onChange={(e) => onCustomFontStyleChange({ paragraphSize: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-500">Line Height</label>
                <input
                  type="number"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={customFontStyles.paragraphHeight}
                  onChange={(e) => onCustomFontStyleChange({ paragraphHeight: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-500">Letter Spacing</label>
                <input
                  type="text"
                  value={customFontStyles.paragraphSpacing}
                  onChange={(e) => onCustomFontStyleChange({ paragraphSpacing: e.target.value })}
                  className="w-full border rounded px-2 py-1 text-sm"
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm mb-1">Text Color</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            className="h-8 w-8 border p-0"
          />
          <input
            type="text"
            value={textColor}
            onChange={(e) => onTextColorChange(e.target.value)}
            className="flex-1 border rounded px-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Text Align</label>
        <div className="flex gap-1 border rounded overflow-hidden">
          <button
            type="button"
            onClick={() => onTextAlignChange('left')}
            className={`flex-1 py-1 ${textAlign === 'left' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            Left
          </button>
          <button
            type="button"
            onClick={() => onTextAlignChange('center')}
            className={`flex-1 py-1 ${textAlign === 'center' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            Center
          </button>
          <button
            type="button"
            onClick={() => onTextAlignChange('right')}
            className={`flex-1 py-1 ${textAlign === 'right' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            Right
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Headline</label>
        <textarea
          value={headline}
          onChange={(e) => onHeadlineChange(e.target.value)}
          className="w-full border rounded px-2 py-1"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Paragraph</label>
        <textarea
          value={paragraph}
          onChange={(e) => onParagraphChange(e.target.value)}
          className="w-full border rounded px-2 py-1"
          rows={4}
        />
      </div>
    </div>
  );
};

export default TextSettings; 