import { useState } from 'react'
import { problems } from './problems'
import { python } from './runtime/runner'

export default function App() {
  const [out, setOut] = useState('')
  const p = problems[0]
  const go = async (k: number) => {
    const r = await python.runTests(p.stages[k].solution, p.stages.slice(0, k + 1).map((s) => ({ stage: s.number, source: s.tests })))
    setOut(JSON.stringify(r, null, 2))
  }
  return (
    <div>
      <button id="run" onClick={() => go(3)}>run</button>
      <button id="loop" onClick={async () => setOut(JSON.stringify(await python.runFile('while True: pass')))}>loop</button>
      <pre id="out">{out}</pre>
    </div>
  )
}
