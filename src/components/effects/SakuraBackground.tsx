'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function SakuraBackground() {
  const { theme } = useTheme()

  if (theme === 'sakura-light') return <SakuraLightBg />
  if (theme === 'sakura-dark') return <SakuraDarkBg />
  if (theme === 'raibo') return <RaiboBg />
  return null
}

function SakuraLightBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Background image — sakura claro */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(https://doepwastkhrnextkgjdj.supabase.co/storage/v1/object/public/assets/1490470c-db42-417a-ab3a-18aa061cd9fa/sakura-claro.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.7,
          filter: 'blur(3px)',
        }}
      />

      {/* Sky gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(255,247,248,0.85) 0%, rgba(255,232,238,0.7) 40%, rgba(255,212,222,0.6) 70%, rgba(255,196,210,0.7) 100%)',
        }}
      />

    </div>
  )
}

function SakuraDarkBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Dark base */}
      <div className="absolute inset-0" style={{ background: '#050404' }} />

      {/* Moon glow behind header — soft, faint light spreading from top center */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: '-60px',
          width: '500px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(232,137,158,0.12) 0%, rgba(232,137,158,0.04) 40%, transparent 70%)',
        }}
      />

      {/* Subtle second glow layer — wider, fainter */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: '-40px',
          width: '800px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(200,160,170,0.06) 0%, transparent 60%)',
        }}
      />

    </div>
  )
}

function RaiboBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Pure black base */}
      <div className="absolute inset-0" style={{ background: '#040404' }} />

      {/* Very subtle rainbow glow at top */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          top: '-100px',
          width: '100%',
          height: '300px',
          background: 'linear-gradient(90deg, rgba(232,84,107,0.04) 0%, rgba(245,183,49,0.03) 33%, rgba(61,201,110,0.03) 66%, rgba(75,168,219,0.04) 100%)',
          filter: 'blur(60px)',
        }}
      />
    </div>
  )
}
