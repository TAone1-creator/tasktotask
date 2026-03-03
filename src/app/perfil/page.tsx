'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { LIFE_CONTEXTS } from '@/lib/constants'
import { getLevelInfo } from '@/lib/gamification'

export default function PerfilPage() {
  const { user, profile, supabase } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza? Todos os seus dados serão excluídos permanentemente.')) return
    await supabase.auth.signOut()
    router.push('/')
  }

  const daysRemaining = profile?.cycle_end_date
    ? differenceInDays(new Date(profile.cycle_end_date), new Date())
    : null

  const daysElapsed = profile?.cycle_start_date
    ? differenceInDays(new Date(), new Date(profile.cycle_start_date))
    : 0

  const totalDays = profile?.cycle_start_date && profile?.cycle_end_date
    ? differenceInDays(new Date(profile.cycle_end_date), new Date(profile.cycle_start_date))
    : 1

  const cycleProgress = Math.min((daysElapsed / totalDays) * 100, 100)

  const contextLabel = LIFE_CONTEXTS.find(c => c.id === profile?.context)?.label || profile?.context || 'Não definido'
  const levelInfo = getLevelInfo(profile?.xp ?? 0)

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Perfil</h1>

        {/* Cycle Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Seu Ciclo</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Contexto</span>
              <span className="text-gray-900 font-medium">{contextLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Duração</span>
              <span className="text-gray-900 font-medium">{profile?.cycle_months || 3} meses</span>
            </div>
            {profile?.cycle_start_date && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Início</span>
                <span className="text-gray-900 font-medium">
                  {format(new Date(profile.cycle_start_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
            {profile?.cycle_end_date && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Término</span>
                <span className="text-gray-900 font-medium">
                  {format(new Date(profile.cycle_end_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
            {daysRemaining !== null && (
              <>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-gray-900 h-2 rounded-full transition-all" style={{ width: `${cycleProgress}%` }} />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Ciclo encerrado'}
                </p>
              </>
            )}
          </div>

          {daysRemaining !== null && daysRemaining <= 30 && daysRemaining > 0 && (
            <Link href="/encerramento" className="mt-4 block w-full py-2.5 text-center bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
              Ver relatório de encerramento
            </Link>
          )}
        </div>

        {/* Level */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-gray-900">Nível {levelInfo.currentLevel.level} — {levelInfo.currentLevel.name}</p>
              <p className="text-xs text-gray-500">{profile?.xp ?? 0} XP total</p>
            </div>
            <Link href="/gamificacao" className="text-xs text-gray-900 font-medium hover:underline">Ver detalhes</Link>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Dados Pessoais</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <p className="text-sm text-gray-900">{profile?.email}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-100 p-5">
          <h2 className="text-sm font-semibold text-red-600 mb-2">Zona de Perigo</h2>
          <p className="text-xs text-gray-500 mb-3">Ações irreversíveis</p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100"
          >
            Excluir conta
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
