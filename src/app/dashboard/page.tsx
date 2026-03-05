'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Repeat,
  CheckSquare,
  UtensilsCrossed,
  Dumbbell,
  Plus,
} from 'lucide-react'
import { format, addDays, subDays, isToday, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Habit, Task, DietMeal, WorkoutExercise } from '@/types/database'
import { MEAL_TYPES, MUSCLE_GROUPS } from '@/lib/constants'

interface TimeSlot {
  time: string
  label: string
  items: AgendaItem[]
}

interface AgendaItem {
  id: string
  title: string
  subtitle?: string
  type: 'meal' | 'workout'
  icon: string
}

const TIME_SLOTS = [
  { time: '06:00', label: '06:00' },
  { time: '07:00', label: '07:00' },
  { time: '08:00', label: '08:00' },
  { time: '09:00', label: '09:00' },
  { time: '10:00', label: '10:00' },
  { time: '11:00', label: '11:00' },
  { time: '12:00', label: '12:00' },
  { time: '13:00', label: '13:00' },
  { time: '14:00', label: '14:00' },
  { time: '15:00', label: '15:00' },
  { time: '16:00', label: '16:00' },
  { time: '17:00', label: '17:00' },
  { time: '18:00', label: '18:00' },
  { time: '19:00', label: '19:00' },
  { time: '20:00', label: '20:00' },
  { time: '21:00', label: '21:00' },
  { time: '22:00', label: '22:00' },
]

// Map meal types to approximate time slots
function getMealTime(mealType: string): string {
  switch (mealType) {
    case 'breakfast': return '07:00'
    case 'morning_snack': return '10:00'
    case 'lunch': return '12:00'
    case 'afternoon_snack': return '15:00'
    case 'dinner': return '19:00'
    case 'supper': return '21:00'
    default: return '12:00'
  }
}

export default function DashboardPage() {
  const { profile, supabase, user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayHabitLogs, setTodayHabitLogs] = useState<string[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [meals, setMeals] = useState<DietMeal[]>([])
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(true)

  const selectedDow = selectedDate.getDay()
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [habitsRes, logsRes, tasksRes, mealsRes, exercisesRes] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', user.id).eq('status', 'active'),
          supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('date', dateStr).eq('completed', true),
          supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'pending').order('priority'),
          supabase.from('diet_meals').select('*').eq('user_id', user.id).eq('day_of_week', selectedDow).order('meal_type'),
          supabase.from('workout_exercises').select('*').eq('user_id', user.id).eq('day_of_week', selectedDow).order('muscle_group'),
        ])

        setHabits((habitsRes.data || []) as Habit[])
        setTodayHabitLogs((logsRes.data || []).map((l: any) => l.habit_id))
        setTasks((tasksRes.data || []) as Task[])
        setMeals((mealsRes.data || []) as DietMeal[])
        setExercises((exercisesRes.data || []) as WorkoutExercise[])
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id, supabase, dateStr, selectedDow])

  // Build agenda items for the calendar
  const buildTimeSlots = (): TimeSlot[] => {
    return TIME_SLOTS.map(slot => {
      const items: AgendaItem[] = []

      // Add meals at their time slots
      meals.forEach(meal => {
        const mealTime = getMealTime(meal.meal_type)
        if (mealTime === slot.time) {
          const mealType = MEAL_TYPES.find(t => t.id === meal.meal_type)
          items.push({
            id: meal.id,
            title: meal.name,
            subtitle: mealType?.label,
            type: 'meal',
            icon: mealType?.icon || '🍽️',
          })
        }
      })

      // Add workouts at 17:00 (default workout time)
      if (slot.time === '17:00') {
        exercises.forEach(ex => {
          const group = MUSCLE_GROUPS.find(g => g.id === ex.muscle_group)
          items.push({
            id: ex.id,
            title: ex.name,
            subtitle: group?.label + (ex.sets && ex.reps ? ` · ${ex.sets}x${ex.reps}` : ''),
            type: 'workout',
            icon: group?.icon || '🏋️',
          })
        })
      }

      return { ...slot, items }
    })
  }

  const timeSlots = buildTimeSlots()
  const hasAnyEvent = timeSlots.some(s => s.items.length > 0)
  const habitsCompleted = todayHabitLogs.length
  const habitsTotal = habits.length

  // Week days for mini header
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(
      subDays(selectedDate, selectedDate.getDay()),
      i
    )
    return day
  })

  const fullName = profile?.full_name?.split(' ')[0] || 'Usuário'

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {fullName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        {/* Main Layout: Calendar + Tasks/Habits */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* LEFT: Calendar Agenda (3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Calendar Header with week nav */}
              <div className="border-b border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-900">
                    {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedDate(prev => subDays(prev, 1))}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setSelectedDate(new Date())}
                      className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Hoje
                    </button>
                    <button
                      onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Week strip */}
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => {
                    const active = isSameDay(day, selectedDate)
                    const today = isToday(day)
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`flex flex-col items-center gap-0.5 py-2 rounded-xl text-xs transition-all ${
                          active
                            ? 'bg-gray-900 text-white'
                            : today
                            ? 'bg-gray-100 text-gray-700'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-medium">
                          {format(day, 'EEE', { locale: ptBR }).replace('.', '')}
                        </span>
                        <span className={`text-sm font-bold ${active ? 'text-white' : 'text-gray-900'}`}>
                          {format(day, 'd')}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time slots (agenda view) */}
              <div className="max-h-[520px] overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                  </div>
                ) : !hasAnyEvent ? (
                  <div className="text-center py-16 px-4">
                    <div className="text-3xl mb-3">📅</div>
                    <p className="text-sm text-gray-400 mb-1">Nenhum evento para este dia</p>
                    <p className="text-xs text-gray-300">Adicione refeições ou treinos no plano semanal</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {timeSlots.map((slot) => {
                      if (slot.items.length === 0) {
                        return (
                          <div key={slot.time} className="flex items-center gap-3 px-4 py-2">
                            <span className="text-[10px] text-gray-300 w-10 text-right font-mono">{slot.label}</span>
                            <div className="flex-1 h-px bg-gray-50" />
                          </div>
                        )
                      }

                      return (
                        <div key={slot.time} className="flex gap-3 px-4 py-3">
                          <span className="text-[10px] text-gray-400 w-10 text-right font-mono pt-1">{slot.label}</span>
                          <div className="flex-1 space-y-1.5">
                            {slot.items.map((item) => (
                              <div
                                key={item.id}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors ${
                                  item.type === 'meal'
                                    ? 'bg-gray-50 border-gray-100'
                                    : 'bg-gray-50 border-gray-100'
                                }`}
                              >
                                <span className="text-sm">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                                  {item.subtitle && (
                                    <p className="text-[11px] text-gray-400 truncate">{item.subtitle}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Tasks + Habits (2 cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Today's Habits */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Repeat size={14} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Hábitos</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {habitsCompleted}/{habitsTotal}
                  </span>
                  <Link href="/habitos" className="text-xs text-gray-500 hover:text-gray-700">Ver todos</Link>
                </div>
              </div>

              {/* Progress bar */}
              {habitsTotal > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-4">
                  <div
                    className="bg-gray-900 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0}%` }}
                  />
                </div>
              )}

              {habits.length === 0 ? (
                <div className="text-center py-6">
                  <Repeat className="mx-auto text-gray-300" size={28} />
                  <p className="mt-2 text-sm text-gray-400">Nenhum hábito criado</p>
                  <Link href="/habitos/novo" className="mt-2 inline-flex items-center gap-1 text-sm text-gray-900 font-medium hover:underline">
                    <Plus size={14} /> Criar hábito
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {habits.map((habit) => {
                    const isChecked = todayHabitLogs.includes(habit.id)
                    return (
                      <div key={habit.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                        <button
                          onClick={async () => {
                            if (isChecked) {
                              await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('date', dateStr)
                              setTodayHabitLogs(prev => prev.filter(id => id !== habit.id))
                            } else {
                              await supabase.from('habit_logs').insert({
                                habit_id: habit.id,
                                user_id: user!.id,
                                date: dateStr,
                                completed: true,
                              })
                              setTodayHabitLogs(prev => [...prev, habit.id])
                            }
                          }}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                            isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {isChecked && <span className="text-[10px]">&#10003;</span>}
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
                <div className="flex items-center gap-2">
                  <CheckSquare size={14} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Tarefas</h2>
                </div>
                <Link href="/tarefas" className="text-xs text-gray-500 hover:text-gray-700">Ver todas</Link>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-6">
                  <CheckSquare className="mx-auto text-gray-300" size={28} />
                  <p className="mt-2 text-sm text-gray-400">Nenhuma tarefa pendente</p>
                  <Link href="/tarefas/nova" className="mt-2 inline-flex items-center gap-1 text-sm text-gray-900 font-medium hover:underline">
                    <Plus size={14} /> Criar tarefa
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/tarefas/${task.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          task.priority === 'high' ? 'bg-red-400' : task.priority === 'medium' ? 'bg-yellow-400' : 'bg-gray-300'
                        }`} />
                        <span className="text-sm text-gray-700 truncate">{task.title}</span>
                      </div>
                      {task.due_date && (
                        <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                          {format(new Date(task.due_date), 'dd/MM')}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/alimentacao"
                className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 text-sm text-gray-600 hover:border-gray-200 transition-colors"
              >
                <UtensilsCrossed size={14} className="text-gray-400" />
                <span>Dieta</span>
              </Link>
              <Link
                href="/treinos"
                className="flex items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 text-sm text-gray-600 hover:border-gray-200 transition-colors"
              >
                <Dumbbell size={14} className="text-gray-400" />
                <span>Treinos</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
