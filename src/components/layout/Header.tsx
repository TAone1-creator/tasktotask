'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { Profile } from '@/types/database'

export default function Header({ profile }: { profile: Profile | null }) {
  const { supabase } = useAuth()
  const router = useRouter()

  const fullName = profile?.full_name || 'Usuário'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-10">
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

        {/* Right: Profile + Logout */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/perfil"
            className="flex items-center gap-2 px-2 py-1 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
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
