'use client'

import AppLayout from '@/components/layout/AppLayout'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  Plus, CheckSquare, LayoutList, LayoutGrid, Columns3, CalendarDays,
  ChevronDown, ChevronRight, ChevronLeft, Repeat, Search, Check,
  RotateCcw, ArrowUpRight
} from 'lucide-react'
import {
  format, isToday, isBefore, startOfDay, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth
} from 'date-fns'
import { TASK_CATEGORIES } from '@/lib/constants'
import type { Task } from '@/types/database'

type KanbanStatus = 'pendente' | 'a_fazer' | 'em_atraso' | 'concluida'

const KANBAN_COLUMNS: { key: KanbanStatus; label: string; headerColor: string; dotColor: string; emptyMsg: string }[] = [
  { key: 'pendente', label: 'Pendente', headerColor: 'text-gray-700', dotColor: 'bg-gray-400', emptyMsg: 'Nenhuma tarefa pendente' },
  { key: 'a_fazer', label: 'A fazer', headerColor: 'text-blue-700', dotColor: 'bg-blue-500', emptyMsg: 'Nada para hoje' },
  { key: 'em_atraso', label: 'Em atraso', headerColor: 'text-red-700', dotColor: 'bg-red-500', emptyMsg: 'Sem atrasos' },
  { key: 'concluida', label: 'Concluida', headerColor: 'text-green-700', dotColor: 'bg-green-500', emptyMsg: 'Nenhuma concluida' },
]

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function getKanbanStatus(task: Task): KanbanStatus {
  if (task.status === 'completed') return 'concluida'
  if (task.due_date) {
    const dueDate = new Date(task.due_date + 'T00:00:00')
    if (isToday(dueDate)) return 'a_fazer'
    if (isBefore(startOfDay(dueDate), startOfDay(new Date()))) return 'em_atraso'
  }
  return 'pendente'
}

function getCalendarPillColor(task: Task): string {
  if (task.status === 'completed') return 'bg-green-100 text-green-700'
  if (task.due_date) {
    const dueDate = new Date(task.due_date + 'T00:00:00')
    if (isBefore(startOfDay(dueDate), startOfDay(new Date())) && !isToday(dueDate)) return 'bg-red-100 text-red-700'
    if (isToday(dueDate)) return 'bg-blue-100 text-blue-700 font-semibold'
  }
  if (task.priority === 'high') return 'bg-red-50 text-red-600'
  if (task.priority === 'medium') return 'bg-yellow-50 text-yellow-700'
  return 'bg-gray-100 text-gray-600'
}

export default function TarefasPage() {
  const { user, supabase } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'kanban' | 'calendar'>('table')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null)

  // Inline editing
  const [editingTask, setEditingTask] = useState<{ id: string; field: 'title' | 'description'; value: string } | null>(null)
  const editCancelledRef = useRef(false)

  // Calendar
  const [calendarDate, setCalendarDate] = useState(new Date())

  useEffect(() => {
    if (!user) return
    const fetchTasks = async () => {
      setLoading(true)
      let query = supabase.from('tasks').select('*').eq('user_id', user.id)
      if (viewMode !== 'kanban' && viewMode !== 'calendar') {
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
    if (viewMode === 'kanban' || viewMode === 'calendar') {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    } else {
      setTasks(prev => prev.filter(t => t.id !== task.id))
    }
  }

  // Inline editing handlers
  const startEditing = (task: Task, field: 'title' | 'description') => {
    setEditingTask({ id: task.id, field, value: (field === 'title' ? task.title : task.description) || '' })
  }

  const saveInlineEdit = async () => {
    if (editCancelledRef.current) {
      editCancelledRef.current = false
      return
    }
    if (!editingTask) return
    const { id, field, value } = editingTask
    if (field === 'title' && !value.trim()) {
      setEditingTask(null)
      return
    }
    const updateValue = field === 'description' && !value.trim() ? null : value.trim()
    await supabase.from('tasks').update({ [field]: updateValue }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: updateValue } : t))
    setEditingTask(null)
  }

  const cancelInlineEdit = () => {
    editCancelledRef.current = true
    setEditingTask(null)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); saveInlineEdit() }
    if (e.key === 'Escape') cancelInlineEdit()
  }

  // Filtered + grouped data
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

  // Calendar data
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarDate)
    const monthEnd = endOfMonth(calendarDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [calendarDate])

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    filteredTasks.forEach(task => {
      if (task.due_date) {
        if (!map[task.due_date]) map[task.due_date] = []
        map[task.due_date].push(task)
      }
    })
    return map
  }, [filteredTasks])

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => { const n = new Set(prev); if (n.has(cat)) n.delete(cat); else n.add(cat); return n })
  }

  // Drag handlers
  const handleDragStart = (taskId: string) => setDraggedTaskId(taskId)
  const handleDragOver = (e: React.DragEvent, column: KanbanStatus) => { e.preventDefault(); setDragOverColumn(column) }
  const handleDragLeave = () => setDragOverColumn(null)
  const handleDrop = (targetColumn: KanbanStatus) => {
    setDragOverColumn(null)
    if (!draggedTaskId) return
    const task = tasks.find(t => t.id === draggedTaskId)
    setDraggedTaskId(null)
    if (!task) return
    const currentColumn = getKanbanStatus(task)
    if (currentColumn === targetColumn) return
    if (targetColumn === 'concluida' && task.status === 'pending') toggleTask(task)
    else if (targetColumn !== 'concluida' && task.status === 'completed') toggleTask(task)
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

  // Inline editable title renderer
  const renderEditableTitle = (task: Task, className?: string) => {
    if (editingTask?.id === task.id && editingTask.field === 'title') {
      return (
        <input
          autoFocus
          value={editingTask.value}
          onChange={(e) => setEditingTask(prev => prev ? { ...prev, value: e.target.value } : null)}
          onKeyDown={handleEditKeyDown}
          onBlur={saveInlineEdit}
          className={`font-medium text-gray-900 w-full border-b-2 border-blue-500 outline-none bg-transparent ${className || 'text-sm'}`}
        />
      )
    }
    return (
      <div className="group/title flex items-center gap-1.5 min-w-0">
        <span
          onClick={() => startEditing(task, 'title')}
          className={`font-medium text-gray-900 cursor-text hover:bg-blue-50/60 rounded px-1 -mx-1 py-0.5 truncate ${className || 'text-sm'}`}
        >
          {task.title}
        </span>
        <Link
          href={`/tarefas/${task.id}`}
          className="opacity-0 group-hover/title:opacity-100 text-gray-400 hover:text-gray-600 shrink-0 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUpRight size={12} />
        </Link>
      </div>
    )
  }

  // Inline editable description renderer
  const renderEditableDescription = (task: Task, className?: string) => {
    if (editingTask?.id === task.id && editingTask.field === 'description') {
      return (
        <input
          autoFocus
          value={editingTask.value}
          onChange={(e) => setEditingTask(prev => prev ? { ...prev, value: e.target.value } : null)}
          onKeyDown={handleEditKeyDown}
          onBlur={saveInlineEdit}
          placeholder="Adicionar descricao..."
          className={`text-gray-500 w-full border-b border-blue-300 outline-none bg-transparent ${className || 'text-xs'}`}
        />
      )
    }
    return (
      <p
        onClick={() => startEditing(task, 'description')}
        className={`cursor-text hover:bg-blue-50/60 rounded px-1 -mx-1 truncate ${className || 'text-xs'} ${task.description ? 'text-gray-400' : 'text-gray-300 italic'}`}
      >
        {task.description || 'Adicionar descricao...'}
      </p>
    )
  }

  const showAllStatuses = viewMode === 'kanban' || viewMode === 'calendar'

  return (
    <AppLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
            <p className="text-sm text-gray-500 mt-1">
              {showAllStatuses
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
            {!showAllStatuses && (
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
              <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm' : ''}`} title="Calendario"><CalendarDays size={16} className={viewMode === 'calendar' ? 'text-gray-900' : 'text-gray-400'} /></button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12"><div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto" /></div>

        ) : viewMode === 'calendar' ? (
          /* ==================== CALENDAR VIEW ==================== */
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <button onClick={() => setCalendarDate(prev => subMonths(prev, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-semibold text-gray-900">
                  {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                </h3>
                <button
                  onClick={() => setCalendarDate(new Date())}
                  className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors font-medium"
                >
                  Hoje
                </button>
              </div>
              <button onClick={() => setCalendarDate(prev => addMonths(prev, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            </div>

            {/* Weekday names */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {WEEKDAY_NAMES.map(day => (
                <div key={day} className="text-center py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{day}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const dateKey = format(day, 'yyyy-MM-dd')
                const dayTasks = tasksByDate[dateKey] || []
                const isCurrentMonth = isSameMonth(day, calendarDate)
                const isTodayDate = isToday(day)

                return (
                  <div
                    key={dateKey}
                    className={`min-h-[110px] border-b border-r border-gray-50 p-1.5 transition-colors ${
                      !isCurrentMonth ? 'bg-gray-50/40' : ''
                    } ${isTodayDate ? 'bg-blue-50/30' : ''} ${
                      idx % 7 === 0 ? 'border-l-0' : ''
                    }`}
                  >
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                        isTodayDate
                          ? 'bg-gray-900 text-white font-bold'
                          : isCurrentMonth ? 'text-gray-700 font-medium' : 'text-gray-300'
                      }`}>
                        {day.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[9px] text-gray-400">{dayTasks.length}</span>
                      )}
                    </div>

                    {/* Task pills */}
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map(task => (
                        <Link
                          key={task.id}
                          href={`/tarefas/${task.id}`}
                          className={`block text-[10px] px-1.5 py-0.5 rounded truncate hover:opacity-80 transition-opacity ${getCalendarPillColor(task)} ${
                            task.status === 'completed' ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {task.title}
                        </Link>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-[9px] text-gray-400 px-1.5 font-medium">+{dayTasks.length - 3} mais</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Calendar legend */}
            <div className="flex items-center gap-4 p-3 border-t border-gray-100 bg-gray-50/50">
              <span className="text-[10px] text-gray-400 font-medium">Legenda:</span>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px] text-gray-500">Hoje</span></div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] text-gray-500">Alta / Atrasada</span></div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-[10px] text-gray-500">Media</span></div>
              <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] text-gray-500">Concluida</span></div>
            </div>
          </div>

        ) : viewMode === 'kanban' ? (
          /* ==================== KANBAN VIEW ==================== */
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
                      dragOverColumn === column.key ? 'bg-blue-50/60 border-blue-200' : 'bg-gray-50/80 border-gray-100'
                    }`}>
                      <div className="flex items-center gap-2 p-3 border-b border-gray-100 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${column.dotColor}`} />
                        <span className={`text-sm font-semibold ${column.headerColor}`}>{column.label}</span>
                        <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full ml-auto">{columnTasks.length}</span>
                      </div>
                      <div className="p-2 space-y-2 overflow-y-auto flex-1 min-h-[120px]">
                        {columnTasks.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-8">{column.emptyMsg}</p>
                        ) : (
                          columnTasks.map(task => {
                            const isDueToday = column.key === 'a_fazer'
                            const isOverdue = column.key === 'em_atraso'
                            const isDragging = draggedTaskId === task.id
                            const isEditing = editingTask?.id === task.id
                            return (
                              <div
                                key={task.id}
                                draggable={!isEditing}
                                onDragStart={() => handleDragStart(task.id)}
                                onDragEnd={() => { setDraggedTaskId(null); setDragOverColumn(null) }}
                                className={`bg-white rounded-lg border p-3 transition-all hover:shadow-sm ${
                                  isEditing ? '' : 'cursor-grab active:cursor-grabbing'
                                } ${isDragging ? 'opacity-50 shadow-lg' : ''} ${
                                  isDueToday
                                    ? 'border-l-[3px] border-l-blue-500 border-t-gray-100 border-r-gray-100 border-b-gray-100'
                                    : isOverdue
                                      ? 'border-l-[3px] border-l-red-500 border-t-gray-100 border-r-gray-100 border-b-gray-100'
                                      : 'border-gray-100'
                                }`}
                              >
                                <div className="mb-1.5">{renderEditableTitle(task)}</div>
                                <div className="mb-2">{renderEditableDescription(task, 'text-[11px]')}</div>
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
                                {isDueToday && task.due_date && <p className="text-[10px] text-blue-600 font-medium mb-2">Vence hoje</p>}
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
          /* ==================== EMPTY STATE ==================== */
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <CheckSquare className="mx-auto text-gray-300" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">{filter === 'pending' ? 'Nenhuma tarefa pendente' : 'Nenhuma tarefa concluida'}</h3>
            <p className="mt-2 text-sm text-gray-500">{filter === 'pending' ? 'Crie tarefas para apoiar suas metas.' : 'Complete tarefas para ve-las aqui.'}</p>
            {filter === 'pending' && <Link href="/tarefas/nova" className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium"><Plus size={16} /> Criar tarefa</Link>}
          </div>

        ) : viewMode === 'table' ? (
          /* ==================== TABLE VIEW ==================== */
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
                              {renderEditableTitle(task)}
                              <div className="mt-0.5">{renderEditableDescription(task)}</div>
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
          /* ==================== CARDS VIEW ==================== */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button onClick={() => toggleTask(task)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'}`}>
                      {task.status === 'completed' && <span className="text-[10px]">&#10003;</span>}
                    </button>
                    <div className="min-w-0 flex-1">{renderEditableTitle(task)}</div>
                  </div>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ml-2 ${priorityConfig[task.priority].color}`}>{priorityConfig[task.priority].label}</span>
                </div>
                <div className="ml-7 mb-3">{renderEditableDescription(task)}</div>
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
