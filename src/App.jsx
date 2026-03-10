import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Nav from './components/Nav'
import LogWorkout from './pages/LogWorkout'
import History from './pages/History'
import Exercises from './pages/Exercises'
import Stats from './pages/Stats'
import Setup from './pages/Setup'

export default function App() {
  const [page, setPage] = useState('log')
  const [theme, setTheme] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  if (!supabase) {
    return <Setup />
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="mx-auto max-w-2xl px-4 pb-24">
        <header className="flex items-center justify-between py-4">
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--color-text)' }}>
            <span style={{ color: 'var(--color-primary)' }}>⚡</span> Tracker
          </h1>
          <button
            onClick={toggleTheme}
            className="btn btn-ghost p-2"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </header>

        {page === 'log' && <LogWorkout />}
        {page === 'history' && <History />}
        {page === 'exercises' && <Exercises />}
        {page === 'stats' && <Stats />}
      </div>

      <Nav page={page} setPage={setPage} />
    </div>
  )
}
