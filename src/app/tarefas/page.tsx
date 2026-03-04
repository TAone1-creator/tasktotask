'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, CheckSquare, LayoutList, LayoutGrid, Columns3, ChevronDown, ChevronRight, Repeat, Search, Check, RotateCcw } from 'lucide-react'
import { format, isToday, isBefore, startOfDay } from 'date-fns'
import { TASK_CATEGORIES } from '@/lib/constants'
import type { Task } from '@/types/database'

type KanbanStatus = 'pendente' | 'a_fazer' | 'em_atraso' | 'concluida'

const KANBAN_COLUMNS: { key: KanbanStatus; label: string; headerColor: string; dotColor: string; emptyMsg: string }[] = [
  { key: 'pendente', label: 'Pendente', headerColor: 'text-gray-700', dotColor: 'bg-gray-400', emptyMsg: 'Nenhuma tarefa pendente' },
  { key: 'a_fazer', label: 'A fazer', headerColor: 'text-blue-700', dotColor: 'bg-blue-500', emptyMsg: 'Nada para hoje' },
  { key: 'em_atraso', label: 'Em atraso', headerColor: 'text-red-700', dotColor: 'bg-red-500', emptyMsg: 'Sem atrasos' },
  { key: 'concluida', label: 'Concluida', headerColor: 'text-green-700', dotColor: 'bg-green-500', emptyMsg: 'Nenhuma concluida' },
]

function getKanbanStatus(task: Task): KanbanStatus {
  if (task.status === 'completed') return 'concluida'
  if (task.due_date) {
    const dueDate = new Date(task.due_date + 'T00:00:00')
    if (isToday(dueDate)) return 'a_fazer'
    if (isBefore(startOfDay(dueDate), startOfDay(new Date()))) return 'em_atraso'
  }
  return 'pendente'
}

export default function TarefasPage() {
  const { user, supabase } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'kanban'>('table')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null)

  useEffect(() => {
    if (!user) return
    const fetchTasks = async () => {
      setLoading(true)
      let query = supabase.from('tasks').select('*').eq('user_id', user.id)
      if (viewMode !== 'kanban') {
        query = query.eq('status', filter)
      }
      const { data } = await query.order('priority', { ascending: true }).order('due_date', { ascending: true })
      setTasks(data || [])
      setLoading(false)
    }
    fetchTasks()
  }, [user, filter, viewMode, supabase])

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    if (newStatus === 'completed') {
      const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user!.id).single()
      if (profile) await supabase.from('profiles').update({ xp: profile.xp + 10 }).eq('id', user!.id)
    }
    if (viewMode === 'kanban') {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    } else {
      setTasks(prev => prev.filter(t => t.id !== task.id))
    }
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

  const kanbanTasks = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col.key] = filteredTasks.filter(t => getKanbanStatus(t) === col.key)
    return acc
  }, {} as Record<KanbanStatus, Task[]>)

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n })
  }

  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId)
  }

  const handleDragOver = (e: React.DragEvent, column: KanbanStatus) => {
    e.preventDefault()
    setDragOverColumn(column)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (targetColumn: KanbanStatus) => {
    setDragOverColumn(null)
    if (!draggedTaskId) return
    const task = tasks.find(t => t.id === draggedTaskId)
    setDraggedTaskId(null)
    if (!task) return

    const currentColumn = getKanbanStatus(task)
    if (currentColumn === targetColumn) return

    if (targetColumn === 'concluida' && task.status === 'pending') {
      toggleTask(task)
    } else if (targetColumn !== 'concluida' && task.status === 'completed') {
      toggleTask(task)
    }
  }

  const priorityConfig: Record<string, { label: string; color: string }> = {
    high: { label: 'Alta', color: 'bg-red-100 text-red-700' },
    medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-700' },
    low: { label: 'Baixa', color: 'bg-gray-100 text-gray-600' },
  }
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'A fazer', color: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Concluida', color: 'bg-green-100 text-green-700' },
  }

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
            <p className="text-sm text-gray-500 mt-1">
              {viewMode === 'kanban'
                ? `${filteredTasks.length} tarefas no total`
                : `${filteredTasks.length} tarefas ${filter === 'pending' ? 'pendentes' : 'concluidas'}`
              }
            </p>
          </div>
          <Link href="/tarefas/nova" className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <Plus size={16} /> Nova tarefa
          </Link>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-gray-100 p-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {viewMode !== 'kanban' && (
              <>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Pendentes</button>
                  <button onClick={() => setFilter('completed')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'completed' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Concluidas</button>
                </div>
                <div className="w-px h-6 bg-gray-200 hidden sm:block" />
              </>
            )}
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
              <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white shadow-sm' : ''}`} title="Cards"><LayoutGrid size={16} className={viewMode === 'cards' ? 'text-gray-900' : 'text-gray-400'} /></button>
              <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`} title="Kanban"><Columns3 size={16} className={viewMode === 'kanban' ? 'text-gray-900' : 'text-gray-400'} /></button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12"><div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : viewMode === 'kanban' ? (
          /* Kanban View */
          filteredTasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
              <Columns3 className="mx-auto text-gray-300" size={48} />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Nenhuma tarefa encontrada</h3>
              <p className="mt-2 text-sm text-gray-500">Crie tarefas para visualizar no Kanban.</p>
              <Link href="/tarefas/nova" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Criar tarefa</Link>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {KANBAN_COLUMNS.map(column => {
                const columnTasks = kanbanTasks[column.key]
                return (
                  <div
                    key={column.key}
                    className="flex-shrink-0 w-72"
                    onDragOver={(e) => handleDragOver(e, column.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(column.key)}
                  >
                    <div className={`rounded-xl border flex flex-col max-h-[calc(100vh-280px)] transition-colors ${
                      dragOverColumn === column.key
                        ? 'bg-blue-50/60 border-blue-200'
                        : 'bg-gray-50/80 border-gray-100'
                    }`}>
                      {/* Column Header */}
                      <div className="flex items-center gap-2 p-3 border-b border-gray-100 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                        <span className={`text-sm font-semibold ${column.headerColor}`}>{column.label}</span>
                        <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full ml-auto">{columnTasks.length}</span>
                      </div>
                      {/* Cards */}
                      <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[120px]">
                        {columnTasks.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-8">{column.emptyMsg}</p>
                        ) : (
                          columnTasks.map(task => {
                            const isDueToday = column.key === 'a_fazer'
                            const isOverdue = column.key === 'em_atraso'
                            const isDragging = draggedTaskId === task.id
                            return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={() => handleDragStart(task.id)}
                                onDragEnd={() => { setDraggedTaskId(null); setDragOverColumn(null) }}
                                className={`bg-white rounded-lg border p-3 transition-all hover:shadow-sm cursor-grab active:cursor-grabbing ${
                                  isDragging ? 'opacity-50 shadow-lg' : ''
                                } ${
                                  isDueToday
                                    ? 'border-l-[3px] border-l-blue-500 border-t-gray-100 border-r-gray-100 border-b-gray-100'
                                    : isOverdue
                                      ? 'border-l-[3px] border-l-red-500 border-t-gray-100 border-r-gray-100 border-b-gray-100'
                                      : 'border-gray-100'
                                }`}
                              >
                                <Link href={`/tarefas/${task.id}`} className="text-sm font-medium text-gray-900 hover:text-gray-700 block mb-1.5 leading-snug">
                                  {task.title}
                                </Link>
                                {task.description && (
                                  <p className="text-[11px] text-gray-400 mb-2 line-clamp-2 leading-relaxed">{task.description}</p>
                                )}
                                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-500">{task.category}</span>
                                  {isDueToday ? (
                                    <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">Prioridade Alta</span>
                                  ) : (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityConfig[task.priority].color}`}>
                                      {priorityConfig[task.priority].label}
                                    </span>
                                  )}
                                  {task.recurrence !== 'none' && <Repeat size={10} className="text-gray-400" />}
                                </div>
                                {isDueToday && task.due_date && (
                                  <p className="text-[10px] text-blue-600 font-medium mb-2">Vence hoje</p>
                                )}
                                {task.due_date && !isDueToday && (
                                  <p className={`text-[10px] mb-2 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                    {isOverdue ? 'Venceu' : 'Vence'} {format(new Date(task.due_date + 'T00:00:00'), 'dd/MM/yyyy')}
                                  </p>
                                )}
                                <div className="flex justify-end pt-1.5 border-t border-gray-50">
                                  {task.status === 'completed' ? (
                                    <button onClick={() => toggleTask(task)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors py-0.5 px-2 rounded hover:bg-gray-50">
                                      <RotateCcw size={11} /> Reabrir
                                    </button>
                                  ) : (
                                    <button onClick={() => toggleTask(task)} className="flex items-center gap-1 text-[11px] text-green-600 hover:text-green-700 transition-colors py-0.5 px-2 rounded hover:bg-green-50 font-medium">
                                      <Check size={11} /> Concluir
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <CheckSquare className="mx-auto text-gray-300" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">{filter === 'pending' ? 'Nenhuma tarefa pendente' : 'Nenhuma tarefa concluida'}</h3>
            <p className="mt-2 text-sm text-gray-500">{filter === 'pending' ? 'Crie tarefas para apoiar suas metas.' : 'Complete tarefas para ve-las aqui.'}</p>
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
                        <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Recorrencia</th>
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
                              {task.recurrence !== 'none' ? <span className="flex items-center gap-1 text-xs text-gray-500"><Repeat size={12} />{task.recurrence === 'daily' ? 'Diaria' : task.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}</span> : <span className="text-gray-300 text-xs">&mdash;</span>}
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
