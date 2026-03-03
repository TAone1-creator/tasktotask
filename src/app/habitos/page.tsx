'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Repeat, Pause, Play } from 'lucide-react'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Habit, HabitLog } from '@/types/database'

export default function HabitosPage() {
  const { user, supabase } = useAuth()
  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  })

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0]
      const [habitsRes, logsRes] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('habit_logs').select('*').eq('user_id', user.id).gte('date', thirtyDaysAgo).eq('completed', true),
      ])
      setHabits(habitsRes.data || [])
      setLogs(logsRes.data || [])
      setLoading(false)
    }
    fetchData()
  }, [user])

  const toggleHabitLog = async (habitId: string, date: string) => {
    if (!user) return
    const existing = logs.find(l => l.habit_id === habitId && l.date === date)

    if (existing) {
      await supabase.from('habit_logs').delete().eq('id', existing.id)
      setLogs(prev => prev.filter(l => l.id !== existing.id))
    } else {
      const { data } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        user_id: user.id,
        date,
        completed: true,
      }).select().single()

      if (data) {
        setLogs(prev => [...prev, data])
        // Award XP
        const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single()
        if (profile) {
          await supabase.from('profiles').update({ xp: profile.xp + 5 }).eq('id', user.id)
        }
      }
    }
  }

  const togglePause = async (habit: Habit) => {
    const newStatus = habit.status === 'active' ? 'paused' : 'active'
    await supabase.from('habits').update({ status: newStatus }).eq('id', habit.id)
    setHabits(prev => prev.map(h => h.id === habit.id ? { ...h, status: newStatus } : h))
  }

  const getStreak = (habitId: string) => {
    let streak = 0
    for (let i = 0; i < 365; i++) {
      const date = subDays(new Date(), i).toISOString().split('T')[0]
      if (logs.some(l => l.habit_id === habitId && l.date === date)) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const activeHabits = habits.filter(h => h.status === 'active')
  const pausedHabits = habits.filter(h => h.status === 'paused')

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hábitos</h1>
            <p className="text-sm text-gray-500 mt-1">Consistência e evolução</p>
          </div>
          <Link
            href="/habitos/novo"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} /> Novo hábito
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
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
          <div className="space-y-4">
            {/* Today's Check */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Hoje — {format(new Date(), "d 'de' MMMM", { locale: ptBR })}</h2>
              <div className="space-y-3">
                {activeHabits.map((habit) => {
                  const isChecked = logs.some(l => l.habit_id === habit.id && l.date === today)
                  const streak = getStreak(habit.id)
                  return (
                    <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleHabitLog(habit.id, today)}
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
                            isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {isChecked && <span className="text-sm">&#10003;</span>}
                        </button>
                        <span className={`text-sm font-medium ${isChecked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                          {habit.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {streak > 0 && (
                          <span className="text-xs text-orange-500 font-medium">{streak} dias</span>
                        )}
                        <button
                          onClick={() => togglePause(habit)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Pausar"
                        >
                          <Pause size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Heatmap for each habit */}
            {activeHabits.map((habit) => {
              const streak = getStreak(habit.id)
              return (
                <div key={habit.id} className="bg-white rounded-xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{habit.name}</h3>
                      <p className="text-xs text-gray-500">{habit.frequency === 'daily' ? 'Diário' : `${habit.times_per_week}x por semana`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{streak}</p>
                      <p className="text-xs text-gray-400">dias seguidos</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {last30Days.map((day) => {
                      const dateStr = day.toISOString().split('T')[0]
                      const isCompleted = logs.some(l => l.habit_id === habit.id && l.date === dateStr)
                      return (
                        <button
                          key={dateStr}
                          onClick={() => toggleHabitLog(habit.id, dateStr)}
                          title={format(day, "d 'de' MMM", { locale: ptBR })}
                          className={`w-6 h-6 rounded text-xs transition-all ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Paused habits */}
            {pausedHabits.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-gray-500 mb-3">Pausados</h2>
                <div className="space-y-2">
                  {pausedHabits.map((habit) => (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-400">{habit.name}</span>
                      <button
                        onClick={() => togglePause(habit)}
                        className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                      >
                        <Play size={12} /> Retomar
                      </button>
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
