'use client'

import { useTheme, isSakuraTheme } from '@/contexts/ThemeContext'

export default function SakuraPetals() {
  const { theme } = useTheme()

  if (!isSakuraTheme(theme)) return null

  const isDark = theme === 'sakura-dark'
  const petalColor = isDark ? 'rgba(255,183,197,0.6)' : 'rgba(255,140,160,0.5)'

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="sakura-petal absolute"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 12}s`,
            animationDuration: `${8 + Math.random() * 8}s`,
            // @ts-expect-error custom CSS property
            '--petal-color': petalColor,
            '--drift': `${-40 + Math.random() * 80}px`,
            '--spin': `${Math.random() * 360}deg`,
          }}
        />
      ))}
    </div>
  )
}
