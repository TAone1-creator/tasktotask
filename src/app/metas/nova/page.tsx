'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovaMetaPage() {
  const { user, supabase } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'financial' | 'habit' | 'task' | 'hybrid'>('task')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !title || !deadline) return
    setLoading(true)
    setError('')

    const { error: err } = await supabase.from('goals').insert({
      user_id: user.id,
      title,
      description: description || null,
      type,
      deadline,
    })

    if (err) {
      setError(err.message || 'Erro ao criar meta. Tente novamente.')
      setLoading(false)
      return
    }
    router.push('/metas')
  }

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto animate-fade-in">
        <Link href="/metas" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Voltar para metas
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Meta</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="O que você quer conquistar?"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descreva sua meta com mais detalhes"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo da meta</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'financial' as const, label: 'Financeira' },
                { value: 'habit' as const, label: 'De hábito' },
                { value: 'task' as const, label: 'De tarefa' },
                { value: 'hybrid' as const, label: 'Híbrida' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    type === t.value
                      ? 'border-gray-900 bg-gray-50 text-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading || !title || !deadline}
            className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar meta'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
