'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { Target, Wallet, Repeat, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Goal, Habit, Task, Transaction } from '@/types/database'

export default function DashboardPage() {
  const { profile, supabase, user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayHabitLogs, setTodayHabitLogs] = useState<string[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [monthIncome, setMonthIncome] = useState(0)
  const [monthExpense, setMonthExpense] = useState(0)

  useEffect(() => {
    if (!user) return
    const today = new Date().toISOString().split('T')[0]
    const monthStart = today.substring(0, 7) + '-01'

    const fetchData = async () => {
      try {
        const [goalsRes, habitsRes, logsRes, tasksRes, transactionsRes] = await Promise.all([
          supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active').order('deadline').limit(5),
          supabase.from('habits').select('*').eq('user_id', user.id).eq('status', 'active'),
          supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('date', today).eq('completed', true),
          supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'pending').order('due_date').limit(5),
          supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', monthStart).lte('date', today),
        ])

        setGoals((goalsRes.data || []) as Goal[])
        setHabits((habitsRes.data || []) as Habit[])
        setTodayHabitLogs((logsRes.data || []).map((l: any) => l.habit_id))
        setTasks((tasksRes.data || []) as Task[])

        const txns = (transactionsRes.data || []) as Transaction[]
        setMonthIncome(txns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0))
        setMonthExpense(txns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0))
      } catch (err) {
        console.error('Error loading dashboard data:', err)
      }
    }

    fetchData()
  }, [user?.id, supabase])

  const habitsCompleted = todayHabitLogs.length
  const habitsTotal = habits.length

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Link href="/metas" className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-gray-400" />
              <span className="text-xs text-gray-500">Metas ativas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
          </Link>

          <Link href="/habitos" className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Repeat size={16} className="text-gray-400" />
              <span className="text-xs text-gray-500">Hábitos hoje</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {habitsCompleted}<span className="text-gray-300">/{habitsTotal}</span>
            </p>
          </Link>

          <Link href="/tarefas" className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <CheckSquare size={16} className="text-gray-400" />
              <span className="text-xs text-gray-500">Tarefas pendentes</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
          </Link>

          <Link href="/financas" className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <Wallet size={16} className="text-gray-400" />
              <span className="text-xs text-gray-500">Saldo mensal</span>
            </div>
            <p className={`text-2xl font-bold ${monthIncome - monthExpense >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              R$ {(monthIncome - monthExpense).toFixed(0)}
            </p>
          </Link>
        </div>

        {/* Two column layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Goals */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Metas Ativas</h2>
              <Link href="/metas" className="text-xs text-gray-500 hover:text-gray-700">Ver todas</Link>
            </div>
            {goals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="mx-auto text-gray-300" size={32} />
                <p className="mt-2 text-sm text-gray-400">Nenhuma meta ativa</p>
                <Link href="/metas/nova" className="mt-2 inline-block text-sm text-gray-900 font-medium hover:underline">
                  Criar meta
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <Link key={goal.id} href={`/metas/${goal.id}`} className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{goal.title}</p>
                      <span className="text-xs text-gray-500">{Number(goal.progress).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-gray-900 h-1.5 rounded-full transition-all" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Today's Habits */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Hábitos de Hoje</h2>
              <Link href="/habitos" className="text-xs text-gray-500 hover:text-gray-700">Ver todos</Link>
            </div>
            {habits.length === 0 ? (
              <div className="text-center py-8">
                <Repeat className="mx-auto text-gray-300" size={32} />
                <p className="mt-2 text-sm text-gray-400">Nenhum hábito criado</p>
                <Link href="/habitos/novo" className="mt-2 inline-block text-sm text-gray-900 font-medium hover:underline">
                  Criar hábito
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {habits.map((habit) => {
                  const isChecked = todayHabitLogs.includes(habit.id)
                  return (
                    <div key={habit.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100">
                      <button
                        onClick={async () => {
                          const today = new Date().toISOString().split('T')[0]
                          if (isChecked) {
                            await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('date', today)
                            setTodayHabitLogs(prev => prev.filter(id => id !== habit.id))
                          } else {
                            await supabase.from('habit_logs').insert({
                              habit_id: habit.id,
                              user_id: user!.id,
                              date: today,
                              completed: true,
                            })
                            setTodayHabitLogs(prev => [...prev, habit.id])
                          }
                        }}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                          isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {isChecked && <span className="text-xs">&#10003;</span>}
                      </button>
                      <span className={`text-sm ${isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {habit.name}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Tarefas Pendentes</h2>
              <Link href="/tarefas" className="text-xs text-gray-500 hover:text-gray-700">Ver todas</Link>
            </div>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="mx-auto text-gray-300" size={32} />
                <p className="mt-2 text-sm text-gray-400">Nenhuma tarefa pendente</p>
                <Link href="/tarefas/nova" className="mt-2 inline-block text-sm text-gray-900 font-medium hover:underline">
                  Criar tarefa
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <Link key={task.id} href={`/tarefas/${task.id}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-gray-300'
                      }`} />
                      <span className="text-sm text-gray-700">{task.title}</span>
                    </div>
                    {task.due_date && (
                      <span className="text-xs text-gray-400">{format(new Date(task.due_date), 'dd/MM')}</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Resumo Financeiro</h2>
              <Link href="/financas" className="text-xs text-gray-500 hover:text-gray-700">Ver detalhes</Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-sm text-green-700">Entradas</span>
                <span className="text-sm font-semibold text-green-700">R$ {monthIncome.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                <span className="text-sm text-red-700">Saídas</span>
                <span className="text-sm font-semibold text-red-700">R$ {monthExpense.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <span className="text-sm text-gray-700">Saldo</span>
                <span className={`text-sm font-semibold ${monthIncome - monthExpense >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  R$ {(monthIncome - monthExpense).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
