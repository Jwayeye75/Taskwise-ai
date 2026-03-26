export async function braindump(text: string) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'braindump', text }),
  })
  return res.json()
}

export async function planWeek(tasks: any[]) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'planweek', tasks }),
  })
  return res.json()
}

export async function getInsights(tasks: any[]) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'insights', tasks }),
  })
  return res.json()
}