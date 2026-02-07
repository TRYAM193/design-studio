import { useEffect } from 'react';
import { FONTS } from '@/data/font';

export default function FontLoader() {
  useEffect(() => {
    // 1. Build the Google Fonts Query String
    // Format: Family:ital,wght@0,400;0,700;1,400;1,700
    const families = Object.entries(FONTS).map(([family, config]) => {
      // Base styles: Regular (400)
      let styles = ['0,400'];

      // Add Bold (700) if supported
      if (config.bold) styles.push('0,700');

      // Add Italic (400 italic) if supported
      if (config.italic) styles.push('1,400');

      // Add Bold Italic (700 italic) if both supported
      if (config.bold && config.italic) styles.push('1,700');

      // Sort and join styles
      const styleString = styles.sort().join(';');
      
      // Google Fonts URL format
      return `${family.replace(/ /g, '+')}:ital,wght@${styleString}`;
    });

    const query = families.join('&family=');
    const href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;

    // 2. Inject into <head>
    const linkId = 'dynamic-google-fonts';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.href = href;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      
      console.log("🔤 Google Fonts Loaded:", Object.keys(FONTS).length, "fonts");
    }
  }, []);

  return null; // This component renders nothing visible
}