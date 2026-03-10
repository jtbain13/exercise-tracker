import { useState, useEffect } from 'react'
import { TrendingUp, Flame, Trophy, Dumbbell } from 'lucide-react'
import { getWorkouts, getRecentSets } from '../lib/db'
import { format, parseISO, differenceInCalendarDays, startOfWeek, isWithinInterval, subDays } from 'date-fns'

export default function Stats() {
  const [workouts, setWorkouts] = useState([])
  const [recentSets, setRecentSets] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState(7)

  useEffect(() => {
    load()
  }, [timeframe])

  async function load() {
    setLoading(true)
    try {
      const [w, s] = await Promise.all([
        getWorkouts(200),
        getRecentSets(timeframe),
      ])
      setWorkouts(w)
      setRecentSets(s)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
  }

  // Calculate stats
  const now = new Date()
  const recentWorkouts = workouts.filter(w => {
    const d = parseISO(w.date)
    return differenceInCalendarDays(now, d) <= timeframe
  })

  // Weekly volume
  const weekVolume = recentSets.reduce((sum, s) => sum + (s.reps || 0) * (s.weight || 0), 0)

  // Total sets this period
  const totalSets = recentSets.length

  // Unique exercises this period
  const uniqueExercises = [...new Set(recentSets.map(s => s.exercises?.name))].filter(Boolean)

  // Streak calculation
  let streak = 0
  const sortedDates = [...new Set(workouts.map(w => w.date))].sort().reverse()
  if (sortedDates.length > 0) {
    const today = format(now, 'yyyy-MM-dd')
    const yesterday = format(subDays(now, 1), 'yyyy-MM-dd')
    // Must have worked out today or yesterday for streak to be active
    if (sortedDates[0] === today || sortedDates[0] === yesterday) {
      streak = 1
      for (let i = 1; i < sortedDates.length; i++) {
        const diff = differenceInCalendarDays(parseISO(sortedDates[i - 1]), parseISO(sortedDates[i]))
        if (diff === 1) {
          streak++
        } else {
          break
        }
      }
    }
  }

  // PRs (best weight for each exercise)
  const allSets = workouts.flatMap(w => (w.sets || []))
  const prs = {}
  allSets.forEach(s => {
    const name = s.exercises?.name
    if (!name || !s.weight) return
    if (!prs[name] || s.weight > prs[name].weight) {
      prs[name] = {
        weight: s.weight,
        reps: s.reps,
        date: s.workouts?.date || s.created_at,
      }
    }
  })

  // Muscle group distribution
  const muscleVolume = {}
  recentSets.forEach(s => {
    const muscle = s.exercises?.muscle_group || s.exercises?.category || 'Other'
    const vol = (s.reps || 0) * (s.weight || 0)
    muscleVolume[muscle] = (muscleVolume[muscle] || 0) + vol
  })

  // Activity heatmap - last 28 days
  const heatmapDays = []
  for (let i = 27; i >= 0; i--) {
    const d = format(subDays(now, i), 'yyyy-MM-dd')
    const count = workouts.filter(w => w.date === d).reduce((sum, w) => sum + (w.sets?.length || 0), 0)
    heatmapDays.push({ date: d, count, day: format(subDays(now, i), 'EEE')[0] })
  }
  const maxCount = Math.max(...heatmapDays.map(d => d.count), 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Stats</h2>
        <div className="flex gap-1">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              className="px-2.5 py-1 text-xs rounded-full font-medium transition-colors"
              style={{
                background: timeframe === d ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: timeframe === d ? 'white' : 'var(--color-text-muted)',
              }}
              onClick={() => setTimeframe(d)}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={TrendingUp} label="Volume" value={weekVolume > 0 ? `${(weekVolume / 1000).toFixed(1)}k lb` : '—'} />
        <StatCard icon={Dumbbell} label="Sets" value={totalSets || '—'} />
        <StatCard icon={Flame} label="Streak" value={streak > 0 ? `${streak} day${streak > 1 ? 's' : ''}` : '—'} />
        <StatCard icon={Trophy} label="Exercises" value={uniqueExercises.length || '—'} />
      </div>

      {/* Activity heatmap */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Last 28 Days
        </h3>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {heatmapDays.map((d, i) => {
            const intensity = d.count / maxCount
            return (
              <div
                key={d.date}
                className="aspect-square rounded-sm relative group"
                style={{
                  background: d.count > 0
                    ? `color-mix(in srgb, var(--color-primary) ${Math.round(20 + intensity * 80)}%, transparent)`
                    : 'var(--color-surface-2)',
                }}
                title={`${format(parseISO(d.date), 'MMM d')}: ${d.count} sets`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>4 weeks ago</span>
          <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Today</span>
        </div>
      </div>

      {/* Muscle distribution */}
      {Object.keys(muscleVolume).length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Volume by Muscle
          </h3>
          <div className="space-y-2">
            {Object.entries(muscleVolume)
              .sort((a, b) => b[1] - a[1])
              .map(([muscle, vol]) => {
                const maxVol = Math.max(...Object.values(muscleVolume))
                const pct = (vol / maxVol) * 100
                return (
                  <div key={muscle}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span style={{ color: 'var(--color-text)' }}>{muscle}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{vol.toLocaleString()} lb</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: 'var(--color-primary)' }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* PRs */}
      {Object.keys(prs).length > 0 && (
        <div className="card p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Personal Records (Best Weight)
          </h3>
          <div className="space-y-1.5">
            {Object.entries(prs)
              .sort((a, b) => b[1].weight - a[1].weight)
              .slice(0, 15)
              .map(([name, pr]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-mono text-xs" style={{ color: 'var(--color-primary)' }}>
                    {pr.weight} lb × {pr.reps || '?'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Workout count */}
      <div className="text-center py-4">
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
          {workouts.length} total workouts logged
        </p>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={14} style={{ color: 'var(--color-primary)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      </div>
      <div className="text-lg font-semibold tabular-nums" style={{ color: 'var(--color-text)' }}>{value}</div>
    </div>
  )
}
