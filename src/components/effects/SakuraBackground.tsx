'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function SakuraBackground() {
  const { theme } = useTheme()

  if (theme === 'sakura-light') return <SakuraLightBg />
  if (theme === 'sakura-dark') return <SakuraDarkBg />
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
          filter: 'blur(5px)',
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
