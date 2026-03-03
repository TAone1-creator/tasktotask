'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, CheckSquare, LayoutList, LayoutGrid, ChevronDown, ChevronRight, Repeat, Search } from 'lucide-react'
import { format } from 'date-fns'
import { TASK_CATEGORIES } from '@/lib/constants'
import type { Task } from '@/types/database'

export default function TarefasPage() {
  const { user, supabase } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!user) return
    const fetchTasks = async () => {
      const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).eq('status', filter).order('priority', { ascending: true }).order('due_date', { ascending: true })
      setTasks(data || [])
      setLoading(false)
    }
    fetchTasks()
  }, [user, filter])

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    if (newStatus === 'completed') {
      const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user!.id).single()
      if (profile) await supabase.from('profiles').update({ xp: profile.xp + 10 }).eq('id', user!.id)
    }
    setTasks(prev => prev.filter(t => t.id !== task.id))
  }

  const filteredTasks = tasks.filter(t => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const groupedTasks = TASK_CATEGORIES.reduce((acc, cat) => {
    const catTasks = filteredTasks.filter(t => t.category === cat)
    if (catTasks.length > 0) acc[cat] = catTasks
    return acc
  }, {} as Record<string, Task[]>)

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n })
  }

  const priorityConfig: Record<string, { label: string; color: string }> = {
    high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
    medium: { label: 'Média', color: 'bg-yellow-100 text-yellow-700' },
    low: { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
  }
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'A fazer', color: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Concluída', color: 'bg-green-100 text-green-700' },
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
            <p className="text-sm text-gray-500 mt-1">{filteredTasks.length} tarefas {filter === 'pending' ? 'pendentes' : 'concluídas'}</p>
          </div>
          <Link href="/tarefas/nova" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <Plus size={16} /> Nova tarefa
          </Link>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Pendentes</button>
              <button onClick={() => setFilter('completed')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Concluídas</button>
            </div>
            <div className="w-px h-6 bg-gray-200 hidden sm:block" />
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setCategoryFilter('all')} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${categoryFilter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Todas</button>
              {TASK_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>{cat}</button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-40" />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`} title="Lista"><LayoutList size={16} className={viewMode === 'table' ? 'text-gray-900' : 'text-gray-400'} /></button>
              <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white shadow-sm' : ''}`} title="Quadro"><LayoutGrid size={16} className={viewMode === 'cards' ? 'text-gray-900' : 'text-gray-400'} /></button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <CheckSquare className="mx-auto text-gray-300" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">{filter === 'pending' ? 'Nenhuma tarefa pendente' : 'Nenhuma tarefa concluída'}</h3>
            <p className="mt-2 text-sm text-gray-500">{filter === 'pending' ? 'Crie tarefas para apoiar suas metas.' : 'Complete tarefas para vê-las aqui.'}</p>
            {filter === 'pending' && <Link href="/tarefas/nova" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Criar tarefa</Link>}
          </div>
        ) : viewMode === 'table' ? (
          <div className="space-y-4">
            {Object.entries(groupedTasks).map(([cat, catTasks]) => (
              <div key={cat} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <button onClick={() => toggleCategory(cat)} className="w-full flex items-center gap-3 px-5 py-3 bg-gray-50/80 border-b border-gray-100 hover:bg-gray-100/80 transition-colors text-left">
                  {collapsedCategories.has(cat) ? <ChevronRight size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  <span className="text-sm font-semibold text-gray-900">{cat}</span>
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{catTasks.length}</span>
                </button>
                {!collapsedCategories.has(cat) && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-gray-100">
                        <th className="w-10 px-4 py-2.5" />
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Vencimento</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Prioridade</th>
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Recorrência</th>
                      </tr></thead>
                      <tbody>
                        {catTasks.map((task) => (
                          <tr key={task.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3">
                              <button onClick={() => toggleTask(task)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'}`}>
                                {task.status === 'completed' && <span className="text-[10px]">&#10003;</span>}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <Link href={`/tarefas/${task.id}`} className="text-sm font-medium text-gray-900 hover:underline">{task.title}</Link>
                              {task.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{task.description}</p>}
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell"><span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${statusConfig[task.status].color}`}>{statusConfig[task.status].label}</span></td>
                            <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : <span className="text-gray-300">&mdash;</span>}</td>
                            <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${priorityConfig[task.priority].color}`}>{priorityConfig[task.priority].label}</span></td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              {task.recurrence !== 'none' ? <span className="flex items-center gap-1 text-xs text-gray-500"><Repeat size={12} />{task.recurrence === 'daily' ? 'Diária' : task.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}</span> : <span className="text-gray-300 text-xs">&mdash;</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleTask(task)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'}`}>
                      {task.status === 'completed' && <span className="text-[10px]">&#10003;</span>}
                    </button>
                    <Link href={`/tarefas/${task.id}`} className="text-sm font-medium text-gray-900 hover:underline">{task.title}</Link>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${priorityConfig[task.priority].color}`}>{priorityConfig[task.priority].label}</span>
                </div>
                {task.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2 ml-7">{task.description}</p>}
                <div className="flex items-center gap-2 text-xs text-gray-400 ml-7">
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">{task.category}</span>
                  {task.due_date && <span>Vence {format(new Date(task.due_date), 'dd/MM')}</span>}
                  {task.recurrence !== 'none' && <span className="flex items-center gap-1"><Repeat size={10} /></span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
