'use client'

import { useTheme, isSakuraTheme } from '@/contexts/ThemeContext'

export default function SakuraHeaderDecor() {
  const { theme } = useTheme()

  if (!isSakuraTheme(theme)) return null

  const isDark = theme === 'sakura-dark'
  const branchColor = isDark ? '#504548' : '#b03860'
  const blossomColor = isDark ? '#e8899e' : '#e8638a'
  const petalColor = isDark ? '#c8889a' : '#f0a0b8'
  const opacity = isDark ? 0.1 : 0.15

  return (
    <div className="absolute left-0 top-0 h-full pointer-events-none overflow-hidden" style={{ width: '140px' }} aria-hidden="true">
      <svg viewBox="0 0 140 56" className="h-full w-full" fill="none" opacity={opacity}>
        {/* Branch */}
        <path d="M-10 48 Q20 40 50 35 Q80 30 110 22 Q125 18 140 16" stroke={branchColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M50 35 Q55 25 60 20" stroke={branchColor} strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M90 26 Q95 18 98 12" stroke={branchColor} strokeWidth="1" fill="none" strokeLinecap="round" />
        {/* Blossoms */}
        {[
          [30, 38, 4], [48, 33, 3.5], [62, 18, 3],
          [78, 28, 4], [100, 22, 3.5], [98, 10, 3],
          [120, 18, 3], [15, 44, 3],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={blossomColor} opacity={0.5 + (i % 3) * 0.15} />
        ))}
        {/* Tiny petals */}
        {[
          [38, 30, 2], [70, 24, 2], [110, 16, 2],
        ].map(([cx, cy, r], i) => (
          <circle key={`p${i}`} cx={cx} cy={cy} r={r} fill={petalColor} opacity={0.4} />
        ))}
      </svg>
    </div>
  )
}
