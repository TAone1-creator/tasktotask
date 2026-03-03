'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { LIFE_CONTEXTS, CYCLE_OPTIONS } from '@/lib/constants'
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'

type Step = 'welcome' | 'context' | 'cycle' | 'first_goal' | 'first_habit' | 'complete'

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome')
  const [context, setContext] = useState('')
  const [cycleMonths, setCycleMonths] = useState(3)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalType, setGoalType] = useState<'financial' | 'habit' | 'task' | 'hybrid'>('task')
  const [goalDeadline, setGoalDeadline] = useState('')
  const [habitName, setHabitName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { supabase, user, refreshProfile } = useAuth()

  useEffect(() => {
    const d = new Date(); d.setMonth(d.getMonth() + 3)
    setGoalDeadline(d.toISOString().split('T')[0])
  }, [])

  const [error, setError] = useState('')

  const handleComplete = async () => {
    if (!user) return
    setLoading(true)
    setError('')

    try {
      const cycleStart = new Date()
      const cycleEnd = new Date()
      cycleEnd.setMonth(cycleEnd.getMonth() + cycleMonths)

      await supabase.from('profiles').update({
        context, cycle_months: cycleMonths,
        cycle_start_date: cycleStart.toISOString().split('T')[0],
        cycle_end_date: cycleEnd.toISOString().split('T')[0],
        onboarding_completed: true,
      }).eq('id', user.id)

      if (goalTitle) await supabase.from('goals').insert({ user_id: user.id, title: goalTitle, type: goalType, deadline: goalDeadline })
      if (habitName) await supabase.from('habits').insert({ user_id: user.id, name: habitName, frequency: 'daily' })

      await refreshProfile()
      router.push('/dashboard')
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const steps: Record<Step, React.ReactNode> = {
    welcome: (
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6"><Sparkles className="text-white" size={28} /></div>
        <h2 className="text-3xl font-bold text-gray-900">Bem-vindo ao reestrutura</h2>
        <p className="mt-4 text-gray-500 max-w-md mx-auto leading-relaxed">Isso aqui é temporário. Nosso objetivo é que você não precise mais de nós. Vamos configurar seu espaço juntos.</p>
        <button onClick={() => setStep('context')} className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors">Vamos começar <ArrowRight size={18} /></button>
      </div>
    ),
    context: (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900">O que está acontecendo na sua vida agora?</h2>
        <p className="mt-2 text-gray-500">Isso nos ajuda a entender seu momento.</p>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LIFE_CONTEXTS.map((ctx) => (<button key={ctx.id} onClick={() => setContext(ctx.id)} className={`p-4 rounded-xl border text-left text-sm font-medium transition-all ${context === ctx.id ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{ctx.label}</button>))}
        </div>
        <div className="mt-8 flex justify-between">
          <button onClick={() => setStep('welcome')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Voltar</button>
          <button onClick={() => setStep('cycle')} disabled={!context} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-30">Continuar <ArrowRight size={16} /></button>
        </div>
      </div>
    ),
    cycle: (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900">Defina seu horizonte</h2>
        <p className="mt-2 text-gray-500">Por quanto tempo você quer usar a plataforma?</p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CYCLE_OPTIONS.map((opt) => (<button key={opt.months} onClick={() => setCycleMonths(opt.months)} className={`p-4 rounded-xl border text-center font-medium transition-all ${cycleMonths === opt.months ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}><span className="text-2xl font-bold block">{opt.months}</span><span className="text-xs text-gray-500">meses</span></button>))}
        </div>
        <div className="mt-8 flex justify-between">
          <button onClick={() => setStep('context')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Voltar</button>
          <button onClick={() => setStep('first_goal')} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">Continuar <ArrowRight size={16} /></button>
        </div>
      </div>
    ),
    first_goal: (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900">Crie sua primeira meta</h2>
        <p className="mt-2 text-gray-500">Metas são o eixo central da plataforma.</p>
        <div className="mt-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">O que você quer alcançar?</label><input type="text" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Ex: Juntar R$ 5.000 para emergência" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo da meta</label>
            <div className="grid grid-cols-2 gap-2">{[{ value: 'financial' as const, label: 'Financeira' },{ value: 'habit' as const, label: 'De hábito' },{ value: 'task' as const, label: 'De tarefa' },{ value: 'hybrid' as const, label: 'Híbrida' }].map((t) => (<button key={t.value} onClick={() => setGoalType(t.value)} className={`p-3 rounded-lg border text-sm font-medium transition-all ${goalType === t.value ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>{t.label}</button>))}</div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label><input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
        </div>
        <div className="mt-8 flex justify-between">
          <button onClick={() => setStep('cycle')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Voltar</button>
          <button onClick={() => setStep('first_habit')} disabled={!goalTitle} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-30">Continuar <ArrowRight size={16} /></button>
        </div>
      </div>
    ),
    first_habit: (
      <div className="animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900">Crie seu primeiro hábito</h2>
        <p className="mt-2 text-gray-500">Comece com algo simples que você possa manter todos os dias.</p>
        <div className="mt-6"><label className="block text-sm font-medium text-gray-700 mb-1">Nome do hábito</label><input type="text" value={habitName} onChange={(e) => setHabitName(e.target.value)} placeholder="Ex: Ler 15 minutos, Meditar, Exercício" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" /></div>
        <div className="mt-8 flex justify-between">
          <button onClick={() => setStep('first_goal')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><ArrowLeft size={16} /> Voltar</button>
          <button onClick={() => setStep('complete')} disabled={!habitName} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-30">Continuar <ArrowRight size={16} /></button>
        </div>
      </div>
    ),
    complete: (
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6"><Sparkles className="text-white" size={28} /></div>
        <h2 className="text-3xl font-bold text-gray-900">Tudo pronto!</h2>
        <p className="mt-4 text-gray-500 max-w-md mx-auto">Seu espaço está configurado. Agora é com você.</p>
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
        <button onClick={handleComplete} disabled={loading} className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50">{loading ? 'Preparando...' : 'Ir para o Dashboard'}</button>
      </div>
    ),
  }

  const stepOrder: Step[] = ['welcome', 'context', 'cycle', 'first_goal', 'first_habit', 'complete']
  const progress = ((stepOrder.indexOf(step)) / (stepOrder.length - 1)) * 100

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="w-full bg-gray-100 h-1"><div className="bg-gray-900 h-1 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      <div className="flex-1 flex items-center justify-center px-6 py-12"><div className="w-full max-w-lg">{steps[step]}</div></div>
    </div>
  )
}
