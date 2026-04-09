import { useContext } from 'react';

import { ThemeContext } from '../context/themeContextInstance.js';

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};
