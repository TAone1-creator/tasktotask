'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Repeat, Pause, Play, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subDays, addMonths, subMonths } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Habit, HabitLog } from '@/types/database'

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const WEEKDAY_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export default function HabitosPage() {
  const { user, supabase } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)
  const daysInMonth = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd])

  const weeks = useMemo(() => {
    const result: Date[][] = []
    let currentWeek: Date[] = []
    daysInMonth.forEach((day, i) => {
      currentWeek.push(day)
      if (getDay(day) === 0 || i === daysInMonth.length - 1) {
        result.push(currentWeek)
        currentWeek = []
      }
    })
    return result
  }, [daysInMonth])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const mEnd = format(monthEnd, 'yyyy-MM-dd')
      const streakStart = format(subDays(monthStart, 365), 'yyyy-MM-dd')
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('habit_logs').select('*').eq('user_id', user.id).gte('date', streakStart).lte('date', mEnd).eq('completed', true),
      ])
      setHabits(habitsRes.data || [])
      setLogs(logsRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [user, selectedDate])

  const toggleHabitLog = async (habitId: string, date: string) => {
    if (!user) return
    const existing = logs.find(l => l.habit_id === habitId && l.date === date)
    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id)
      setLogs(prev => prev.filter(l => l.id !== existing.id))
    } else {
      const { data } = await supabase.from('habit_logs').insert({ habit_id: habitId, user_id: user.id, date, completed: true }).select().single()
      if (data) {
        setLogs(prev => [...prev, data])
        const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
        if (profile) await supabase.from('profiles').update({ xp: profile.xp + 5 }).eq('id', user.id)
      }
    }
  }

  const togglePause = async (habit: Habit) => {
    const newStatus = habit.status === 'active' ? 'paused' : 'active'
    await supabase.from('habits').update({ status: newStatus }).eq('id', habit.id)
    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, status: newStatus } : h))
  }

  const logSet = useMemo(() => {
    const set = new Set<string>()
    for (const l of logs) {
      set.add(`${l.habit_id}:${l.date}`)
    }
    return set
  }, [logs])

  const streaks = useMemo(() => {
    const result: Record<string, number> = {}
    for (const habit of habits) {
      let streak = 0
      for (let i = 0; i < 365; i++) {
        const date = subDays(new Date(), i).toISOString().split('T')[0]
        if (logSet.has(`${habit.id}:${date}`)) {
          streak++
        } else {
          break
        }
      }
      result[habit.id] = streak
    }
    return result
  }, [habits, logSet])

  const activeHabits = useMemo(() => habits.filter(h => h.status === 'active'), [habits])
  const pausedHabits = useMemo(() => habits.filter(h => h.status === 'paused'), [habits])

  const chartData = useMemo(() => {
    if (activeHabits.length === 0) return []
    return daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const completed = activeHabits.filter(h => logSet.has(`${h.id}:${dateStr}`)).length
      return { day: format(day, 'd'), rate: Math.round((completed / activeHabits.length) * 100) }
    })
  }, [daysInMonth, activeHabits, logSet])

  const getHabitMonthProgress = (habitId: string) => {
    const total = daysInMonth.length
    const done = daysInMonth.filter(day => logSet.has(`${habitId}:${format(day, 'yyyy-MM-dd')}`)).length
    return total > 0 ? Math.round((done / total) * 100) : 0
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hábitos</h1>
            <p className="text-sm text-gray-500 mt-1">Consistência e evolução</p>
          </div>
          <Link href="/habitos/novo" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <Plus size={16} /> Novo hábito
          </Link>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button onClick={() => setSelectedDate(d => subMonths(d, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
            {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </h2>
          <button onClick={() => setSelectedDate(d => addMonths(d, 1))} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight size={20} className="text-gray-600" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : habits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <Repeat className="mx-auto text-gray-300" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhum hábito criado</h3>
            <p className="mt-2 text-sm text-gray-500">Comece com algo simples que você possa manter todos os dias.</p>
            <Link href="/habitos/novo" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800">
              <Plus size={16} /> Criar hábito
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Progress Chart */}
            {activeHabits.length > 0 && chartData.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">Progresso Geral dos Hábitos</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={Math.floor(daysInMonth.length / 10)} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Conclusão']} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="rate" stroke="#111827" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Habit Calendar Grid */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Grade de Hábitos</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 bg-white z-10 min-w-[120px] px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Hábito</th>
                      {weeks.map((week, wi) => (
                        <th key={wi} colSpan={week.length} className="px-1 py-1.5 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-l border-gray-100 first:border-l-0">
                          Sem {wi + 1}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-l border-gray-100">%</th>
                    </tr>
                    <tr>
                      <th className="sticky left-0 bg-white z-10 px-3 py-1" />
                      {weeks.map((week, wi) =>
                        week.map((day, di) => (
                          <th key={`${wi}-${di}`} className={`px-0.5 py-1 text-center text-[10px] text-gray-400 font-normal ${di === 0 && wi > 0 ? 'border-l border-gray-100' : ''}`}>
                            <div>{WEEKDAY_SHORT[getDay(day)]}</div>
                            <div className="text-[9px] text-gray-300">{format(day, 'd')}</div>
                          </th>
                        ))
                      )}
                      <th className="border-l border-gray-100" />
                    </tr>
                  </thead>
                  <tbody>
                    {activeHabits.map((habit) => {
                      const monthProgress = getHabitMonthProgress(habit.id)
                      return (
                        <tr key={habit.id} className="border-t border-gray-50">
                          <td className="sticky left-0 bg-white z-10 px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">{habit.name}</span>
                              <button onClick={() => togglePause(habit)} className="text-gray-300 hover:text-gray-500 shrink-0" title="Pausar"><Pause size={10} /></button>
                            </div>
                          </td>
                          {weeks.map((week, wi) =>
                            week.map((day, di) => {
                              const dateStr = format(day, 'yyyy-MM-dd')
                              const isCompleted = logSet.has(`${habit.id}:${dateStr}`)
                              const isToday = dateStr === today
                              const isFuture = day > new Date()
                              return (
                                <td key={`${wi}-${di}`} className={`px-0.5 py-2 text-center ${di === 0 && wi > 0 ? 'border-l border-gray-100' : ''}`}>
                                  <button
                                    onClick={() => !isFuture && toggleHabitLog(habit.id, dateStr)}
                                    disabled={isFuture}
                                    className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center transition-all text-[10px] ${
                                      isCompleted ? 'bg-green-500 text-white'
                                        : isToday ? 'border-2 border-gray-900 hover:bg-gray-100'
                                        : isFuture ? 'bg-gray-50 text-gray-200'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                  >
                                    {isCompleted && <Check size={12} />}
                                  </button>
                                </td>
                              )
                            })
                          )}
                          <td className="px-3 py-2 text-center border-l border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[40px]">
                                <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${monthProgress}%` }} />
                              </div>
                              <span className="text-xs font-medium text-gray-600 w-8 text-right">{monthProgress}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paused habits */}
            {pausedHabits.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 mb-3">Pausados</h2>
                <div className="space-y-2">
                  {pausedHabits.map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm text-gray-400">{habit.name}</span>
                      <button onClick={() => togglePause(habit)} className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"><Play size={12} /> Retomar</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
