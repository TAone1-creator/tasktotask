'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { User, LogOut, Sun, Moon, Flower2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, THEME_PRESETS, type ThemeId } from '@/contexts/ThemeContext'
import SakuraHeaderDecor from '@/components/effects/SakuraHeaderDecor'
import type { Profile } from '@/types/database'

function ThemeIcon({ themeIcon, size = 14 }: { themeIcon: string; size?: number }) {
  if (themeIcon === 'sun') return <Sun size={size} />
  if (themeIcon === 'moon') return <Moon size={size} />
  return <Flower2 size={size} />
}

function CurrentIcon({ theme }: { theme: ThemeId }) {
  if (theme === 'dark') return <Moon size={16} />
  if (theme === 'sakura-light' || theme === 'sakura-dark') return <Flower2 size={16} />
  return <Sun size={16} />
}

export default function Header({ profile }: { profile: Profile | null }) {
  const { supabase, avatarUrl } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [themeOpen, setThemeOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fullName = profile?.full_name || 'Usuário'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setThemeOpen(false)
      }
    }
    if (themeOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [themeOpen])

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/60 relative">
      <SakuraHeaderDecor />
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-10 relative z-10">
        {/* Left: Greeting */}
        <div className="flex items-center min-w-0">
          <p className="text-sm text-gray-700 truncate">
            Olá, <span className="font-semibold text-gray-900">{fullName}</span>!
          </p>
        </div>

        {/* Center: Logo */}
        <Link href="/dashboard" className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-base font-bold tracking-tight text-gray-900">
            task<span className="text-gray-400">to</span>task
          </h1>
        </Link>

        {/* Right: Theme + Profile + Logout */}
        <div className="flex items-center gap-1">
          {/* Theme Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Trocar tema"
            >
              <CurrentIcon theme={theme} />
            </button>
            {themeOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg shadow-black/[0.08] py-1 animate-scale-in z-50">
                {THEME_PRESETS.map((preset) => {
                  const isActive = theme === preset.id
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setTheme(preset.id)
                        setThemeOpen(false)
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'text-gray-900 bg-gray-50 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <ThemeIcon themeIcon={preset.icon} />
                      <span>{preset.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <Link
            href="/perfil"
            className="flex items-center gap-2 px-2 py-1 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={14} className="text-gray-400" />
              )}
            </div>
            <span className="hidden sm:inline text-xs font-medium">Perfil</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
