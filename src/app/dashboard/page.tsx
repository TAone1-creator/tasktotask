'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState, useMemo } from 'react'
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
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Habit, Task, DietMeal, WorkoutExercise } from '@/types/database'
import { MEAL_TYPES, MUSCLE_GROUPS } from '@/lib/constants'

const WEEKDAY_HEADERS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']

export default function DashboardPage() {
  const { profile, supabase, user } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [habits, setHabits] = useState<Habit[]>([])
  const [todayHabitLogs, setTodayHabitLogs] = useState<string[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [allMeals, setAllMeals] = useState<DietMeal[]>([])
  const [allExercises, setAllExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [habitsRes, logsRes, tasksRes, mealsRes, exercisesRes] = await Promise.all([
          supabase.from('habits').select('*').eq('user_id', user.id).eq('status', 'active'),
          supabase.from('habit_logs').select('*').eq('user_id', user.id).eq('date', todayStr).eq('completed', true),
          supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', 'pending').order('priority'),
          supabase.from('diet_meals').select('*').eq('user_id', user.id).order('meal_type'),
          supabase.from('workout_exercises').select('*').eq('user_id', user.id).order('muscle_group'),
        ])

        setHabits((habitsRes.data || []) as Habit[])
        setTodayHabitLogs((logsRes.data || []).map((l: any) => l.habit_id))
        setTasks((tasksRes.data || []) as Task[])
        setAllMeals((mealsRes.data || []) as DietMeal[])
        setAllExercises((exercisesRes.data || []) as WorkoutExercise[])
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id, supabase, todayStr])

  // Build calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days: Date[] = []
    let day = calStart
    while (day <= calEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentMonth])

  // Get events for a given day of week
  const getEventsForDay = (date: Date) => {
    const dow = date.getDay()
    const events: { label: string; color: string }[] = []

    const dayMeals = allMeals.filter(m => m.day_of_week === dow)
    const dayExercises = allExercises.filter(e => e.day_of_week === dow)

    if (dayMeals.length > 0) {
      events.push({ label: `${dayMeals.length} refeições`, color: 'bg-green-500' })
    }
    if (dayExercises.length > 0) {
      events.push({ label: `${dayExercises.length} exercícios`, color: 'bg-blue-500' })
    }

    // Tasks with due date matching this day
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayTasks = tasks.filter(t => t.due_date === dateStr)
    if (dayTasks.length > 0) {
      events.push({ label: `${dayTasks.length} tarefa${dayTasks.length > 1 ? 's' : ''}`, color: 'bg-yellow-500' })
    }

    return events
  }

  // Today's specific data for right panel
  const todayDow = today.getDay()
  const todayMeals = allMeals.filter(m => m.day_of_week === todayDow)
  const todayExercises = allExercises.filter(e => e.day_of_week === todayDow)
  const habitsCompleted = todayHabitLogs.length
  const habitsTotal = habits.length

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
            {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* LEFT: Monthly Calendar (3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Month Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hoje
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                      className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                      className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                <h2 className="text-sm font-semibold text-gray-900 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h2>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-gray-100">
                {WEEKDAY_HEADERS.map((header) => (
                  <div key={header} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {header}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const inMonth = isSameMonth(day, currentMonth)
                  const isSelected = isToday(day)
                  const events = inMonth ? getEventsForDay(day) : []
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6

                  return (
                    <div
                      key={idx}
                      className={`min-h-[110px] border-b border-r border-gray-50 p-2 transition-colors ${
                        !inMonth ? 'bg-gray-50/50' : 'bg-white hover:bg-gray-50/50'
                      } ${idx % 7 === 0 ? 'border-l-0' : ''}`}
                    >
                      {/* Day number */}
                      <div className="flex items-center justify-end mb-1.5">
                        <span
                          className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                            isSelected
                              ? 'bg-gray-900 text-white'
                              : !inMonth
                              ? 'text-gray-300'
                              : isWeekend
                              ? 'text-gray-400'
                              : 'text-gray-700'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>

                      {/* Events */}
                      <div className="space-y-1">
                        {events.map((event, i) => (
                          <div
                            key={i}
                            className={`${event.color} text-white text-[10px] font-medium px-2 py-1 rounded truncate leading-tight`}
                          >
                            {event.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Today's Focus (2 cols) */}
          <div className="lg:col-span-2 space-y-4">

            {/* Today's Habits */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Repeat size={14} className="text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-900">Hábitos de Hoje</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {habitsCompleted}/{habitsTotal}
                  </span>
                  <Link href="/habitos" className="text-xs text-gray-500 hover:text-gray-700">Ver todos</Link>
                </div>
              </div>

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
                <div className="space-y-1">
                  {habits.map((habit) => {
                    const isChecked = todayHabitLogs.includes(habit.id)
                    return (
                      <div key={habit.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                        <button
                          onClick={async () => {
                            if (isChecked) {
                              await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('date', todayStr)
                              setTodayHabitLogs(prev => prev.filter(id => id !== habit.id))
                            } else {
                              await supabase.from('habit_logs').insert({
                                habit_id: habit.id,
                                user_id: user!.id,
                                date: todayStr,
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
                  <h2 className="text-sm font-semibold text-gray-900">Tarefas Pendentes</h2>
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
                <div className="space-y-1">
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

            {/* Today's Schedule Summary */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Resumo do Dia</h2>
              <div className="space-y-2">
                <Link href="/alimentacao" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <UtensilsCrossed size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">Refeições</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{todayMeals.length} planejadas</span>
                </Link>
                <Link href="/treinos" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Dumbbell size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-700">Exercícios</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500">{todayExercises.length} planejados</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
