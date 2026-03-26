'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Task, Board, Status, Priority } from '@/types'
import { braindump, planWeek } from '@/lib/ai'

const COLUMNS: { id: Status; label: string; color: string; dot: string }[] = [
  { id: 'todo', label: 'To Do', color: 'text-yellow-600', dot: 'bg-yellow-400' },
  { id: 'inprogress', label: 'In Progress', color: 'text-indigo-600', dot: 'bg-indigo-400' },
  { id: 'done', label: 'Done', color: 'text-green-600', dot: 'bg-green-400' },
]

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: 'bg-red-50 text-red-600 border-red-100',
  high: 'bg-orange-50 text-orange-600 border-orange-100',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  low: 'bg-gray-50 text-gray-500 border-gray-200',
}

export default function BoardPage() {
  const { id } = useParams()
  const router = useRouter()
  const [board, setBoard] = useState<Board | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<Status | null>(null)

  // Modals
  const [showBraindump, setShowBraindump] = useState(false)
  const [braindumpText, setBraindumpText] = useState('')
  const [braindumpLoading, setBraindumpLoading] = useState(false)
  const [braindumpResult, setBraindumpResult] = useState<any[]>([])

  const [showAddTask, setShowAddTask] = useState<Status | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [newTaskHours, setNewTaskHours] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPriority, setEditPriority] = useState<Priority>('medium')
  const [editDue, setEditDue] = useState('')
  const [editHours, setEditHours] = useState('')
  const [savingTask, setSavingTask] = useState(false)

  const [weekPlan, setWeekPlan] = useState<string>('')
  const [weekLoading, setWeekLoading] = useState(false)
  const [showWeekPlan, setShowWeekPlan] = useState(false)

  useEffect(() => {
    fetchBoard()
    fetchTasks()
  }, [id])

  const fetchBoard = async () => {
    const { data } = await supabase.from('boards').select('*').eq('id', id).single()
    setBoard(data)
  }

  const fetchTasks = async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('board_id', id)
      .order('position', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }

  const addTask = async () => {
    if (!newTaskTitle.trim() || !showAddTask) return
    setAddingTask(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const maxPos = tasks.filter(t => t.status === showAddTask).length
    const { data } = await supabase.from('tasks').insert({
      board_id: id, user_id: session.user.id,
      title: newTaskTitle.trim(), status: showAddTask,
      priority: newTaskPriority, due_date: newTaskDue || null,
      estimated_hours: newTaskHours ? parseFloat(newTaskHours) : null,
      position: maxPos,
    }).select().single()
    if (data) setTasks(prev => [...prev, data])
    setNewTaskTitle(''); setNewTaskPriority('medium'); setNewTaskDue(''); setNewTaskHours('')
    setShowAddTask(null); setAddingTask(false)
  }

  const deleteTask = async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    setSelectedTask(null)
  }

  const saveTask = async () => {
    if (!selectedTask) return
    setSavingTask(true)
    const { data } = await supabase.from('tasks').update({
      title: editTitle, description: editDesc,
      priority: editPriority, due_date: editDue || null,
      estimated_hours: editHours ? parseFloat(editHours) : null,
    }).eq('id', selectedTask.id).select().single()
    if (data) setTasks(prev => prev.map(t => t.id === data.id ? data : t))
    setSelectedTask(null); setSavingTask(false)
  }

  const openTask = (task: Task) => {
    setSelectedTask(task)
    setEditTitle(task.title)
    setEditDesc(task.description || '')
    setEditPriority(task.priority)
    setEditDue(task.due_date || '')
    setEditHours(task.estimated_hours?.toString() || '')
  }

  // Drag and Drop
  const onDragStart = (taskId: string) => setDragging(taskId)
  const onDragOver = (e: React.DragEvent, col: Status) => {
    e.preventDefault(); setDragOver(col)
  }
  const onDrop = async (e: React.DragEvent, col: Status) => {
    e.preventDefault()
    if (!dragging) return
    const task = tasks.find(t => t.id === dragging)
    if (!task || task.status === col) { setDragging(null); setDragOver(null); return }
    setTasks(prev => prev.map(t => t.id === dragging ? { ...t, status: col } : t))
    await supabase.from('tasks').update({ status: col }).eq('id', dragging)
    setDragging(null); setDragOver(null)
  }

  // AI Braindump
  const runBraindump = async () => {
    if (!braindumpText.trim()) return
    setBraindumpLoading(true)
    const result = await braindump(braindumpText)
    setBraindumpResult(result.tasks || [])
    setBraindumpLoading(false)
  }

  const saveBraindumpTasks = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const inserts = braindumpResult.map((t: any, i: number) => ({
      board_id: id, user_id: session.user.id,
      title: t.title, description: t.description || '',
      priority: t.priority || 'medium', due_date: t.due_date || null,
      estimated_hours: t.estimated_hours || null, status: 'todo' as Status,
      position: tasks.filter(tk => tk.status === 'todo').length + i,
    }))
    const { data } = await supabase.from('tasks').insert(inserts).select()
    if (data) setTasks(prev => [...prev, ...data])
    setShowBraindump(false); setBraindumpText(''); setBraindumpResult([])
  }

  // AI Week Plan
  const runWeekPlan = async () => {
    setWeekLoading(true)
    setShowWeekPlan(true)
    const result = await planWeek(tasks)
    setWeekPlan(result.plan || 'Could not generate plan.')
    setWeekLoading(false)
  }

  const tasksByCol = (col: Status) => tasks.filter(t => t.status === col)

  return (
    <div className="h-[calc(100vh-57px)] flex flex-col">
      {/* Board Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 text-sm transition-colors">← Back</button>
          <div className="w-px h-4 bg-gray-200" />
          <h1 className="font-bold text-gray-900">{board?.title || 'Loading...'}</h1>
          {board?.description && <span className="text-sm text-gray-400">— {board.description}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runWeekPlan}
            className="flex items-center gap-2 text-sm border border-gray-200 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            📅 Plan My Week
          </button>
          <button
            onClick={() => setShowBraindump(true)}
            className="flex items-center gap-2 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            ✦ AI Braindump
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-5 h-full min-w-max">
          {COLUMNS.map(col => (
            <div
              key={col.id}
              className={`flex flex-col w-72 bg-gray-100 rounded-xl transition-all ${dragOver === col.id ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}`}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e => onDrop(e, col.id)}
              onDragLeave={() => setDragOver(null)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className={`text-sm font-semibold ${col.color}`}>{col.label}</span>
                  <span className="text-xs bg-white text-gray-500 rounded-full px-2 py-0.5 font-medium border border-gray-200">
                    {tasksByCol(col.id).length}
                  </span>
                </div>
                <button
                  onClick={() => setShowAddTask(col.id)}
                  className="text-gray-400 hover:text-indigo-600 transition-colors text-lg font-light"
                >+</button>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="bg-white rounded-lg p-3 animate-pulse h-20" />)}
                  </div>
                ) : tasksByCol(col.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">No tasks yet</div>
                ) : (
                  tasksByCol(col.id).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => onDragStart(task.id)}
                      onClick={() => openTask(task)}
                      className={`bg-white rounded-lg p-3 border border-gray-200 cursor-pointer hover:border-indigo-200 hover:shadow-sm transition-all ${dragging === task.id ? 'opacity-40 rotate-1' : ''}`}
                    >
                      <div className="text-sm font-medium text-gray-800 mb-2 leading-snug">{task.title}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        {task.due_date && (
                          <span className="text-xs text-gray-400">
                            📅 {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                        {task.estimated_hours && (
                          <span className="text-xs text-gray-400">⏱ {task.estimated_hours}h</span>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* Add task inline */}
                {showAddTask === col.id && (
                  <div className="bg-white rounded-lg border border-indigo-200 p-3 shadow-sm">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Task title..."
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addTask()}
                      className="w-full text-sm outline-none text-gray-800 placeholder-gray-400 mb-2"
                    />
                    <div className="flex gap-2 mb-2">
                      <select
                        value={newTaskPriority}
                        onChange={e => setNewTaskPriority(e.target.value as Priority)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 flex-1 outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                      <input
                        type="date"
                        value={newTaskDue}
                        onChange={e => setNewTaskDue(e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 flex-1 outline-none"
                      />
                    </div>
                    <input
                      type="number"
                      placeholder="Est. hours"
                      value={newTaskHours}
                      onChange={e => setNewTaskHours(e.target.value)}
                      className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none mb-2"
                    />
                    <div className="flex gap-1">
                      <button onClick={() => { setShowAddTask(null); setNewTaskTitle('') }} className="flex-1 text-xs text-gray-500 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                      <button onClick={addTask} disabled={addingTask || !newTaskTitle.trim()} className="flex-1 text-xs bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors font-medium">
                        {addingTask ? 'Adding...' : 'Add Task'}
                      </button>
                    </div>
                  </div>
                )}

                {showAddTask !== col.id && (
                  <button
                    onClick={() => setShowAddTask(col.id)}
                    className="w-full text-left text-xs text-gray-400 hover:text-indigo-600 py-2 px-2 rounded-lg hover:bg-white transition-all"
                  >
                    + Add task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI BRAINDUMP MODAL */}
      {showBraindump && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => { setShowBraindump(false); setBraindumpResult([]) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 text-sm">✦</div>
              <h2 className="text-lg font-bold text-gray-900">AI Braindump</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Type anything messy — AI will turn it into structured tasks with priorities and time estimates.</p>
            <textarea
              autoFocus
              value={braindumpText}
              onChange={e => setBraindumpText(e.target.value)}
              placeholder="e.g. finish the landing page, call client Friday, fix that nav bug, prepare slides for Monday..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none h-28 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
            />
            {braindumpResult.length === 0 ? (
              <button
                onClick={runBraindump}
                disabled={braindumpLoading || !braindumpText.trim()}
                className="mt-3 w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {braindumpLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />AI is thinking...</>
                ) : '✦ Generate Tasks'}
              </button>
            ) : (
              <div className="mt-3">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Generated Tasks</div>
                <div className="space-y-2 max-h-48 overflow-y-auto mb-3">
                  {braindumpResult.map((task: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <div className="w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{task.title}</div>
                        {task.priority && <span className={`text-xs px-2 py-0.5 rounded-full border mt-1 inline-block ${PRIORITY_COLORS[task.priority as Priority]}`}>{task.priority}</span>}
                        {task.estimated_hours && <span className="text-xs text-gray-400 ml-2">⏱ {task.estimated_hours}h</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setBraindumpResult([])} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Redo</button>
                  <button onClick={saveBraindumpTasks} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    Save {braindumpResult.length} tasks →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TASK DETAIL MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Task</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
              />
              <textarea
                placeholder="Description (optional)"
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={editPriority}
                  onChange={e => setEditPriority(e.target.value as Priority)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <input
                  type="date"
                  value={editDue}
                  onChange={e => setEditDue(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <input
                type="number"
                placeholder="Estimated hours"
                value={editHours}
                onChange={e => setEditHours(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => deleteTask(selectedTask.id)} className="border border-red-200 text-red-500 py-2.5 px-4 rounded-xl text-sm hover:bg-red-50 transition-colors">Delete</button>
              <button onClick={() => setSelectedTask(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={saveTask} disabled={savingTask} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {savingTask ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WEEK PLAN MODAL */}
      {showWeekPlan && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowWeekPlan(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">📅</div>
              <h2 className="text-lg font-bold text-gray-900">Weekly Plan</h2>
            </div>
            {weekLoading ? (
              <div className="flex flex-col items-center py-10 gap-3">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">AI is planning your week...</p>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
                {weekPlan}
              </div>
            )}
            <button onClick={() => setShowWeekPlan(false)} className="mt-4 w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}