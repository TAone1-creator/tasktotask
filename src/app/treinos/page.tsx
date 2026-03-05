'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Dumbbell, Sparkles } from 'lucide-react'
import { MUSCLE_GROUPS, WEEKDAYS } from '@/lib/constants'
import type { WorkoutExercise } from '@/types/database'

export default function TreinosPage() {
  const { user, supabase } = useAuth()
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay())

  useEffect(() => {
    if (!user) return
    const fetchExercises = async () => {
      try {
        const { data } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('user_id', user.id)
          .order('muscle_group')
        setExercises((data || []) as WorkoutExercise[])
      } catch (err) {
        console.error('Error loading workout exercises:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchExercises()
  }, [user?.id, supabase])

  const handleDelete = async (id: string) => {
    await supabase.from('workout_exercises').delete().eq('id', id)
    setExercises(prev => prev.filter(e => e.id !== id))
  }

  const dayExercises = exercises.filter(e => e.day_of_week === selectedDay)
  const todayIndex = new Date().getDay()
  const totalExercises = dayExercises.length

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Treinos</h1>
            <p className="text-sm text-gray-500 mt-1">Seu plano de treino semanal</p>
          </div>
          <Link
            href="/treinos/novo-exercicio"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} /> Adicionar
          </Link>
        </div>

        {/* AI Coming Soon Banner */}
        <div className="mb-6 p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <Sparkles size={18} className="text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Treino com IA — Em breve</p>
              <p className="text-xs text-gray-400 mt-0.5">Futuramente, uma IA poderá montar seu treino personalizado</p>
            </div>
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {WEEKDAYS.map((day) => (
            <button
              key={day.id}
              onClick={() => setSelectedDay(day.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-medium transition-all min-w-[52px] ${
                selectedDay === day.id
                  ? 'bg-gray-900 text-white'
                  : day.id === todayIndex
                  ? 'bg-gray-100 text-gray-700 ring-1 ring-gray-300'
                  : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'
              }`}
            >
              <span>{day.short}</span>
              {day.id === todayIndex && selectedDay !== day.id && (
                <div className="w-1 h-1 rounded-full bg-gray-400" />
              )}
            </button>
          ))}
        </div>

        {/* Exercise Count Summary */}
        {totalExercises > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-white border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Exercícios do dia</span>
              <span className="text-lg font-bold text-gray-900">{totalExercises} exercícios</span>
            </div>
          </div>
        )}

        {/* Exercises by Muscle Group */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
          </div>
        ) : dayExercises.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell className="mx-auto text-gray-300" size={40} />
            <p className="mt-3 text-sm text-gray-400">
              Nenhum exercício para {WEEKDAYS[selectedDay].label.toLowerCase()}
            </p>
            <Link
              href={`/treinos/novo-exercicio?day=${selectedDay}`}
              className="mt-3 inline-block text-sm text-gray-900 font-medium hover:underline"
            >
              Adicionar exercício
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {MUSCLE_GROUPS.map((group) => {
              const groupExercises = dayExercises.filter(e => e.muscle_group === group.id)
              if (groupExercises.length === 0) return null

              return (
                <div key={group.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                    <span className="text-base">{group.icon}</span>
                    <h3 className="text-sm font-semibold text-gray-700">{group.label}</h3>
                    <span className="text-xs text-gray-400 ml-auto">
                      {groupExercises.length} exercício{groupExercises.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {groupExercises.map((exercise) => (
                      <div key={exercise.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{exercise.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {exercise.sets && exercise.reps && (
                              <span className="text-xs text-gray-400">
                                {exercise.sets}x{exercise.reps}
                              </span>
                            )}
                            {exercise.rest_seconds && (
                              <span className="text-xs text-gray-400">
                                {exercise.rest_seconds}s descanso
                              </span>
                            )}
                          </div>
                          {exercise.notes && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{exercise.notes}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(exercise.id)}
                          className="p-1.5 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
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
