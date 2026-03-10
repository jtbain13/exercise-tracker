import { useState, useEffect, useRef } from 'react'
import { Plus, X, Check, Trash2, ChevronDown, ChevronUp, Bookmark } from 'lucide-react'
import { getExercises, createWorkout, addSet, addCardioEntry, deleteSet, deleteCardioEntry, getWorkout, getSavedLabels, saveLabel, removeLabel, getDistinctLabels } from '../lib/db'
import { format } from 'date-fns'

export default function LogWorkout() {
  const [exercises, setExercises] = useState([])
  const [workout, setWorkout] = useState(null)
  const [workoutName, setWorkoutName] = useState('')
  const [workoutDate, setWorkoutDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loggedSets, setLoggedSets] = useState([])
  const [loggedCardio, setLoggedCardio] = useState([])
  const [showStrength, setShowStrength] = useState(true)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [savedLabels, setSavedLabels] = useState([])
  const [historyLabels, setHistoryLabels] = useState([])
  const [showLabelDropdown, setShowLabelDropdown] = useState(false)
  const [showLabelManager, setShowLabelManager] = useState(false)
  const [newSavedLabel, setNewSavedLabel] = useState('')
  const labelInputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    loadExercises()
    loadLabels()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLabelDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadExercises() {
    try {
      const data = await getExercises()
      setExercises(data)
    } catch (err) {
      console.error(err)
    }
  }

  function loadLabels() {
    setSavedLabels(getSavedLabels())
    getDistinctLabels()
      .then(labels => setHistoryLabels(labels))
      .catch(err => console.error(err))
  }

  // Merge saved + history labels, deduplicated
  const allLabels = [...new Set([...savedLabels, ...historyLabels])].sort((a, b) => a.localeCompare(b))
  const filteredLabels = workoutName
    ? allLabels.filter(l => l.toLowerCase().includes(workoutName.toLowerCase()) && l !== workoutName)
    : allLabels

  async function startWorkout() {
    if (!workoutDate) return
    setLoading(true)
    try {
      const w = await createWorkout({ date: workoutDate, name: workoutName || null })
      setWorkout(w)
      // Auto-save label to library for future use
      if (workoutName.trim()) {
        setSavedLabels(saveLabel(workoutName))
      }
      flash('Workout started')
    } catch (err) {
      flash(err.message, true)
    }
    setLoading(false)
  }

  async function refreshWorkout() {
    if (!workout) return
    try {
      const w = await getWorkout(workout.id)
      setLoggedSets(w.sets || [])
      setLoggedCardio(w.cardio_log || [])
    } catch (err) {
      console.error(err)
    }
  }

  function flash(text, err = false) {
    setMsg({ text, err })
    setTimeout(() => setMsg(null), 2500)
  }

  const strengthExercises = exercises.filter(e => e.type === 'strength')
  const cardioExercises = exercises.filter(e => e.type === 'cardio')

  // Group logged sets by exercise
  const groupedSets = loggedSets.reduce((acc, s) => {
    const name = s.exercises?.name || 'Unknown'
    if (!acc[name]) acc[name] = []
    acc[name].push(s)
    return acc
  }, {})

  if (!workout) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>New Workout</h2>
        <div className="card p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Date</label>
            <input
              type="date"
              className="input"
              value={workoutDate}
              onChange={e => setWorkoutDate(e.target.value)}
            />
          </div>
          <div ref={dropdownRef} className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Label <span style={{ color: 'var(--color-text-faint)' }}>(optional)</span>
              </label>
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded hover:opacity-80 transition-opacity"
                style={{ color: 'var(--color-primary)' }}
                onClick={() => setShowLabelManager(!showLabelManager)}
              >
                <Bookmark size={12} />
                {showLabelManager ? 'Done' : 'Manage'}
              </button>
            </div>
            <input
              ref={labelInputRef}
              className="input"
              placeholder='e.g. Push Day, CALI-1 Bench'
              value={workoutName}
              onChange={e => {
                setWorkoutName(e.target.value)
                setShowLabelDropdown(true)
              }}
              onFocus={() => setShowLabelDropdown(true)}
              autoComplete="off"
            />

            {/* Autocomplete dropdown */}
            {showLabelDropdown && filteredLabels.length > 0 && (
              <div
                className="absolute z-10 left-0 right-0 mt-1 rounded-lg overflow-hidden shadow-lg max-h-40 overflow-y-auto"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                {filteredLabels.map(label => (
                  <button
                    key={label}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:opacity-80 transition-colors flex items-center justify-between"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                    onClick={() => {
                      setWorkoutName(label)
                      setShowLabelDropdown(false)
                    }}
                  >
                    <span>{label}</span>
                    {savedLabels.includes(label) && (
                      <Bookmark size={12} style={{ color: 'var(--color-primary)', fill: 'var(--color-primary)' }} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Label manager */}
            {showLabelManager && (
              <div className="mt-2 p-3 rounded-lg space-y-2" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder="Add a saved label..."
                    value={newSavedLabel}
                    onChange={e => setNewSavedLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (newSavedLabel.trim()) {
                          setSavedLabels(saveLabel(newSavedLabel))
                          setNewSavedLabel('')
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary px-3"
                    onClick={() => {
                      if (newSavedLabel.trim()) {
                        setSavedLabels(saveLabel(newSavedLabel))
                        setNewSavedLabel('')
                      }
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {savedLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {savedLabels.map(label => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-medium"
                        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
                      >
                        {label}
                        <button
                          type="button"
                          className="hover:opacity-70 ml-0.5"
                          onClick={() => setSavedLabels(removeLabel(label))}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>No saved labels yet. Add labels you use often.</p>
                )}
              </div>
            )}
          </div>
          <button className="btn btn-primary w-full" onClick={startWorkout} disabled={loading}>
            <Plus size={16} /> Start Workout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Workout header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            {workout.name || format(new Date(workout.date + 'T12:00:00'), 'EEE, MMM d')}
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {format(new Date(workout.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <button
          className="btn btn-ghost text-xs"
          onClick={() => {
            setWorkout(null)
            setLoggedSets([])
            setLoggedCardio([])
            setWorkoutName('')
          }}
        >
          Finish
        </button>
      </div>

      {/* Toast */}
      {msg && (
        <div
          className="text-sm px-3 py-2 rounded-lg text-center font-medium"
          style={{
            background: msg.err ? 'color-mix(in srgb, var(--color-error) 12%, transparent)' : 'color-mix(in srgb, var(--color-success) 12%, transparent)',
            color: msg.err ? 'var(--color-error)' : 'var(--color-success)'
          }}
        >
          {msg.text}
        </div>
      )}

      {/* Toggle: Strength / Cardio */}
      <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <button
          className="flex-1 py-2 text-sm font-medium transition-colors"
          style={{
            background: showStrength ? 'var(--color-primary)' : 'var(--color-surface)',
            color: showStrength ? 'white' : 'var(--color-text-muted)',
          }}
          onClick={() => setShowStrength(true)}
        >
          Strength
        </button>
        <button
          className="flex-1 py-2 text-sm font-medium transition-colors"
          style={{
            background: !showStrength ? 'var(--color-primary)' : 'var(--color-surface)',
            color: !showStrength ? 'white' : 'var(--color-text-muted)',
          }}
          onClick={() => setShowStrength(false)}
        >
          Cardio
        </button>
      </div>

      {/* Input forms */}
      {showStrength ? (
        <StrengthInput
          exercises={strengthExercises}
          workoutId={workout.id}
          onAdd={(s) => { setLoggedSets(prev => [...prev, s]); flash('Set logged') }}
        />
      ) : (
        <CardioInput
          exercises={cardioExercises}
          workoutId={workout.id}
          workoutDate={workout.date}
          onAdd={(c) => { setLoggedCardio(prev => [...prev, c]); flash('Cardio logged') }}
        />
      )}

      {/* Logged sets summary */}
      {Object.keys(groupedSets).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Logged Sets
          </h3>
          {Object.entries(groupedSets).map(([name, sets]) => (
            <div key={name} className="card p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{sets.length} sets</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sets
                  .sort((a, b) => a.set_number - b.set_number)
                  .map((s, i) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
                  >
                    {s.reps && `${s.reps}r`}
                    {s.weight ? ` × ${s.weight}lb` : ''}
                    {s.duration_seconds ? `${s.duration_seconds}s` : ''}
                    <button
                      className="ml-0.5 hover:opacity-70"
                      style={{ color: 'var(--color-text-faint)' }}
                      onClick={async () => {
                        await deleteSet(s.id)
                        setLoggedSets(prev => prev.filter(x => x.id !== s.id))
                      }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logged cardio summary */}
      {loggedCardio.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
            Cardio
          </h3>
          {loggedCardio.map(c => (
            <div key={c.id} className="card p-3 flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">{c.exercises?.name}</span>
                <span className="text-xs ml-2" style={{ color: 'var(--color-text-muted)' }}>
                  {c.distance_miles && `${c.distance_miles}mi`}
                  {c.duration_minutes && ` · ${c.duration_minutes}min`}
                  {c.vest_weight_lbs && ` · vest ${c.vest_weight_lbs}lb`}
                  {c.ruck_weight_lbs && ` · ruck ${c.ruck_weight_lbs}lb`}
                </span>
              </div>
              <button
                className="p-1 hover:opacity-70"
                style={{ color: 'var(--color-text-faint)' }}
                onClick={async () => {
                  await deleteCardioEntry(c.id)
                  setLoggedCardio(prev => prev.filter(x => x.id !== c.id))
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Strength Input ──────────────────────────────────────

function StrengthInput({ exercises, workoutId, onAdd }) {
  const [exerciseId, setExerciseId] = useState('')
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [duration, setDuration] = useState('')
  const [setNum, setSetNum] = useState(1)
  const [saving, setSaving] = useState(false)
  const repsRef = useRef(null)

  const selectedExercise = exercises.find(e => e.id === exerciseId)
  const filtered = search
    ? exercises.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    : exercises

  // Group by category
  const grouped = filtered.reduce((acc, e) => {
    if (!acc[e.category]) acc[e.category] = []
    acc[e.category].push(e)
    return acc
  }, {})

  async function handleSubmit(e) {
    e.preventDefault()
    if (!exerciseId) return
    setSaving(true)
    try {
      const s = await addSet({
        workout_id: workoutId,
        exercise_id: exerciseId,
        set_number: setNum,
        reps: reps ? Number(reps) : null,
        weight: weight ? Number(weight) : null,
        duration_seconds: duration ? Number(duration) : null,
      })
      onAdd(s)
      setSetNum(prev => prev + 1)
      setReps('')
      setWeight('')
      setDuration('')
      repsRef.current?.focus()
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      {/* Exercise picker */}
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Exercise</label>
        {!showSearch && selectedExercise ? (
          <button
            type="button"
            className="w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
            onClick={() => { setShowSearch(true); setSetNum(1) }}
          >
            <span className="font-medium">{selectedExercise.name}</span>
            <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>change</span>
          </button>
        ) : (
          <div className="space-y-2">
            <input
              className="input"
              placeholder="Search exercises..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-2">
              {Object.entries(grouped).map(([cat, exs]) => (
                <div key={cat}>
                  <div className="text-xs font-semibold uppercase tracking-wider px-1 py-1" style={{ color: 'var(--color-text-faint)' }}>{cat}</div>
                  {exs.map(ex => (
                    <button
                      key={ex.id}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm rounded hover:opacity-80 transition-colors"
                      style={{
                        background: exerciseId === ex.id ? 'var(--color-primary-light)' : 'transparent',
                        color: exerciseId === ex.id ? 'var(--color-primary)' : 'var(--color-text)',
                      }}
                      onClick={() => {
                        setExerciseId(ex.id)
                        setShowSearch(false)
                        setSearch('')
                        setSetNum(1)
                        setTimeout(() => repsRef.current?.focus(), 50)
                      }}
                    >
                      {ex.name}
                      {ex.muscle_group && (
                        <span className="text-xs ml-2" style={{ color: 'var(--color-text-faint)' }}>{ex.muscle_group}</span>
                      )}
                    </button>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm px-1 py-2" style={{ color: 'var(--color-text-faint)' }}>No matches</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick inputs */}
      {exerciseId && !showSearch && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Set #</label>
              <input
                type="number"
                className="input text-center"
                value={setNum}
                onChange={e => setSetNum(Number(e.target.value))}
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Reps</label>
              <input
                ref={repsRef}
                type="number"
                className="input text-center"
                placeholder="—"
                value={reps}
                onChange={e => setReps(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Weight (lb)</label>
              <input
                type="number"
                className="input text-center"
                placeholder="—"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                inputMode="decimal"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Duration (sec) <span style={{ color: 'var(--color-text-faint)' }}>for timed exercises</span>
            </label>
            <input
              type="number"
              className="input"
              placeholder="—"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              inputMode="numeric"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={saving || (!reps && !duration)}
          >
            <Check size={16} /> Log Set {setNum}
          </button>
        </>
      )}
    </form>
  )
}

// ─── Cardio Input ────────────────────────────────────────

function CardioInput({ exercises, workoutId, workoutDate, onAdd }) {
  const [exerciseId, setExerciseId] = useState('')
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [elevation, setElevation] = useState('')
  const [vestWeight, setVestWeight] = useState('')
  const [ruckWeight, setRuckWeight] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedExercise = exercises.find(e => e.id === exerciseId)
  const showWeightFields = selectedExercise && ['Hiking', 'Rucking', 'Walking'].includes(selectedExercise.name)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!exerciseId) return
    setSaving(true)
    try {
      const c = await addCardioEntry({
        workout_id: workoutId,
        exercise_id: exerciseId,
        date: workoutDate,
        distance_miles: distance ? Number(distance) : null,
        duration_minutes: duration ? Number(duration) : null,
        elevation_ft: elevation ? Number(elevation) : null,
        vest_weight_lbs: vestWeight ? Number(vestWeight) : null,
        ruck_weight_lbs: ruckWeight ? Number(ruckWeight) : null,
      })
      onAdd(c)
      setDistance('')
      setDuration('')
      setElevation('')
      setVestWeight('')
      setRuckWeight('')
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>Activity</label>
        <select
          className="input"
          value={exerciseId}
          onChange={e => setExerciseId(e.target.value)}
        >
          <option value="">Select activity...</option>
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>

      {exerciseId && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Distance (mi)</label>
              <input
                type="number"
                className="input"
                placeholder="—"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                inputMode="decimal"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Duration (min)</label>
              <input
                type="number"
                className="input"
                placeholder="—"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                inputMode="numeric"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Elevation (ft)</label>
            <input
              type="number"
              className="input"
              placeholder="—"
              value={elevation}
              onChange={e => setElevation(e.target.value)}
              inputMode="numeric"
            />
          </div>

          {showWeightFields && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Vest (lb)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="—"
                  value={vestWeight}
                  onChange={e => setVestWeight(e.target.value)}
                  inputMode="decimal"
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Ruck (lb)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="—"
                  value={ruckWeight}
                  onChange={e => setRuckWeight(e.target.value)}
                  inputMode="decimal"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={saving || (!distance && !duration)}
          >
            <Check size={16} /> Log Activity
          </button>
        </>
      )}
    </form>
  )
}
