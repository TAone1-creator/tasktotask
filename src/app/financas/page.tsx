'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { FINANCIAL_CATEGORIES } from '@/lib/constants'
import type { Transaction, SavingsBox } from '@/types/database'

export default function FinancasPage() {
  const { user, supabase } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [savingsBoxes, setSavingsBoxes] = useState<SavingsBox[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const monthStart = `${selectedMonth}-01`
      const nextMonth = new Date(monthStart)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const monthEnd = nextMonth.toISOString().split('T')[0]

      const [txRes, boxRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', monthStart).lt('date', monthEnd).order('date', { ascending: false }),
        supabase.from('savings_boxes').select('*').eq('user_id', user.id),
      ])
      setTransactions(txRes.data || [])
      setSavingsBoxes(boxRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [user, selectedMonth])

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expense

  const categoryTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
      return acc
    }, {} as Record<string, number>)

  const sortedCategories = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)
  const maxCategory = sortedCategories.length > 0 ? sortedCategories[0][1] : 0

  const getCategoryLabel = (id: string) => FINANCIAL_CATEGORIES.find(c => c.id === id)?.label || id

  const handleDeleteTransaction = async (id: string) => {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Finanças</h1>
            <p className="text-sm text-gray-500 mt-1">Consciência financeira</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/financas/caixinhas"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <PiggyBank size={16} /> Caixinhas
            </Link>
            <Link
              href="/financas/nova-transacao"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus size={16} /> Registrar
            </Link>
          </div>
        </div>

        {/* Month Selector */}
        <div className="mb-6">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-xs text-gray-500">Entradas</span>
            </div>
            <p className="text-xl font-bold text-green-600">R$ {income.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-red-500" />
              <span className="text-xs text-gray-500">Saídas</span>
            </div>
            <p className="text-xl font-bold text-red-500">R$ {expense.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-gray-400" />
              <span className="text-xs text-gray-500">Saldo</span>
            </div>
            <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              R$ {balance.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Gastos por Categoria</h2>
            {sortedCategories.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum gasto registrado</p>
            ) : (
              <div className="space-y-3">
                {sortedCategories.map(([cat, amount]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{getCategoryLabel(cat)}</span>
                      <span className="text-gray-500 font-medium">R$ {amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-gray-900 h-2 rounded-full transition-all"
                        style={{ width: `${(amount / maxCategory) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Savings Boxes */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Caixinhas</h2>
              <Link href="/financas/caixinhas" className="text-xs text-gray-500 hover:text-gray-700">Gerenciar</Link>
            </div>
            {savingsBoxes.length === 0 ? (
              <div className="text-center py-4">
                <PiggyBank className="mx-auto text-gray-300" size={32} />
                <p className="text-sm text-gray-400 mt-2">Nenhuma caixinha criada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savingsBoxes.map((box) => {
                  const progress = Number(box.target_amount) > 0 ? (Number(box.current_amount) / Number(box.target_amount)) * 100 : 0
                  return (
                    <div key={box.id} className="p-3 rounded-lg border border-gray-100">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-900">{box.name}</span>
                        <span className="text-gray-500">R$ {Number(box.current_amount).toFixed(0)} / {Number(box.target_amount).toFixed(0)}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mt-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Transações</h2>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">Nenhuma transação neste mês</p>
              <Link href="/financas/nova-transacao" className="mt-2 inline-block text-sm text-gray-900 font-medium hover:underline">
                Registrar transação
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50 group">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${tx.type === 'income' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <div>
                      <p className="text-sm text-gray-700">{tx.description || getCategoryLabel(tx.category)}</p>
                      <p className="text-xs text-gray-400">{getCategoryLabel(tx.category)} · {new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                      title="Remover"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
