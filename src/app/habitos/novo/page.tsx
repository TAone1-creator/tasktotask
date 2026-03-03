'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Goal } from '@/types/database'

export default function NovoHabitoPage() {
  const { user, supabase } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [timesPerWeek, setTimesPerWeek] = useState('3')
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
    if (!user || !name) return
    setLoading(true)
    setError('')

    try {
      const { error: err } = await supabase.from('habits').insert({
        user_id: user.id,
        name,
        frequency,
        times_per_week: frequency === 'weekly' ? parseInt(timesPerWeek) : null,
        goal_id: goalId || null,
      })

      if (err) {
        setError(err.message || 'Erro ao criar hábito. Tente novamente.')
        return
      }
      router.push('/habitos')
    } catch (err) {
      console.error('Error creating habit:', err)
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto animate-fade-in">
        <Link href="/habitos" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Voltar para hábitos
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Hábito</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do hábito</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Ler 15 minutos"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFrequency('daily')}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  frequency === 'daily' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600'
                }`}
              >
                Diário
              </button>
              <button
                type="button"
                onClick={() => setFrequency('weekly')}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  frequency === 'weekly' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600'
                }`}
              >
                Semanal
              </button>
            </div>
          </div>

          {frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vezes por semana</label>
              <input
                type="number"
                min="1"
                max="7"
                value={timesPerWeek}
                onChange={(e) => setTimesPerWeek(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          )}

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
            disabled={loading || !name}
            className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar hábito'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">
            Dica: Comece com poucos hábitos (3–5) de alta consistência. É melhor fazer pouco todo dia do que muito um dia e nada no outro.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
