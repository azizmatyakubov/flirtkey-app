import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import { Theme } from '../types';
import { darkTheme, lightTheme } from '../constants/theme';
import { useSettingsStore, ThemeMode } from '../stores/settingsStore';

// ==========================================
// Context Types
// ==========================================

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// ==========================================
// Context
// ==========================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ==========================================
// Provider
// ==========================================

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const { themeMode, setThemeMode } = useSettingsStore();
  const [currentScheme, setCurrentScheme] = useState(systemColorScheme);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setCurrentScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  // Calculate the actual theme based on mode
  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return currentScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, currentScheme]);

  const theme = useMemo(() => {
    return isDark ? darkTheme : lightTheme;
  }, [isDark]);

  const toggleTheme = () => {
    if (themeMode === 'dark') {
      setThemeMode('light');
    } else if (themeMode === 'light') {
      setThemeMode('system');
    } else {
      setThemeMode('dark');
    }
  };

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      isDark,
      setThemeMode,
      toggleTheme,
    }),
    [theme, themeMode, isDark, setThemeMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ==========================================
// Hook
// ==========================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// ==========================================
// HOC for class components (if needed)
// ==========================================

export function withTheme<P extends object>(
  Component: React.ComponentType<P & { theme: Theme; isDark: boolean }>
) {
  return function ThemedComponent(props: P) {
    const { theme, isDark } = useTheme();
    return <Component {...props} theme={theme} isDark={isDark} />;
  };
}
