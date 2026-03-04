'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'
import { getLevelInfo } from '@/lib/gamification'
import { useAuth } from '@/hooks/useAuth'
import type { Profile } from '@/types/database'

export default function Header({ profile }: { profile: Profile | null }) {
  const { supabase } = useAuth()
  const router = useRouter()

  const levelInfo = profile ? getLevelInfo(profile.xp) : null
  const firstName = profile?.full_name?.split(' ')[0] || 'Usuario'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-10">
        {/* Left: Greeting + Level */}
        <div className="flex items-center gap-4 min-w-0">
          <p className="text-sm text-gray-700 truncate">
            Ola, <span className="font-semibold text-gray-900">{firstName}</span>
          </p>
          {levelInfo && (
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2.5 py-1">
                <span className="text-[10px] font-bold text-gray-900">Nv {levelInfo.currentLevel.level}</span>
                <span className="text-[10px] text-gray-500 hidden md:inline">{levelInfo.currentLevel.name}</span>
              </div>
              <div className="w-24 bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-gray-900 h-1.5 rounded-full transition-all"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{profile!.xp} XP</span>
            </div>
          )}
        </div>

        {/* Center: Logo */}
        <Link href="/dashboard" className="absolute left-1/2 -translate-x-1/2">
          <h1 className="text-base font-bold tracking-tight text-gray-900">
            task<span className="text-gray-400">to</span>task
          </h1>
        </Link>

        {/* Right: Profile + Logout */}
        <div className="flex items-center gap-1">
          <Link
            href="/perfil"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <User size={16} />
            <span className="hidden sm:inline text-xs font-medium">Perfil</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
