'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { FINANCIAL_CATEGORIES } from '@/lib/constants'

export default function NovaTransacaoPage() {
  const { user, supabase } = useAuth()
  const router = useRouter()
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('outros')
  const [description, setDescription] = useState('')
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable' | 'installment'>('variable')
  const [installmentCurrent, setInstallmentCurrent] = useState('')
  const [installmentTotal, setInstallmentTotal] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !amount || !date) return
    setLoading(true)
    setError('')

    try {
      const { error: err } = await supabase.from('transactions').insert({
        user_id: user.id,
        type,
        amount: parseFloat(amount),
        category,
        description: description || null,
        expense_type: type === 'expense' ? expenseType : null,
        installment_current: expenseType === 'installment' ? parseInt(installmentCurrent) || null : null,
        installment_total: expenseType === 'installment' ? parseInt(installmentTotal) || null : null,
        date,
      })

      if (err) {
        setError(err.message || 'Erro ao registrar transação. Tente novamente.')
        return
      }

      // Award XP for financial record
      const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
      if (profile) {
        await supabase.from('profiles').update({ xp: profile.xp + 3 }).eq('id', user.id)
      }
      router.push('/financas')
    } catch (err) {
      console.error('Error creating transaction:', err)
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const expenseCategories = FINANCIAL_CATEGORIES.filter(c => c.id !== 'renda')
  const incomeCategories = FINANCIAL_CATEGORIES.filter(c => c.id === 'renda' || c.id === 'outros')

  const categories = type === 'income' ? incomeCategories : expenseCategories

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto animate-fade-in">
        <Link href="/financas" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Voltar
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Transação</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === 'expense' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}
            >
              Saída
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                type === 'income' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'
              }`}
            >
              Entrada
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0,00"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-lg border text-xs font-medium transition-all ${
                    category === cat.id
                      ? 'border-gray-900 bg-gray-50 text-gray-900'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {type === 'expense' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de gasto</label>
              <div className="flex gap-2">
                {[
                  { value: 'fixed' as const, label: 'Fixo' },
                  { value: 'variable' as const, label: 'Variável' },
                  { value: 'installment' as const, label: 'Parcelado' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setExpenseType(t.value)}
                    className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                      expenseType === t.value
                        ? 'border-gray-900 bg-gray-50 text-gray-900'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'expense' && expenseType === 'installment' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parcela atual</label>
                <input
                  type="number"
                  min="1"
                  value={installmentCurrent}
                  onChange={(e) => setInstallmentCurrent(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total de parcelas</label>
                <input
                  type="number"
                  min="1"
                  value={installmentTotal}
                  onChange={(e) => setInstallmentTotal(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="12"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Almoço no restaurante"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar transação'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
