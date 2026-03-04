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

      {/* Far mountains */}
      <svg
        className="absolute bottom-0 w-full"
        style={{ height: '45%' }}
        viewBox="0 0 1440 400"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M0 400 L0 280 Q120 180 240 240 Q400 140 520 200 Q650 100 780 180 Q900 80 1020 160 Q1150 60 1260 140 Q1360 100 1440 160 L1440 400Z"
          fill="#f8c8d4"
          opacity="0.3"
        />
        <path
          d="M0 400 L0 310 Q100 230 220 280 Q360 190 480 250 Q580 170 720 230 Q860 140 980 210 Q1100 130 1220 200 Q1340 160 1440 200 L1440 400Z"
          fill="#f0b0c0"
          opacity="0.25"
        />
        <path
          d="M0 400 L0 340 Q80 280 200 320 Q340 250 460 300 Q560 240 700 280 Q840 210 960 270 Q1080 220 1200 260 Q1320 230 1440 260 L1440 400Z"
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
