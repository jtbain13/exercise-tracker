import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { getWorkouts, deleteWorkout } from '../lib/db'
import { format, parseISO } from 'date-fns'

export default function History() {
  const [workouts, setWorkouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getWorkouts(100)
      setWorkouts(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this workout and all its sets?')) return
    try {
      await deleteWorkout(id)
      setWorkouts(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No workouts yet</p>
        <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Log your first workout to see it here</p>
      </div>
    )
  }

  // Group by date
  const grouped = workouts.reduce((acc, w) => {
    const key = w.date
    if (!acc[key]) acc[key] = []
    acc[key].push(w)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>History</h2>

      {Object.entries(grouped).map(([date, dayWorkouts]) => (
        <div key={date} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            {format(parseISO(date), 'EEEE, MMM d, yyyy')}
          </h3>

          {dayWorkouts.map(w => {
            const isExpanded = expanded === w.id
            const sets = w.sets || []
            const cardio = w.cardio_log || []
            const totalVolume = sets.reduce((sum, s) => sum + (s.reps || 0) * (s.weight || 0), 0)
            const uniqueExercises = [...new Set(sets.map(s => s.exercises?.name))].filter(Boolean)

            // Group sets by exercise
            const groupedSets = sets.reduce((acc, s) => {
              const name = s.exercises?.name || 'Unknown'
              if (!acc[name]) acc[name] = []
              acc[name].push(s)
              return acc
            }, {})

            return (
              <div key={w.id} className="card overflow-hidden">
                <button
                  className="w-full text-left p-3 flex items-center justify-between"
                  onClick={() => setExpanded(isExpanded ? null : w.id)}
                >
                  <div>
                    <span className="text-sm font-medium">
                      {w.name || 'Workout'}
                    </span>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {sets.length} sets
                      </span>
                      {totalVolume > 0 && (
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {totalVolume.toLocaleString()} lb vol
                        </span>
                      )}
                      {cardio.length > 0 && (
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {cardio.length} cardio
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3" style={{ borderTop: '1px solid var(--color-border)' }}>
                    {/* Exercises summary */}
                    {Object.entries(groupedSets).map(([name, exSets]) => (
                      <div key={name} className="pt-2">
                        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>{name}</div>
                        <div className="space-y-0.5">
                          {exSets
                            .sort((a, b) => a.set_number - b.set_number)
                            .map(s => (
                            <div key={s.id} className="flex gap-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              <span className="w-12">Set {s.set_number}</span>
                              <span>
                                {s.reps && `${s.reps} reps`}
                                {s.weight ? ` × ${s.weight} lb` : ''}
                                {s.duration_seconds ? `${s.duration_seconds}s` : ''}
                              </span>
                              {s.reps && s.weight ? (
                                <span style={{ color: 'var(--color-text-faint)' }}>
                                  = {(s.reps * s.weight).toLocaleString()} lb
                                </span>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Cardio entries */}
                    {cardio.map(c => (
                      <div key={c.id} className="pt-2">
                        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>
                          {c.exercises?.name}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {c.distance_miles && `${c.distance_miles} mi`}
                          {c.duration_minutes && ` · ${c.duration_minutes} min`}
                          {c.elevation_ft && ` · ${c.elevation_ft} ft elevation`}
                          {c.vest_weight_lbs && ` · vest ${c.vest_weight_lbs} lb`}
                          {c.ruck_weight_lbs && ` · ruck ${c.ruck_weight_lbs} lb`}
                        </div>
                      </div>
                    ))}

                    {/* Notes */}
                    {w.notes && (
                      <p className="text-xs pt-1" style={{ color: 'var(--color-text-faint)' }}>{w.notes}</p>
                    )}

                    <button
                      className="btn btn-danger text-xs mt-2"
                      onClick={() => handleDelete(w.id)}
                    >
                      <Trash2 size={12} /> Delete Workout
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
