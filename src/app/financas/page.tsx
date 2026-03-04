'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, ChevronLeft, ChevronRight } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { useTheme } from '@/contexts/ThemeContext'
import { FINANCIAL_CATEGORIES } from '@/lib/constants'
import type { Transaction, SavingsBox } from '@/types/database'

const CHART_COLORS_LIGHT = ['#111827', '#374151', '#6B7280', '#9CA3AF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
const CHART_COLORS_DARK = ['#ffffff', '#c4c4c4', '#8a8a8a', '#6e6e6e', '#5a9ad5', '#3dbb63', '#d4b840', '#e05555', '#c0a0e0']
const CHART_COLORS_SAKURA = ['#d14d72', '#e87a98', '#c43860', '#a82e50', '#d86888', '#e8638a', '#e88098', '#f06888', '#b83870']
const CHART_COLORS_SAKURA_DARK = ['#e8899e', '#d8728a', '#c8607a', '#b85068', '#c8889a', '#d8a0ae', '#d8a8a0', '#e87080', '#c8a0b8']
const CHART_COLORS_RAIBO = ['#E8546B', '#F5B731', '#3DC96E', '#4BA8DB', '#b88ce8', '#e09050', '#6abce8', '#52d880', '#f07888']
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function FinancasPage() {
  const { user, supabase } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark' || theme === 'sakura-dark' || theme === 'raibo'
  const isSakuraDark = theme === 'sakura-dark'
  const isPureDark = theme === 'dark'
  const isRaibo = theme === 'raibo'
  const isSakura = theme === 'sakura-light' || theme === 'sakura-dark'
  const CHART_COLORS = isRaibo ? CHART_COLORS_RAIBO : isSakuraDark ? CHART_COLORS_SAKURA_DARK : isPureDark ? CHART_COLORS_DARK : isSakura ? CHART_COLORS_SAKURA : CHART_COLORS_LIGHT
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [savingsBoxes, setSavingsBoxes] = useState<SavingsBox[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions'>('overview')
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear())
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(() => new Date().getMonth())

  const selectedMonth = `${selectedYear}-${String(selectedMonthIdx + 1).padStart(2, '0')}`

  const goToPrevMonth = () => {
    if (selectedMonthIdx === 0) { setSelectedMonthIdx(11); setSelectedYear(y => y - 1) }
    else setSelectedMonthIdx(m => m - 1)
  }
  const goToNextMonth = () => {
    if (selectedMonthIdx === 11) { setSelectedMonthIdx(0); setSelectedYear(y => y + 1) }
    else setSelectedMonthIdx(m => m + 1)
  }

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

  const { income, expense, balance } = useMemo(() => {
    let inc = 0, exp = 0
    for (const t of transactions) {
      if (t.type === 'income') inc += Number(t.amount)
      else exp += Number(t.amount)
    }
    return { income: inc, expense: exp, balance: inc - exp }
  }, [transactions])

  const getCategoryLabel = (id: string) => FINANCIAL_CATEGORIES.find(c => c.id === id)?.label || id

  const pieData = useMemo(() => {
    const catTotals: Record<string, number> = {}
    for (const t of transactions) {
      if (t.type === 'expense') catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount)
    }
    return Object.entries(catTotals).sort(([, a], [, b]) => b - a).map(([cat, amount]) => ({ name: getCategoryLabel(cat), value: amount }))
  }, [transactions])

  const barData = useMemo(() => {
    const daily: Record<number, { income: number; expense: number }> = {}
    for (const t of transactions) {
      const day = new Date(t.date).getDate()
      if (!daily[day]) daily[day] = { income: 0, expense: 0 }
      if (t.type === 'income') daily[day].income += Number(t.amount)
      else daily[day].expense += Number(t.amount)
    }
    const daysInMonth = new Date(selectedYear, selectedMonthIdx + 1, 0).getDate()
    return Array.from({ length: daysInMonth }, (_, i) => ({
      day: String(i + 1),
      Gastos: daily[i + 1]?.expense || 0,
      Ganhos: daily[i + 1]?.income || 0,
    }))
  }, [transactions, selectedYear, selectedMonthIdx])

  const handleDelete = async (id: string) => {
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
            <Link href="/financas/caixinhas" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              <PiggyBank size={16} /> Caixinhas
            </Link>
            <Link href="/financas/nova-transacao" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
              <Plus size={16} /> Nova Transação
            </Link>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {MONTH_NAMES[selectedMonthIdx]} {selectedYear}
          </h2>
          <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><TrendingUp size={16} className="text-green-600" /></div>
              <span className="text-sm text-gray-500">Ganhos</span>
            </div>
            <p className="text-2xl font-bold text-green-600">R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"><TrendingDown size={16} className="text-red-600" /></div>
              <span className="text-sm text-gray-500">Gastos</span>
            </div>
            <p className="text-2xl font-bold text-red-500">R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${balance >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                <Wallet size={16} className={balance >= 0 ? 'text-blue-600' : 'text-red-600'} />
              </div>
              <span className="text-sm text-gray-500">Sobra</span>
            </div>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
              R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'transactions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Transações</button>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : activeTab === 'overview' ? (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Gastos por Categoria</h2>
              {pieData.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">Nenhum gasto registrado</p>
              ) : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, '']} contentStyle={{ borderRadius: '8px', border: isDark ? '1px solid #221e1f' : '1px solid #e5e7eb', fontSize: '12px', backgroundColor: isRaibo ? '#0b0b14' : isSakuraDark ? '#0c0a0b' : isPureDark ? '#0a0a0a' : isSakura ? '#fff8f9' : '#ffffff', color: isDark ? '#f5f0f1' : isSakura ? '#3a1428' : '#111827' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {pieData.map((entry, i) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-xs text-gray-500">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Gastos Diários</h2>
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">Nenhuma transação registrada</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isSakuraDark ? '#221e1f' : isPureDark ? '#1e1e1e' : isSakura ? '#fcd9e0' : '#f3f4f6'} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: isSakuraDark ? '#706568' : isPureDark ? '#6e6e6e' : isSakura ? '#b06878' : '#9ca3af' }} axisLine={false} tickLine={false} interval={Math.floor(barData.length / 8)} />
                    <YAxis tick={{ fontSize: 10, fill: isSakuraDark ? '#706568' : isPureDark ? '#6e6e6e' : isSakura ? '#b06878' : '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value, name) => [`R$ ${Number(value).toFixed(2)}`, name]} contentStyle={{ borderRadius: '8px', border: isDark ? '1px solid #221e1f' : '1px solid #e5e7eb', fontSize: '12px', backgroundColor: isRaibo ? '#0b0b14' : isSakuraDark ? '#0c0a0b' : isPureDark ? '#0a0a0a' : isSakura ? '#fff8f9' : '#ffffff', color: isDark ? '#f5f0f1' : isSakura ? '#3a1428' : '#111827' }} />
                    <Bar dataKey="Gastos" fill={isSakuraDark ? '#e87080' : isPureDark ? '#e05555' : isSakura ? '#e04870' : '#EF4444'} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Ganhos" fill={isSakuraDark ? '#e8899e' : isPureDark ? '#3dbb63' : isSakura ? '#e8638a' : '#10B981'} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Savings Boxes */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Caixinhas</h2>
                <Link href="/financas/caixinhas" className="text-xs text-gray-500 hover:text-gray-700">Gerenciar</Link>
              </div>
              {savingsBoxes.length === 0 ? (
                <div className="text-center py-6">
                  <PiggyBank className="mx-auto text-gray-300" size={32} />
                  <p className="text-sm text-gray-400 mt-2">Nenhuma caixinha criada</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {savingsBoxes.map((box) => {
                    const prog = Number(box.target_amount) > 0 ? (Number(box.current_amount) / Number(box.target_amount)) * 100 : 0
                    return (
                      <div key={box.id} className="p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-gray-900">{box.name}</span>
                          <span className="text-xs text-gray-500">{Math.min(prog, 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                          <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(prog, 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-400">R$ {Number(box.current_amount).toFixed(0)} / R$ {Number(box.target_amount).toFixed(0)}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Transactions Tab */
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Transações de {MONTH_NAMES[selectedMonthIdx]}</h2>
              <span className="text-xs text-gray-400">{transactions.length} registros</span>
            </div>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-400">Nenhuma transação neste mês</p>
                <Link href="/financas/nova-transacao" className="mt-2 inline-block text-sm text-gray-900 font-medium hover:underline">Registrar transação</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Descrição</th>
                      <th className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Categoria</th>
                      <th className="text-right px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Valor</th>
                      <th className="w-10 px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                        <td className="px-5 py-3 text-sm text-gray-500">{new Date(tx.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</td>
                        <td className="px-5 py-3 text-sm text-gray-700">{tx.description || getCategoryLabel(tx.category)}</td>
                        <td className="px-5 py-3 hidden sm:table-cell"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{getCategoryLabel(tx.category)}</span></td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-sm font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                            {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <button onClick={() => handleDelete(tx.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-lg" title="Remover">&times;</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
