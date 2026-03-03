'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TASK_CATEGORIES } from '@/lib/constants'
import type { Goal } from '@/types/database'

export default function NovaTarefaPage() {
  const { user, supabase } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Pessoal')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none')
  const [goalId, setGoalId] = useState('')
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active')
      .then(({ data }) => setGoals(data || []))
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title) return
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('tasks').insert({
      user_id: user.id,
      title,
      description: description || null,
      category,
      priority,
      due_date: dueDate || null,
      recurrence,
      goal_id: goalId || null,
    })

    if (err) {
      setError(err.message || 'Erro ao criar tarefa. Tente novamente.')
      setLoading(false)
      return
    }
    router.push('/tarefas')
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto animate-fade-in">
        <Link href="/tarefas" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Voltar para tarefas
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Tarefa</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="O que precisa ser feito?"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Detalhes adicionais"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <div className="flex flex-wrap gap-2">
              {TASK_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    category === cat ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
            <div className="flex gap-2">
              {[
                { value: 'high' as const, label: 'Alta', color: 'red' },
                { value: 'medium' as const, label: 'Média', color: 'yellow' },
                { value: 'low' as const, label: 'Baixa', color: 'gray' },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    priority === p.value ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data de vencimento (opcional)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recorrência</label>
            <div className="flex gap-2">
              {[
                { value: 'none' as const, label: 'Única' },
                { value: 'daily' as const, label: 'Diária' },
                { value: 'weekly' as const, label: 'Semanal' },
                { value: 'monthly' as const, label: 'Mensal' },
              ].map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRecurrence(r.value)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                    recurrence === r.value ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Associar a uma meta (opcional)</label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Sem meta associada</option>
              {goals.map(g => (
                <option key={g.id} value={g.id}>{g.title}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading || !title}
            className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar tarefa'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
