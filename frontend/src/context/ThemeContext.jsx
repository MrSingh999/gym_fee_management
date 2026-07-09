import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const frameId = requestAnimationFrame(() => {
      if (theme === 'light') {
        root.classList.remove('dark');
        root.classList.add('light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
      }
    });
    localStorage.setItem('theme', theme);
    return () => cancelAnimationFrame(frameId);
  }, [theme]);

  const toggleTheme = () => {
    const root = window.document.documentElement;
    // Enable smooth transitions on ALL elements during the switch
    root.classList.add('theme-transitioning');
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    // Remove the transition class after animation completes to avoid perf overhead
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 400);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
