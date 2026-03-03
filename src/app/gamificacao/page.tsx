'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { Trophy, Star, Target, Zap, Award } from 'lucide-react'
import { LEVELS, getLevelInfo, BADGE_DEFINITIONS } from '@/lib/gamification'
import type { Badge } from '@/types/database'

export default function GamificacaoPage() {
  const { user, profile, supabase } = useAuth()
  const [badges, setBadges] = useState<Badge[]>([])
  const [stats, setStats] = useState({
    goalsCompleted: 0,
    tasksCompleted: 0,
    habitStreak: 0,
    financialRecords: 0,
  })

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const [badgesRes, goalsRes, tasksRes, txRes] = await Promise.all([
        supabase.from('badges').select('*').eq('user_id', user.id).order('earned_at', { ascending: false }),
        supabase.from('goals').select('id').eq('user_id', user.id).eq('status', 'completed'),
        supabase.from('tasks').select('id').eq('user_id', user.id).eq('status', 'completed'),
        supabase.from('transactions').select('id').eq('user_id', user.id),
      ])

      setBadges(badgesRes.data || [])
      setStats({
        goalsCompleted: (goalsRes.data || []).length,
        tasksCompleted: (tasksRes.data || []).length,
        habitStreak: 0,
        financialRecords: (txRes.data || []).length,
      })
    }
    fetchData()
  }, [user])

  const levelInfo = getLevelInfo(profile?.xp ?? 0)

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Progresso</h1>
          <p className="text-sm text-gray-500 mt-1">Sua jornada rumo à autonomia</p>
        </div>

        {/* Current Level */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{levelInfo.currentLevel.level}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{levelInfo.currentLevel.name}</h2>
              <p className="text-sm text-gray-500">{levelInfo.currentLevel.description}</p>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">{profile?.xp ?? 0} XP</span>
              {levelInfo.nextLevel && (
                <span className="text-gray-400">{levelInfo.nextLevel.xpRequired} XP</span>
              )}
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className="bg-gray-900 h-3 rounded-full transition-all duration-700"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>
          {levelInfo.nextLevel && (
            <p className="text-xs text-gray-400">
              Faltam {levelInfo.xpForNextLevel - levelInfo.xpInCurrentLevel} XP para Nível {levelInfo.nextLevel.level} — {levelInfo.nextLevel.name}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Target className="mx-auto text-gray-400 mb-2" size={20} />
            <p className="text-2xl font-bold text-gray-900">{stats.goalsCompleted}</p>
            <p className="text-xs text-gray-500">Metas concluídas</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Zap className="mx-auto text-gray-400 mb-2" size={20} />
            <p className="text-2xl font-bold text-gray-900">{stats.tasksCompleted}</p>
            <p className="text-xs text-gray-500">Tarefas completadas</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Star className="mx-auto text-gray-400 mb-2" size={20} />
            <p className="text-2xl font-bold text-gray-900">{badges.length}</p>
            <p className="text-xs text-gray-500">Conquistas</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <Award className="mx-auto text-gray-400 mb-2" size={20} />
            <p className="text-2xl font-bold text-gray-900">{stats.financialRecords}</p>
            <p className="text-xs text-gray-500">Registros financeiros</p>
          </div>
        </div>

        {/* Level Roadmap */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Roadmap de Níveis</h2>
          <div className="space-y-3">
            {LEVELS.map((level) => {
              const isCurrentOrPast = (profile?.xp ?? 0) >= level.xpRequired
              const isCurrent = levelInfo.currentLevel.level === level.level
              return (
                <div key={level.level} className={`flex items-center gap-4 p-3 rounded-lg ${isCurrent ? 'bg-gray-50 border border-gray-200' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    isCurrentOrPast ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {level.level}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCurrentOrPast ? 'text-gray-900' : 'text-gray-400'}`}>
                      {level.name}
                    </p>
                    <p className="text-xs text-gray-400">{level.description}</p>
                  </div>
                  <span className="text-xs text-gray-400">{level.xpRequired} XP</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Badges */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Conquistas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BADGE_DEFINITIONS.map((badgeDef) => {
              const earned = badges.find(b => b.badge_type === badgeDef.type)
              return (
                <div
                  key={badgeDef.type}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    earned ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100 bg-gray-50 opacity-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                    earned ? 'bg-yellow-400' : 'bg-gray-200'
                  }`}>
                    <Trophy size={18} className={earned ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <p className="text-xs font-semibold text-gray-900">{badgeDef.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{badgeDef.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
