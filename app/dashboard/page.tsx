'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Board } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('boards')
      .select('*, tasks(count)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    setBoards(data || [])
    setLoading(false)
  }

  const createBoard = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('boards')
      .insert({ title: newTitle.trim(), description: newDesc.trim(), user_id: session.user.id })
      .select()
      .single()
    if (data) {
      setBoards(prev => [data, ...prev])
      setShowNew(false)
      setNewTitle('')
      setNewDesc('')
      router.push(`/dashboard/board/${data.id}`)
    }
    setCreating(false)
  }

  const deleteBoard = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this board and all its tasks?')) return
    await supabase.from('boards').delete().eq('id', id)
    setBoards(prev => prev.filter(b => b.id !== id))
  }

  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500']

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Boards</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your projects and tasks</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <span>+</span> New Board
        </button>
      </div>

      {/* New Board Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create new board</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Board title (e.g. Work Projects)"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createBoard()}
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50"
              />
              <textarea
                placeholder="Description (optional)"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 resize-none"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowNew(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={createBoard}
                disabled={creating || !newTitle.trim()}
                className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Board'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Boards', value: boards.length },
          { label: 'Active Tasks', value: '—' },
          { label: 'Completed', value: '—' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Boards Grid */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No boards yet</h3>
          <p className="text-gray-500 text-sm mb-6">Create your first board to start organizing your work</p>
          <button onClick={() => setShowNew(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            Create your first board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board, i) => (
            <div
              key={board.id}
              onClick={() => router.push(`/dashboard/board/${board.id}`)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group relative"
            >
              <div className={`w-10 h-10 ${colors[i % colors.length]} rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4`}>
                {board.title[0].toUpperCase()}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{board.title}</h3>
              {board.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{board.description}</p>}
              <div className="text-xs text-gray-400">
                {new Date(board.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <button
                onClick={e => deleteBoard(board.id, e)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-lg"
              >
                ×
              </button>
            </div>
          ))}
          {/* Add new */}
          <button
            onClick={() => setShowNew(true)}
            className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-5 hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[140px] text-gray-400 hover:text-indigo-600"
          >
            <span className="text-3xl">+</span>
            <span className="text-sm font-medium">New Board</span>
          </button>
        </div>
      )}
    </div>
  )
}