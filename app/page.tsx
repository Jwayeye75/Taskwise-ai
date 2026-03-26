'use client'
import Link from 'next/link'
import { useState } from 'react'

const features = [
  {
    icon: '🧠',
    title: 'AI Braindump',
    desc: 'Type a messy paragraph and watch AI turn it into clean, prioritized tasks with deadlines and time estimates instantly.',
  },
  {
    icon: '📅',
    title: 'Weekly Optimizer',
    desc: 'Click "Plan my week" and AI builds a realistic schedule based on your tasks, deadlines, and past completion data.',
  },
  {
    icon: '📊',
    title: 'Smart Insights',
    desc: 'Get weekly AI-generated reports on your productivity patterns, what you crushed, and what needs attention.',
  },
  {
    icon: '⚡',
    title: 'Real-time Boards',
    desc: 'Drag and drop Kanban boards with live updates. Share with teammates and collaborate in real time.',
  },
]

const testimonials = [
  { name: 'Alex K.', role: 'Freelance Developer', text: 'The braindump feature alone saves me 30 minutes every morning. It just works.' },
  { name: 'Priya S.', role: 'Product Manager', text: 'Finally a task manager that actually thinks. The weekly plan is scary accurate.' },
  { name: 'Marcus T.', role: 'Student', text: 'I stopped missing deadlines completely. The AI catches everything I forget.' },
]

export default function LandingPage() {
  const [demoText, setDemoText] = useState('')
  const [demoResult, setDemoResult] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const runDemo = async () => {
    if (!demoText.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'braindump', text: demoText }),
      })
      const data = await res.json()
      setDemoResult(data.tasks || [])
    } catch {
      setDemoResult(['Could not connect to AI — please try again.'])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NAV */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">T</div>
          <span className="font-semibold text-gray-900 text-lg">TaskWise <span className="text-indigo-600">AI</span></span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-4 py-2">Sign in</Link>
          <Link href="/login" className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium">Get started free</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-indigo-100">
          <span>✦</span> Powered by Google Gemini AI
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
          The task manager that<br />
          <span className="text-indigo-600">actually thinks</span> for you
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Braindump your messy thoughts. Get structured tasks, smart schedules, and weekly insights — all powered by AI. For devs, students, freelancers, and remote teams.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/login" className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-200 text-base">
            Start for free →
          </Link>
          <a href="#demo" className="text-gray-600 px-6 py-3.5 rounded-xl font-medium border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-base">
            Try the demo ↓
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-4">No credit card required · Free forever plan</p>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
          <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-gray-100 rounded-md px-3 py-1 text-xs text-gray-400">taskwise.app/dashboard</div>
          </div>
          <div className="p-6 grid grid-cols-3 gap-4">
            {[
              { title: 'Design system', priority: 'Urgent', color: 'red', col: 'Todo' },
              { title: 'Build auth flow', priority: 'High', color: 'orange', col: 'In Progress' },
              { title: 'Setup database', priority: 'Done', color: 'green', col: 'Done' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{item.col}</div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-sm font-medium text-gray-800 mb-2">{item.title}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.color === 'red' ? 'bg-red-50 text-red-600' :
                    item.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                    'bg-green-50 text-green-600'
                  }`}>{item.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything your team needs</h2>
            <p className="text-gray-500 text-lg">Built for real work, not just task lists.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-100 hover:shadow-md transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE DEMO */}
      <section id="demo" className="py-20 max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Try the AI Braindump</h2>
          <p className="text-gray-500">Type anything messy. Watch AI structure it into real tasks.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <textarea
            value={demoText}
            onChange={e => setDemoText(e.target.value)}
            placeholder="e.g. finish the React component, prepare for Friday interview, call the client about the invoice, need to buy groceries and also fix that nav bug..."
            className="w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-700 resize-none h-28 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 transition-all"
          />
          <button
            onClick={runDemo}
            disabled={loading || !demoText.trim()}
            className="mt-3 w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                AI is thinking...
              </>
            ) : '✦ Turn into tasks'}
          </button>
          {demoResult.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Generated Tasks</div>
              {demoResult.map((task, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <span className="text-sm text-gray-700">{task}</span>
                </div>
              ))}
              <Link href="/login" className="block text-center mt-4 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                Save these tasks — Sign up free →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Loved by productive people</h2>
          <div className="grid grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-6">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to work smarter?</h2>
        <p className="text-gray-500 text-lg mb-8">Join thousands of people who manage their work with AI.</p>
        <Link href="/login" className="inline-block bg-indigo-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-200">
          Get started for free →
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-xs">T</div>
          <span className="font-medium text-gray-600">TaskWise AI</span>
        </div>
        <p>Built by <span className="text-indigo-600 font-medium">Josiah Ayeye</span> · 2026</p>
      </footer>
    </div>
  )
}