'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

export type ThemeId = 'light' | 'dark'

export interface ThemePreset {
  id: ThemeId
  name: string
  description: string
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'light', name: 'Claro', description: 'Tema padrão claro' },
  { id: 'dark', name: 'Escuro', description: 'Tema escuro' },
]

interface ThemeContextType {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  presets: ThemePreset[]
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const STORAGE_KEY = 'tasktotask-theme'

function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('light')

  // On mount, read from localStorage (the inline script already set the attribute)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null
    if (stored && THEME_PRESETS.some(p => p.id === stored)) {
      setThemeState(stored)
      applyTheme(stored)
    }
  }, [])

  const setTheme = useCallback((newTheme: ThemeId) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
    applyTheme(newTheme)
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, presets: THEME_PRESETS }),
    [theme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
