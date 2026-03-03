'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Target,
  Wallet,
  Repeat,
  CheckSquare,
  Trophy,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { getLevelInfo } from '@/lib/gamification'

interface SidebarProps {
  profile: {
    full_name: string | null
    level: number
    xp: number
  } | null
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/metas', label: 'Metas', icon: Target },
  { href: '/financas', label: 'Finanças', icon: Wallet },
  { href: '/habitos', label: 'Hábitos', icon: Repeat },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/gamificacao', label: 'Progresso', icon: Trophy },
]

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { supabase } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const levelInfo = getLevelInfo(profile?.xp ?? 0)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const sidebarContent = (
    <>
      <div className="p-6">
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-gray-900">
          reestrutura
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="mb-3 px-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Nível {levelInfo.currentLevel.level}</span>
            <span>{levelInfo.currentLevel.name}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-gray-900 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

        <Link
          href="/perfil"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <User size={18} />
          {profile?.full_name || 'Perfil'}
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg border border-gray-200 shadow-sm"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
