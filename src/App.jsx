import { useState, useRef, useEffect } from 'react'
import PLAYER_DB from './data/players.js'
import { PUZZLES, ACTIVE_OVERRIDE } from './data/puzzles.js'
import { loadPuzzle } from './utils/puzzle.js'
import { validate, nc } from './utils/validate.js'
import Header from './components/Header.jsx'
import Grid from './components/Grid.jsx'

const TOTAL_TILES = 16

const { puzzle, today, columns, rows, answerPool, weekBadge, gridLabel, cornerPhrase } =
  loadPuzzle(PUZZLES, ACTIVE_OVERRIDE)

const poolNames = Object.values(answerPool).flat()
const ALL_PLAYERS = [...new Set([...PLAYER_DB, ...poolNames])]

const bgStyle = {
  minHeight: "100vh",
  background: "#7a0a00",
  backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)`,
  backgroundSize: "18px 18px",
  fontFamily: "'Arial Black', 'Impact', 'Segoe UI Black', system-ui, sans-serif",
  color: "#fff",
  paddingBottom: 40,
}

export default function App() {
  const [cells, setCells] = useState({})
  const [used, setUsed] = useState(new Set())
  const [active, setActive] = useState(null)
  const [inputVal, setInputVal] = useState("")
  const [feedback, setFeedback] = useState(null)
  const [showRules, setShowRules] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggIdx, setSuggIdx] = useState(-1)
  const [acOpen, setAcOpen] = useState(false)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  const correct   = Object.values(cells).filter(c => c?.status === "correct").length
  const incorrect = Object.values(cells).filter(c => c?.status === "wrong").length
  const totalPlayed = correct + incorrect

  useEffect(() => { if (active) setTimeout(() => inputRef.current?.focus(), 60) }, [active])

  useEffect(() => {
    if (suggIdx >= 0 && dropdownRef.current) {
      const el = dropdownRef.current.querySelector('[data-highlighted="true"]')
      if (el) el.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [suggIdx])

  // --- Handlers ---
  const openCell = (r, c) => {
    const k = `${r}-${c}`
    if (cells[k]) return
    setActive(k); setInputVal(""); setFeedback(null); setSuggestions([]); setSuggIdx(-1); setAcOpen(false)
  }

  const submit = () => {
    if (!active || !inputVal.trim()) return
    const res = validate(inputVal, active, used, answerPool)
    if (!res) return
    if (res.reason === "empty") { setFeedback({ type: "error", msg: "⏳ Answer pool coming soon!" }); return }
    if (res.ok) {
      const nu = new Set(used); nu.add(nc(res.name)); setUsed(nu)
      setCells(p => ({ ...p, [active]: { status: "correct", name: res.name } }))
      setFeedback({ type: "correct", msg: `✅ ${res.name} — BUCKETS!` })
      setTimeout(() => { setActive(null); setFeedback(null); setInputVal("") }, 1400)
    } else if (res.reason === "used") {
      setFeedback({ type: "error", msg: `❌ ${res.name} already used!` })
    } else {
      setCells(p => ({ ...p, [active]: { status: "wrong" } }))
      setFeedback(null); setActive(null); setInputVal("")
    }
  }

  const reset = () => {
    setCells({}); setUsed(new Set()); setActive(null); setInputVal(""); setFeedback(null)
    setShowRules(false); setSuggestions([]); setSuggIdx(-1); setAcOpen(false)
  }

  const handleInputChange = (e) => {
    const v = e.target.value
    setInputVal(v); setFeedback(null); setSuggIdx(-1)
    const q = v.trim().toLowerCase()
    if (q.length >= 3) {
      setSuggestions(ALL_PLAYERS.filter(p => p.toLowerCase().startsWith(q) || p.toLowerCase().split(" ").some(w => w.startsWith(q))).slice(0, 30))
      setAcOpen(true)
    } else { setSuggestions([]); setAcOpen(false) }
  }

  const handleSuggestionSelect = (name) => {
    if (name !== null) setInputVal(name)
    setSuggestions([]); setSuggIdx(-1); setAcOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSuggIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSuggIdx(i => Math.max(i - 1, -1)) }
    else if (e.key === "Enter") {
      if (suggIdx >= 0 && suggestions[suggIdx]) { handleSuggestionSelect(suggestions[suggIdx]) }
      else { submit() }
    } else if (e.key === "Escape") {
      if (acOpen) { setSuggestions([]); setSuggIdx(-1); setAcOpen(false) }
      else { setActive(null); setFeedback(null) }
    }
  }

  if (!puzzle) return <div style={{ color: '#fff', textAlign: 'center', padding: 40, fontFamily: 'sans-serif', fontSize: 20 }}>Game unavailable — check back soon.</div>

  return (
    <div style={bgStyle}>
      <Header
        weekBadge={weekBadge} gridLabel={gridLabel} rows={rows}
        correct={correct} incorrect={incorrect} totalPlayed={totalPlayed} totalTiles={TOTAL_TILES}
        showRules={showRules} onToggleRules={() => setShowRules(p => !p)}
        onReset={reset}
      />
      <div style={{ height: 22, background: "linear-gradient(to bottom, #1B2A6B, #7a0a00)", width: "100%" }} />
      <Grid
        columns={columns} rows={rows} answerPool={answerPool}
        cells={cells} active={active} inputVal={inputVal} feedback={feedback}
        suggestions={suggestions} suggIdx={suggIdx} acOpen={acOpen}
        inputRef={inputRef} dropdownRef={dropdownRef}
        onTileClick={openCell} onInputChange={handleInputChange}
        onSuggestionSelect={handleSuggestionSelect}
        onSubmit={submit} onKeyDown={handleKeyDown}
        onCancel={() => { setActive(null); setFeedback(null) }}
        revealMap={null} cornerPhrase={cornerPhrase}
      />
    </div>
  )
}
