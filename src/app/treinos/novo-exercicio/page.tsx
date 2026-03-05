'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { MUSCLE_GROUPS, WEEKDAYS } from '@/lib/constants'

function NovoExercicioForm() {
  const { user, supabase } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultDay = searchParams.get('day')

  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('chest')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [restSeconds, setRestSeconds] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>(
    defaultDay !== null ? [parseInt(defaultDay)] : []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    )
  }

  const selectAllDays = () => {
    if (selectedDays.length === 7) {
      setSelectedDays([])
    } else {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim() || selectedDays.length === 0) return

    setSaving(true)
    setError('')
    try {
      const inserts = selectedDays.map(day => ({
        user_id: user.id,
        muscle_group: muscleGroup,
        day_of_week: day,
        name: name.trim(),
        sets: sets ? parseInt(sets) : null,
        reps: reps.trim() || null,
        rest_seconds: restSeconds ? parseInt(restSeconds) : null,
        notes: notes.trim() || null,
      }))

      const { error: dbError } = await supabase.from('workout_exercises').insert(inserts)
      if (dbError) {
        setError(dbError.message)
        return
      }
      router.push('/treinos')
    } catch (err) {
      setError('Erro ao salvar exercício. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/treinos"
          className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Novo Exercício</h1>
          <p className="text-xs text-gray-500 mt-0.5">Adicione ao seu plano de treino</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome do exercício *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Supino reto"
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
            required
          />
        </div>

        {/* Muscle Group */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Grupo muscular *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setMuscleGroup(group.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  muscleGroup === group.id
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <span>{group.icon}</span>
                <span className="truncate">{group.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sets & Reps */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Séries
            </label>
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder="Ex: 4"
              min="1"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Repetições
            </label>
            <input
              type="text"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="Ex: 12 ou 8-12"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
            />
          </div>
        </div>

        {/* Rest */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Descanso <span className="text-gray-400 font-normal">(segundos)</span>
          </label>
          <div className="relative">
            <input
              type="number"
              value={restSeconds}
              onChange={(e) => setRestSeconds(e.target.value)}
              placeholder="Ex: 60"
              min="0"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">seg</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Observações <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Pegar mais pesado na última série"
            rows={2}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors resize-none"
          />
        </div>

        {/* Days of Week */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Dias da semana *
            </label>
            <button
              type="button"
              onClick={selectAllDays}
              className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {selectedDays.length === 7 ? 'Desmarcar todos' : 'Todos os dias'}
            </button>
          </div>
          <div className="flex gap-1.5">
            {WEEKDAYS.map((day) => (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleDay(day.id)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  selectedDays.includes(day.id)
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {day.short}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || !name.trim() || selectedDays.length === 0}
          className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Salvando...' : 'Adicionar exercício'}
        </button>
      </form>
    </div>
  )
}

export default function NovoExercicioPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>}>
        <NovoExercicioForm />
      </Suspense>
    </AppLayout>
  )
}
