'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { MEAL_TYPES, WEEKDAYS } from '@/lib/constants'

export default function NovaRefeicaoPage() {
  const { user, supabase } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultDay = searchParams.get('day')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mealType, setMealType] = useState('breakfast')
  const [calories, setCalories] = useState('')
  const [selectedDays, setSelectedDays] = useState<number[]>(
    defaultDay !== null ? [parseInt(defaultDay)] : []
  )
  const [saving, setSaving] = useState(false)

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
    try {
      const inserts = selectedDays.map(day => ({
        user_id: user.id,
        meal_type: mealType,
        day_of_week: day,
        name: name.trim(),
        description: description.trim() || null,
        calories: calories ? parseInt(calories) : null,
      }))

      await supabase.from('diet_meals').insert(inserts)
      router.push('/alimentacao')
    } catch (err) {
      console.error('Error creating meal:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/alimentacao"
            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nova Refeição</h1>
            <p className="text-xs text-gray-500 mt-0.5">Adicione ao seu plano alimentar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome da refeição *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Omelete com aveia"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Descrição <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: 3 ovos, 40g de aveia, 1 banana"
              rows={2}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors resize-none"
            />
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tipo de refeição *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setMealType(type.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                    mealType === type.id
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>{type.icon}</span>
                  <span className="truncate">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Calories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Calorias <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="Ex: 350"
                min="0"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-colors"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">kcal</span>
            </div>
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

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !name.trim() || selectedDays.length === 0}
            className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Salvando...' : 'Adicionar refeição'}
          </button>
        </form>
      </div>
    </AppLayout>
  )
}
