'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, PiggyBank } from 'lucide-react'
import Link from 'next/link'
import type { SavingsBox, Goal } from '@/types/database'

export default function CaixinhasPage() {
  const { user, supabase } = useAuth()
  const [boxes, setBoxes] = useState<SavingsBox[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [goalId, setGoalId] = useState('')
  const [loading, setLoading] = useState(true)
  const [depositBoxId, setDepositBoxId] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState('')

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const [boxRes, goalRes] = await Promise.all([
        supabase.from('savings_boxes').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active'),
      ])
      setBoxes(boxRes.data || [])
      setGoals(goalRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [user])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name || !targetAmount) return

    const { data, error } = await supabase.from('savings_boxes').insert({
      user_id: user.id,
      name,
      target_amount: parseFloat(targetAmount),
      goal_id: goalId || null,
    }).select().single()

    if (!error && data) {
      setBoxes(prev => [data, ...prev])
      setName('')
      setTargetAmount('')
      setGoalId('')
      setShowForm(false)
    }
  }

  const handleDeposit = async (boxId: string) => {
    const amount = parseFloat(depositAmount)
    if (!amount || amount <= 0) return

    const box = boxes.find(b => b.id === boxId)
    if (!box) return

    const newAmount = Number(box.current_amount) + amount
    await supabase.from('savings_boxes').update({ current_amount: newAmount }).eq('id', boxId)
    setBoxes(prev => prev.map(b => b.id === boxId ? { ...b, current_amount: newAmount } : b))
    setDepositBoxId(null)
    setDepositAmount('')
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <Link href="/financas" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Voltar para finanças
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Caixinhas</h1>
            <p className="text-sm text-gray-500 mt-1">Separe dinheiro com propósito</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} /> Nova caixinha
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 p-5 mb-6 animate-scale-in">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ex: Reserva de emergência"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor alvo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  required
                  placeholder="5000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
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
              <button type="submit" className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
                Criar caixinha
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <PiggyBank className="mx-auto text-gray-300" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma caixinha criada</h3>
            <p className="mt-2 text-sm text-gray-500">Crie caixinhas para separar dinheiro com propósito.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {boxes.map((box) => {
              const progress = Number(box.target_amount) > 0 ? (Number(box.current_amount) / Number(box.target_amount)) * 100 : 0
              return (
                <div key={box.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">{box.name}</h3>
                    <span className="text-sm text-gray-500">
                      R$ {Number(box.current_amount).toFixed(2)} / R$ {Number(box.target_amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                    <div
                      className={`h-2.5 rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-gray-900'}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{progress.toFixed(1)}% concluído</span>
                    {depositBoxId === box.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="Valor"
                          className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                        <button
                          onClick={() => handleDeposit(box.id)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"
                        >
                          Depositar
                        </button>
                        <button
                          onClick={() => { setDepositBoxId(null); setDepositAmount('') }}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDepositBoxId(box.id)}
                        className="text-xs text-gray-900 font-medium hover:underline"
                      >
                        + Depositar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
