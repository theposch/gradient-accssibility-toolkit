import { FC } from 'react';

interface TextOverlayProps {
  headline: string;
  paragraph: string;
  textColor: string;
  textAlign: 'left' | 'center' | 'right';
  currentFont: string;
  customFonts: Array<{ name: string; url: string }>;
  customFontStyles: {
    headlineSize: string;
    headlineHeight: string;
    headlineSpacing: string;
    paragraphSize: string;
    paragraphHeight: string;
    paragraphSpacing: string;
  };
}

export const TextOverlay: FC<TextOverlayProps> = ({
  headline,
  paragraph,
  textColor,
  textAlign,
  currentFont,
  customFonts,
  customFontStyles,
}) => {
  const isCustomFont = customFonts.some(f => f.name === currentFont);
  
  return (
    <div
      className={`absolute inset-0 select-none px-4 flex flex-col justify-center ${
        textAlign === 'left' 
          ? 'items-start' 
          : textAlign === 'center' 
          ? 'items-center' 
          : 'items-end'
      }`}
    >
      <h1 
        className="text-5xl font-semibold tracking-wide" 
        style={{ 
          color: textColor, 
          textAlign, 
          fontFamily: currentFont,
          ...(isCustomFont ? {
            fontSize: customFontStyles.headlineSize,
            lineHeight: customFontStyles.headlineHeight,
            letterSpacing: customFontStyles.headlineSpacing,
          } : {})
        }}
      >
        {headline}
      </h1>
      <p 
        className="max-w-xl mt-4 text-sm leading-relaxed" 
        style={{ 
          color: textColor, 
          textAlign, 
          fontFamily: currentFont,
          ...(isCustomFont ? {
            fontSize: customFontStyles.paragraphSize,
            lineHeight: customFontStyles.paragraphHeight,
            letterSpacing: customFontStyles.paragraphSpacing,
          } : {})
        }}
      >
        {paragraph}
      </p>
    </div>
  );
};

export default TextOverlay; 