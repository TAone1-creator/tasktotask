'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Target, Clock } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import type { Goal } from '@/types/database'

const typeConfig: Record<string, { label: string; color: string }> = {
  financial: { label: 'Financeira', color: 'bg-green-100 text-green-700' },
  habit: { label: 'De hábito', color: 'bg-blue-100 text-blue-700' },
  task: { label: 'De tarefa', color: 'bg-purple-100 text-purple-700' },
  hybrid: { label: 'Híbrida', color: 'bg-orange-100 text-orange-700' },
}

export default function MetasPage() {
  const { user, supabase } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'archived'>('active')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('goals').select('*').eq('user_id', user.id).eq('status', statusFilter).order('created_at', { ascending: false })
      .then(({ data }) => { setGoals(data || []); setLoading(false) })
  }, [user, statusFilter])

  const filteredGoals = typeFilter === 'all' ? goals : goals.filter(g => g.type === typeFilter)

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
            <p className="text-sm text-gray-500 mt-1">Eixo central da sua reestruturação</p>
          </div>
          <Link href="/metas/nova" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <Plus size={16} /> Nova meta
          </Link>
        </div>

        <div className="flex gap-2 mb-4">
          {([
            { key: 'active' as const, label: 'Ativas' },
            { key: 'completed' as const, label: 'Concluídas' },
            { key: 'archived' as const, label: 'Arquivadas' },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === f.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              typeFilter === 'all' ? 'bg-gray-200 text-gray-900' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            Todas
          </button>
          {Object.entries(typeConfig).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                typeFilter === key ? cfg.color : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Target className="mx-auto text-gray-300" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {statusFilter === 'active' ? 'Nenhuma meta ativa' : statusFilter === 'completed' ? 'Nenhuma meta concluída' : 'Nenhuma meta arquivada'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {statusFilter === 'active' ? 'Crie sua primeira meta para começar sua jornada.' : 'Continue trabalhando nas suas metas!'}
            </p>
            {statusFilter === 'active' && (
              <Link href="/metas/nova" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                <Plus size={16} /> Criar meta
              </Link>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredGoals.map((goal) => {
              const daysLeft = differenceInDays(new Date(goal.deadline), new Date())
              const cfg = typeConfig[goal.type]
              return (
                <Link
                  key={goal.id}
                  href={`/metas/${goal.id}`}
                  className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={12} />
                      {daysLeft > 0 ? `Faltam ${daysLeft} dias` : daysLeft === 0 ? 'Vence hoje' : `Venceu há ${Math.abs(daysLeft)} dias`}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{goal.description}</p>
                  )}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400">Progresso</span>
                      <span className="text-sm font-semibold text-gray-900">{Number(goal.progress).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-gray-900 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
