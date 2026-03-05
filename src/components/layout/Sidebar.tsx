'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import {
  LayoutDashboard,
  Target,
  Wallet,
  Repeat,
  CheckSquare,
  UtensilsCrossed,
  User,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#E8546B' },
  { href: '/metas', label: 'Metas', icon: Target, color: '#F5B731' },
  { href: '/financas', label: 'Financas', icon: Wallet, color: '#3DC96E' },
  { href: '/habitos', label: 'Habitos', icon: Repeat, color: '#4BA8DB' },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare, color: '#E8546B' },
  { href: '/alimentacao', label: 'Dieta', icon: UtensilsCrossed, color: '#F5B731' },
  { href: '/perfil', label: 'Perfil', icon: User, color: '#3DC96E' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const isRaibo = theme === 'raibo'

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-2 bg-white/80 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-lg shadow-black/[0.08]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          if (isRaibo) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gray-200/80'
                    : 'text-gray-500 hover:text-gray-400'
                }`}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.2 : 1.8}
                  style={isActive ? { color: item.color } : undefined}
                />
                <span
                  className="text-[10px] font-medium leading-none"
                  style={isActive ? { color: item.color } : undefined}
                >
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
