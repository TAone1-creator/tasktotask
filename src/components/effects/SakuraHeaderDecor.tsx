'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function SakuraHeaderDecor() {
  const { theme } = useTheme()

  if (theme !== 'sakura-light') return null

  return (
    <div className="absolute left-0 top-0 h-full pointer-events-none overflow-hidden" style={{ width: '140px' }} aria-hidden="true">
      <svg viewBox="0 0 140 56" className="h-full w-full" fill="none" opacity="0.15">
        {/* Branch */}
        <path
          d="M-10 48 Q20 40 50 35 Q80 30 110 22 Q125 18 140 16"
          stroke="#b03860"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Small sub-branch */}
        <path
          d="M50 35 Q55 25 60 20"
          stroke="#b03860"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M90 26 Q95 18 98 12"
          stroke="#b03860"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
        />
        {/* Blossoms */}
        {[
          [30, 38, 4], [48, 33, 3.5], [62, 18, 3],
          [78, 28, 4], [100, 22, 3.5], [98, 10, 3],
          [120, 18, 3], [15, 44, 3],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="#e8638a" opacity={0.5 + (i % 3) * 0.15} />
        ))}
        {/* Tiny petals */}
        {[
          [38, 30, 2], [70, 24, 2], [110, 16, 2],
        ].map(([cx, cy, r], i) => (
          <circle key={`p${i}`} cx={cx} cy={cy} r={r} fill="#f0a0b8" opacity={0.4} />
        ))}
      </svg>
    </div>
  )
}
