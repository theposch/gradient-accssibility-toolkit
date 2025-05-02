import { useState } from 'react';
import { CustomFont, CustomFontStyles } from '@/types';
import { toast } from 'sonner';

const DEFAULT_FONT_STYLES: CustomFontStyles = {
  headlineSize: '3rem',
  headlineHeight: '1.2',
  headlineSpacing: '0',
  paragraphSize: '0.875rem',
  paragraphHeight: '1.5',
  paragraphSpacing: '0',
};

export function useFontManager() {
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [currentFont, setCurrentFont] = useState<string>('system-ui');
  const [customFontStyles, setCustomFontStyles] = useState<CustomFontStyles>(DEFAULT_FONT_STYLES);

  const handleFontUpload = async (file: File) => {
    try {
      // Create object URL for the font file
      const url = URL.createObjectURL(file);
      
      // Create a name for the font (use filename without extension)
      const name = file.name.replace(/\.[^/.]+$/, "");
      
      // Create and load the font
      const font = new FontFace(name, `url(${url})`);
      const loadedFont = await font.load();
      
      // Add font to document
      document.fonts.add(loadedFont);
      
      // Update state
      setCustomFonts(prev => [...prev, { name, url }]);
      setCurrentFont(name);
      
      toast.success(`Font "${name}" loaded successfully`);
    } catch (error) {
      console.error('Error loading font:', error);
      toast.error('Failed to load font');
    }
  };

  const updateCustomFontStyles = (styles: Partial<CustomFontStyles>) => {
    setCustomFontStyles(prev => ({ ...prev, ...styles }));
  };

  const isCustomFont = customFonts.some(f => f.name === currentFont);

  return {
    customFonts,
    currentFont,
    customFontStyles,
    isCustomFont,
    setCurrentFont,
    handleFontUpload,
    updateCustomFontStyles,
  };
}

export default useFontManager; 