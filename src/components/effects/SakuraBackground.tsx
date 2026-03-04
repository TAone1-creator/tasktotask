'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function SakuraBackground() {
  const { theme } = useTheme()

  if (theme !== 'sakura-light') return null

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #fff7f8 0%, #ffe8ee 40%, #ffd4de 70%, #ffc4d2 100%)',
        }}
      />

      {/* Moon */}
      <div
        className="absolute"
        style={{
          top: '8%',
          right: '12%',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ffffff 0%, #fff0f3 60%, #ffe0e8 100%)',
          opacity: 0.7,
          boxShadow: '0 0 40px 10px rgba(255,220,230,0.4)',
        }}
      />

      {/* Mountains — Fuji-style pointed peaks */}
      <svg
        className="absolute bottom-0 w-full"
        style={{ height: '45%' }}
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        fill="none"
      >
        {/* Far layer — tallest peaks */}
        <path
          d="M0 400 L0 320 L80 280 L180 120 L220 100 L260 120 L360 260 L440 300 L520 240 L620 80 L660 55 L700 80 L800 220 L880 280 L960 200 L1060 60 L1100 40 L1140 60 L1240 200 L1320 280 L1380 240 L1440 260 L1440 400Z"
          fill="#f8c8d4"
          opacity="0.3"
        />
        {/* Snow caps on far peaks */}
        <path d="M180 120 L220 100 L260 120 L240 115 L220 108 L200 115Z" fill="#ffffff" opacity="0.25" />
        <path d="M620 80 L660 55 L700 80 L685 75 L660 63 L635 75Z" fill="#ffffff" opacity="0.25" />
        <path d="M1060 60 L1100 40 L1140 60 L1125 55 L1100 48 L1075 55Z" fill="#ffffff" opacity="0.25" />

        {/* Mid layer */}
        <path
          d="M0 400 L0 340 L100 300 L200 180 L240 155 L280 180 L380 280 L460 310 L540 260 L640 140 L680 115 L720 140 L820 260 L900 310 L1000 240 L1100 130 L1140 105 L1180 130 L1280 250 L1360 310 L1440 290 L1440 400Z"
          fill="#f0b0c0"
          opacity="0.25"
        />

        {/* Near layer — smaller foothills */}
        <path
          d="M0 400 L0 360 L120 330 L220 260 L260 240 L300 260 L400 320 L500 350 L580 310 L680 230 L720 210 L760 230 L860 310 L940 350 L1040 300 L1140 220 L1180 200 L1220 220 L1320 300 L1400 350 L1440 340 L1440 400Z"
          fill="#e8a0b4"
          opacity="0.2"
        />
      </svg>

      {/* Sakura tree silhouette — right side */}
      <svg
        className="absolute bottom-0 right-0"
        style={{ height: '55%', width: '200px' }}
        viewBox="0 0 200 400"
        fill="none"
        opacity="0.12"
      >
        {/* Trunk */}
        <path
          d="M170 400 Q165 350 160 300 Q155 260 148 230 Q140 200 135 180"
          stroke="#8a4a5c"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        {/* Branch left */}
        <path
          d="M148 230 Q120 210 90 200 Q60 195 40 200"
          stroke="#8a4a5c"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        {/* Branch right */}
        <path
          d="M155 260 Q170 240 185 235"
          stroke="#8a4a5c"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Branch top */}
        <path
          d="M135 180 Q115 150 100 140 Q80 130 60 135"
          stroke="#8a4a5c"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        {/* Blossom clusters */}
        {[
          [40, 200], [55, 195], [70, 198], [90, 195],
          [60, 135], [75, 130], [95, 138], [100, 128],
          [185, 230], [178, 238],
          [135, 175], [125, 168], [115, 158],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={8 + (i % 3) * 2} fill="#e8638a" opacity={0.3 + (i % 3) * 0.1} />
        ))}
      </svg>

      {/* Small sakura branch — left side */}
      <svg
        className="absolute bottom-0 left-0"
        style={{ height: '30%', width: '120px' }}
        viewBox="0 0 120 250"
        fill="none"
        opacity="0.08"
      >
        <path
          d="M10 250 Q20 200 30 170 Q35 150 40 140"
          stroke="#8a4a5c"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M35 165 Q55 150 70 148 Q85 146 100 150"
          stroke="#8a4a5c"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M40 140 Q50 120 65 115"
          stroke="#8a4a5c"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {[
          [70, 145], [85, 143], [100, 148],
          [50, 125], [65, 112],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={6 + (i % 2) * 2} fill="#e8638a" opacity={0.25} />
        ))}
      </svg>
    </div>
  )
}
