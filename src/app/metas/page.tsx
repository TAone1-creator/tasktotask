'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Target, Archive } from 'lucide-react'
import type { Goal } from '@/types/database'

export default function MetasPage() {
  const { user, supabase } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [filter, setFilter] = useState<'active' | 'completed' | 'archived'>('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchGoals = async () => {
      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', filter)
        .order('created_at', { ascending: false })
      setGoals(data || [])
      setLoading(false)
    }
    fetchGoals()
  }, [user, filter])

  const typeLabels: Record<string, string> = {
    financial: 'Financeira',
    habit: 'De hábito',
    task: 'De tarefa',
    hybrid: 'Híbrida',
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Metas</h1>
            <p className="text-sm text-gray-500 mt-1">Eixo central da sua reestruturação</p>
          </div>
          <Link
            href="/metas/nova"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} /> Nova meta
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'active' as const, label: 'Ativas' },
            { key: 'completed' as const, label: 'Concluídas' },
            { key: 'archived' as const, label: 'Arquivadas' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Target className="mx-auto text-gray-300" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {filter === 'active' ? 'Nenhuma meta ativa' : filter === 'completed' ? 'Nenhuma meta concluída' : 'Nenhuma meta arquivada'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {filter === 'active' ? 'Crie sua primeira meta para começar sua jornada.' : 'Continue trabalhando nas suas metas!'}
            </p>
            {filter === 'active' && (
              <Link href="/metas/nova" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                <Plus size={16} /> Criar meta
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {goals.map((goal) => (
              <Link key={goal.id} href={`/metas/${goal.id}`} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-gray-200 transition-all animate-slide-up">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{goal.description}</p>
                    )}
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium whitespace-nowrap ml-3">
                    {typeLabels[goal.type]}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gray-900 h-2 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{Number(goal.progress).toFixed(0)}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
