import { NextRequest, NextResponse } from 'next/server'

const GEMINI_KEY = process.env.GEMINI_API_KEY
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`

async function callGemini(prompt: string) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Gemini API failed')
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function POST(req: NextRequest) {
  try {
    const { type, text, tasks } = await req.json()

    if (type === 'braindump') {
      const prompt = `You are a smart task manager AI. Convert this messy braindump into structured tasks.

Return ONLY a valid JSON array, no markdown, no backticks, no explanation.

Each task must have:
- title: string
- description: string  
- priority: "low" | "medium" | "high" | "urgent"
- estimated_hours: number
- due_date: string | null (YYYY-MM-DD if mentioned, else null)

Braindump: "${text}"

Return ONLY the JSON array.`

      const raw = await callGemini(prompt)
      const clean = raw.replace(/```json|```/g, '').trim()
      const parsedTasks = JSON.parse(clean)
      return NextResponse.json({ tasks: parsedTasks })
    }

    if (type === 'planweek') {
      const todoTasks = tasks.filter((t: any) => t.status === 'todo' || t.status === 'inprogress')
      const prompt = `You are a productivity coach. Create a realistic weekly plan for these tasks:

${JSON.stringify(todoTasks.map((t: any) => ({ title: t.title, priority: t.priority, estimated_hours: t.estimated_hours, due_date: t.due_date })))}

Structure it day by day Monday to Sunday. Include which tasks to do each day, focus tips, and one productivity insight. Keep it concise and encouraging.`

      const plan = await callGemini(prompt)
      return NextResponse.json({ plan })
    }

    if (type === 'insights') {
      const prompt = `Analyze these tasks and give a brief productivity report:

${JSON.stringify(tasks.map((t: any) => ({ title: t.title, status: t.status, priority: t.priority })))}

Include: what's going well, patterns you notice, 3 quick recommendations. Keep it friendly and brief.`

      const insights = await callGemini(prompt)
      return NextResponse.json({ insights })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (err: any) {
    console.error('AI route error:', err)
    return NextResponse.json({ error: err.message || 'AI failed' }, { status: 500 })
  }
}