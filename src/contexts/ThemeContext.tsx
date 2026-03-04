'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

export type ThemeId = 'light' | 'dark' | 'sakura-light' | 'sakura-dark' | 'raibo'

export interface ThemePreset {
  id: ThemeId
  name: string
  description: string
  icon: 'sun' | 'moon' | 'flower' | 'flower-dark' | 'rainbow'
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'light', name: 'Claro', description: 'Tema padrão', icon: 'sun' },
  { id: 'dark', name: 'Escuro', description: 'Tema escuro', icon: 'moon' },
  { id: 'sakura-light', name: 'Sakura', description: 'Cerejeira claro', icon: 'flower' },
  { id: 'sakura-dark', name: 'Sakura Dark', description: 'Cerejeira escuro', icon: 'flower-dark' },
  { id: 'raibo', name: 'Raibo', description: 'Escuro com cores vibrantes', icon: 'rainbow' },
]

export function isSakuraTheme(theme: ThemeId) {
  return theme === 'sakura-light' || theme === 'sakura-dark'
}

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
