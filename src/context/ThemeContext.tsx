import {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from 'react'

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

interface ThemeProviderProps {
  children: ReactNode
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = localStorage.getItem('repairms_theme')
    return stored !== null ? stored === 'dark' : true
  })

  useEffect(() => {
    const root = document.documentElement

    if (isDark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }

    localStorage.setItem('repairms_theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      toggleTheme: () => setIsDark((currentValue) => !currentValue),
    }),
    [isDark],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
