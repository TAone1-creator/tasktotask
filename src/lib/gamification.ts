export const LEVELS = [
  { level: 1, name: 'Ponto de Partida', xpRequired: 0, description: 'Acabou de chegar' },
  { level: 2, name: 'Primeiros Passos', xpRequired: 100, description: 'Começou a se organizar' },
  { level: 3, name: 'Ganhando Ritmo', xpRequired: 300, description: 'Criando consistência' },
  { level: 4, name: 'Em Movimento', xpRequired: 600, description: 'Hábitos e metas em andamento' },
  { level: 5, name: 'Foco Claro', xpRequired: 1000, description: 'Clareza sobre prioridades' },
  { level: 6, name: 'Estruturado', xpRequired: 1500, description: 'Rotina e finanças sob controle' },
  { level: 7, name: 'Consistente', xpRequired: 2200, description: 'Mantém o ritmo sem esforço' },
  { level: 8, name: 'Quase Lá', xpRequired: 3000, description: 'Próximo da autonomia total' },
  { level: 9, name: 'Autônomo', xpRequired: 4000, description: 'Não depende mais do sistema' },
  { level: 10, name: 'Livre', xpRequired: 5000, description: 'Missão cumprida' },
]

export const XP_VALUES = {
  HABIT_CHECK: 5,
  TASK_COMPLETE: 10,
  GOAL_COMPLETE: 100,
  FINANCIAL_RECORD: 3,
  STREAK_7_DAYS: 50,
  STREAK_30_DAYS: 200,
  SAVINGS_BOX_COMPLETE: 75,
}

export function getLevelInfo(xp: number) {
  let currentLevel = LEVELS[0]
  let nextLevel = LEVELS[1]

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      currentLevel = LEVELS[i]
      nextLevel = LEVELS[i + 1] || null
      break
    }
  }

  const xpInCurrentLevel = xp - currentLevel.xpRequired
  const xpForNextLevel = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 0
  const progressPercent = nextLevel ? (xpInCurrentLevel / xpForNextLevel) * 100 : 100

  return {
    currentLevel,
    nextLevel,
    xpInCurrentLevel,
    xpForNextLevel,
    progressPercent: Math.min(progressPercent, 100),
  }
}

export const BADGE_DEFINITIONS = [
  { type: 'first_goal', name: 'Primeira Meta', description: 'Concluiu a primeira meta' },
  { type: 'streak_7', name: '7 Dias Seguidos', description: '7 dias consecutivos de hábito' },
  { type: 'streak_30', name: '30 Dias Seguidos', description: '30 dias consecutivos de hábito' },
  { type: 'savings_complete', name: 'Caixinha Completa', description: 'Completou uma caixinha financeira' },
  { type: 'tasks_10', name: '10 Tarefas', description: 'Completou 10 tarefas' },
  { type: 'tasks_50', name: '50 Tarefas', description: 'Completou 50 tarefas' },
  { type: 'financial_30', name: '30 Registros', description: '30 registros financeiros' },
  { type: 'all_modules', name: 'Completo', description: 'Usou todos os módulos' },
]
