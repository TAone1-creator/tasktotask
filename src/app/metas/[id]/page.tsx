'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Archive, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { Goal, Habit, Task, SavingsBox } from '@/types/database'

export default function MetaDetailPage() {
  const { user, supabase } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [savingsBoxes, setSavingsBoxes] = useState<SavingsBox[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !params.id) return
    const fetchData = async () => {
      const [goalRes, habitsRes, tasksRes, boxesRes] = await Promise.all([
        supabase.from('goals').select('*').eq('id', params.id).eq('user_id', user.id).single(),
        supabase.from('habits').select('*').eq('goal_id', params.id).eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('goal_id', params.id).eq('user_id', user.id),
        supabase.from('savings_boxes').select('*').eq('goal_id', params.id).eq('user_id', user.id),
      ])
      setGoal(goalRes.data)
      setHabits(habitsRes.data || [])
      setTasks(tasksRes.data || [])
      setSavingsBoxes(boxesRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [user, params.id])

  const handleComplete = async () => {
    if (!goal) return
    await supabase.from('goals').update({ status: 'completed', progress: 100 }).eq('id', goal.id)
    // Award XP
    const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user!.id).single()
    if (profile) {
      await supabase.from('profiles').update({ xp: profile.xp + 100 }).eq('id', user!.id)
    }
    router.push('/metas')
  }

  const handleArchive = async () => {
    if (!goal) return
    await supabase.from('goals').update({ status: 'archived' }).eq('id', goal.id)
    router.push('/metas')
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

  if (!goal) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Meta não encontrada</p>
          <Link href="/metas" className="text-sm text-gray-900 font-medium hover:underline mt-2 inline-block">
            Voltar para metas
          </Link>
        </div>
      </AppLayout>
    )
  }

  const typeLabels: Record<string, string> = {
    financial: 'Financeira',
    habit: 'De hábito',
    task: 'De tarefa',
    hybrid: 'Híbrida',
  }

  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const totalTasks = tasks.length

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <Link href="/metas" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Voltar para metas
        </Link>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                {typeLabels[goal.type]}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">{goal.title}</h1>
              {goal.description && <p className="text-sm text-gray-500 mt-2">{goal.description}</p>}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Progresso</span>
              <span className="text-sm font-medium text-gray-900">{Number(goal.progress).toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className="bg-gray-900 h-3 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
            </div>
          </div>

          <p className="text-xs text-gray-400">Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>

          {goal.status === 'active' && (
            <div className="flex gap-2 mt-4">
              <button onClick={handleComplete} className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                <CheckCircle size={16} /> Concluir meta
              </button>
              <button onClick={handleArchive} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                <Archive size={16} /> Arquivar
              </button>
            </div>
          )}
        </div>

        {/* Associated elements */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Hábitos associados</h3>
            {habits.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum hábito associado</p>
            ) : (
              <div className="space-y-2">
                {habits.map(h => (
                  <div key={h.id} className="text-sm text-gray-700 p-2 rounded bg-gray-50">{h.name}</div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Tarefas ({completedTasks}/{totalTasks})</h3>
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma tarefa associada</p>
            ) : (
              <div className="space-y-2">
                {tasks.map(t => (
                  <div key={t.id} className={`text-sm p-2 rounded ${t.status === 'completed' ? 'bg-green-50 text-green-700 line-through' : 'bg-gray-50 text-gray-700'}`}>
                    {t.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Caixinhas financeiras</h3>
            {savingsBoxes.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma caixinha associada</p>
            ) : (
              <div className="space-y-2">
                {savingsBoxes.map(b => (
                  <div key={b.id} className="p-2 rounded bg-gray-50">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{b.name}</span>
                      <span className="text-gray-500">R$ {Number(b.current_amount).toFixed(0)} / {Number(b.target_amount).toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                      <div className="bg-green-500 h-1 rounded-full" style={{ width: `${(Number(b.current_amount) / Number(b.target_amount)) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
