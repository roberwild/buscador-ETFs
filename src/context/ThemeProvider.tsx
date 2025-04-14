'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider')
  }
  return context
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [theme, setTheme] = useState<Theme>('light')

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  // Inicializar tema desde localStorage, pero siempre usar 'light' como predeterminado
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null
    if (storedTheme) {
      setTheme(storedTheme)
    }
    // Ya no usamos la preferencia del sistema para el tema inicial
    // siempre será 'light' por defecto
  }, [])

  // Aplicar clase dark al html cuando cambia el tema
  useEffect(() => {
    const root = window.document.documentElement
    const oldTheme = theme === 'dark' ? 'light' : 'dark'
    
    root.classList.remove(oldTheme)
    root.classList.add(theme)
    
    localStorage.setItem('theme', theme)
  }, [theme])

  const value = {
    theme,
    setTheme,
    toggleTheme
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
} 