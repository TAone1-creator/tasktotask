'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, CheckSquare, Filter, Repeat } from 'lucide-react'
import { format } from 'date-fns'
import { TASK_CATEGORIES } from '@/lib/constants'
import type { Task } from '@/types/database'

export default function TarefasPage() {
  const { user, supabase } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const fetchTasks = async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', filter)
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true })

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      const { data } = await query
      setTasks(data || [])
      setLoading(false)
    }
    fetchTasks()
  }, [user, filter, categoryFilter])

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)

    if (newStatus === 'completed') {
      // Award XP
      const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user!.id).single()
      if (profile) {
        await supabase.from('profiles').update({ xp: profile.xp + 10 }).eq('id', user!.id)
      }
    }

    setTasks(prev => prev.filter(t => t.id !== task.id))
  }

  const priorityColors: Record<string, string> = {
    high: 'bg-red-400',
    medium: 'bg-yellow-400',
    low: 'bg-gray-300',
  }

  const priorityLabels: Record<string, string> = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
            <p className="text-sm text-gray-500 mt-1">Suporte às suas metas</p>
          </div>
          <Link
            href="/tarefas/nova"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} /> Nova tarefa
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pending' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'completed' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              Concluídas
            </button>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">Todas categorias</option>
            {TASK_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <CheckSquare className="mx-auto text-gray-300" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {filter === 'pending' ? 'Nenhuma tarefa pendente' : 'Nenhuma tarefa concluída'}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {filter === 'pending' ? 'Crie tarefas para apoiar suas metas.' : 'Complete tarefas para vê-las aqui.'}
            </p>
            {filter === 'pending' && (
              <Link href="/tarefas/nova" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium">
                <Plus size={16} /> Criar tarefa
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-all animate-slide-up">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleTask(task)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                      task.status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {task.status === 'completed' && <span className="text-xs">&#10003;</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/tarefas/${task.id}`} className={`text-sm font-medium hover:underline ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {task.title}
                      </Link>
                      <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} title={priorityLabels[task.priority]} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{task.category}</span>
                      {task.due_date && <span>Vence: {format(new Date(task.due_date), 'dd/MM/yyyy')}</span>}
                      {task.recurrence !== 'none' && (
                        <span className="flex items-center gap-1">
                          <Repeat size={10} />
                          {task.recurrence === 'daily' ? 'Diária' : task.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
