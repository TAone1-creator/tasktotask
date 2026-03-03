'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { Task, TaskChecklistItem } from '@/types/database'

export default function TaskDetailPage() {
  const { user, supabase } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [checklist, setChecklist] = useState<TaskChecklistItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !params.id) return
    const fetchData = async () => {
      const [taskRes, checklistRes] = await Promise.all([
        supabase.from('tasks').select('*').eq('id', params.id).eq('user_id', user.id).single(),
        supabase.from('task_checklist_items').select('*').eq('task_id', params.id as string).order('position'),
      ])
      setTask(taskRes.data)
      setChecklist(checklistRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [user, params.id])

  const addChecklistItem = async () => {
    if (!newItem.trim() || !params.id) return
    const { data } = await supabase.from('task_checklist_items').insert({
      task_id: params.id as string,
      title: newItem.trim(),
      position: checklist.length,
    }).select().single()

    if (data) {
      setChecklist(prev => [...prev, data])
      setNewItem('')
    }
  }

  const toggleChecklistItem = async (item: TaskChecklistItem) => {
    await supabase.from('task_checklist_items').update({ completed: !item.completed }).eq('id', item.id)
    setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i))
  }

  const deleteChecklistItem = async (id: string) => {
    await supabase.from('task_checklist_items').delete().eq('id', id)
    setChecklist(prev => prev.filter(i => i.id !== id))
  }

  const completeTask = async () => {
    if (!task) return
    await supabase.from('tasks').update({ status: 'completed' }).eq('id', task.id)
    // Award XP
    const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user!.id).single()
    if (profile) {
      await supabase.from('profiles').update({ xp: profile.xp + 10 }).eq('id', user!.id)
    }
    router.push('/tarefas')
  }

  const deleteTask = async () => {
    if (!task) return
    await supabase.from('tasks').delete().eq('id', task.id)
    router.push('/tarefas')
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

  if (!task) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Tarefa não encontrada</p>
        </div>
      </AppLayout>
    )
  }

  const priorityLabels: Record<string, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' }
  const priorityColors: Record<string, string> = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-gray-100 text-gray-600' }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto animate-fade-in">
        <Link href="/tarefas" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Voltar para tarefas
        </Link>

        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
              {priorityLabels[task.priority]}
            </span>
          </div>
          {task.description && <p className="text-sm text-gray-500 mb-3">{task.description}</p>}

          <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
            <span>{task.category}</span>
            {task.due_date && <span>Vence: {new Date(task.due_date).toLocaleDateString('pt-BR')}</span>}
            <span className={`px-2 py-0.5 rounded ${task.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {task.status === 'completed' ? 'Concluída' : 'Pendente'}
            </span>
          </div>

          {task.status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={completeTask} className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600">
                <CheckCircle size={16} /> Concluir
              </button>
              <button onClick={deleteTask} className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Checklist</h2>

          <div className="space-y-2 mb-4">
            {checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group">
                <button
                  onClick={() => toggleChecklistItem(item)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
                    item.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                  }`}
                >
                  {item.completed && <span className="text-xs">&#10003;</span>}
                </button>
                <span className={`text-sm flex-1 ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                  {item.title}
                </span>
                <button
                  onClick={() => deleteChecklistItem(item.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
              placeholder="Adicionar item"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <button
              onClick={addChecklistItem}
              disabled={!newItem.trim()}
              className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-30"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
