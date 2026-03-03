'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { getLevelInfo } from '@/lib/gamification'
import { differenceInDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trophy, Target, CheckSquare, Wallet, Repeat, Download, RefreshCw, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function EncerramentoPage() {
  const { user, profile, supabase } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    goalsCompleted: 0,
    goalsTotal: 0,
    tasksCompleted: 0,
    habitsCreated: 0,
    longestStreak: 0,
    totalTransactions: 0,
    totalIncome: 0,
    totalExpense: 0,
    badgesEarned: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchStats = async () => {
      const [goalsAll, goalsDone, tasksDone, habitsAll, txAll, badgesAll] = await Promise.all([
        supabase.from('goals').select('id').eq('user_id', user.id),
        supabase.from('goals').select('id').eq('user_id', user.id).eq('status', 'completed'),
        supabase.from('tasks').select('id').eq('user_id', user.id).eq('status', 'completed'),
        supabase.from('habits').select('id').eq('user_id', user.id),
        supabase.from('transactions').select('type, amount').eq('user_id', user.id),
        supabase.from('badges').select('id').eq('user_id', user.id),
      ])

      const txns = (txAll.data || []) as { type: string; amount: number }[]

      setStats({
        goalsTotal: (goalsAll.data || []).length,
        goalsCompleted: (goalsDone.data || []).length,
        tasksCompleted: (tasksDone.data || []).length,
        habitsCreated: (habitsAll.data || []).length,
        longestStreak: 0,
        totalTransactions: txns.length,
        totalIncome: txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        totalExpense: txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
        badgesEarned: (badgesAll.data || []).length,
      })
      setLoading(false)
    }
    fetchStats()
  }, [user])

  const levelInfo = getLevelInfo(profile?.xp ?? 0)

  const daysInCycle = profile?.cycle_start_date
    ? differenceInDays(new Date(), new Date(profile.cycle_start_date))
    : 0

  const handleRenewCycle = async () => {
    if (!user) return
    const newStart = new Date()
    const newEnd = new Date()
    newEnd.setMonth(newEnd.getMonth() + 3)

    await supabase.from('profiles').update({
      cycle_start_date: newStart.toISOString().split('T')[0],
      cycle_end_date: newEnd.toISOString().split('T')[0],
      cycle_months: 3,
    }).eq('id', user.id)

    router.push('/dashboard')
  }

  const handleExportData = async () => {
    if (!user) return

    const [goals, tasks, habits, transactions, badges] = await Promise.all([
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('tasks').select('*').eq('user_id', user.id),
      supabase.from('habits').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('*').eq('user_id', user.id),
      supabase.from('badges').select('*').eq('user_id', user.id),
    ])

    const exportData = {
      profile,
      goals: goals.data,
      tasks: tasks.data,
      habits: habits.data,
      transactions: transactions.data,
      badges: badges.data,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reestrutura-export-${format(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Sua Jornada</h1>
          <p className="text-gray-500 mt-2">
            {daysInCycle} dias de reestruturação
          </p>
        </div>

        {/* Final Message */}
        <div className="bg-gray-900 text-white rounded-xl p-6 mb-6 text-center">
          <p className="text-lg font-medium leading-relaxed">
            &ldquo;Você entrou desorganizado e está saindo estruturado. Isso é seu agora.&rdquo;
          </p>
        </div>

        {/* Level Achieved */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 text-center">
          <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl font-bold text-white">{levelInfo.currentLevel.level}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{levelInfo.currentLevel.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{levelInfo.currentLevel.description}</p>
          <p className="text-sm text-gray-400 mt-2">{profile?.xp ?? 0} XP acumulados</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
            <Target className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-3xl font-bold text-gray-900">{stats.goalsCompleted}</p>
            <p className="text-sm text-gray-500">de {stats.goalsTotal} metas concluídas</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
            <CheckSquare className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-3xl font-bold text-gray-900">{stats.tasksCompleted}</p>
            <p className="text-sm text-gray-500">tarefas completadas</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
            <Repeat className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-3xl font-bold text-gray-900">{stats.habitsCreated}</p>
            <p className="text-sm text-gray-500">hábitos criados</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 text-center">
            <Wallet className="mx-auto text-gray-400 mb-2" size={24} />
            <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions}</p>
            <p className="text-sm text-gray-500">registros financeiros</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Panorama Financeiro do Ciclo</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total de entradas</span>
              <span className="text-green-600 font-medium">R$ {stats.totalIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total de saídas</span>
              <span className="text-red-500 font-medium">R$ {stats.totalExpense.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
              <span className="text-gray-700 font-medium">Saldo do período</span>
              <span className={`font-bold ${stats.totalIncome - stats.totalExpense >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                R$ {(stats.totalIncome - stats.totalExpense).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="text-yellow-500" size={18} />
            <h2 className="text-sm font-semibold text-gray-900">{stats.badgesEarned} conquistas desbloqueadas</h2>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download size={18} /> Exportar meus dados
          </button>
          <button
            onClick={handleRenewCycle}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={18} /> Renovar ciclo (mais 3 meses)
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8 mb-4">
          O objetivo não é reter para sempre, mas transformar uma fase da vida.
        </p>
      </div>
    </AppLayout>
  )
}
