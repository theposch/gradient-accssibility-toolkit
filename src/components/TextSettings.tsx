import { FC } from 'react';

interface Props {
  headline: string;
  onHeadlineChange: (v: string) => void;
  paragraph: string;
  onParagraphChange: (v: string) => void;
  textColor: string;
  onTextColorChange: (v: string) => void;
}

const TextSettings: FC<Props> = ({
  headline,
  onHeadlineChange,
  paragraph,
  onParagraphChange,
  textColor,
  onTextColorChange,
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
    </div>
  </div>
);

export default TextSettings; 