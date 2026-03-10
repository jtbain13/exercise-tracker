import { supabase } from './supabase'

// ─── Exercises ───────────────────────────────────────────

export async function getExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function addExercise({ name, category, muscle_group, type }) {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ name, category, muscle_group: muscle_group || null, type: type || 'strength' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteExercise(id) {
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw error
}

// ─── Workouts ────────────────────────────────────────────

export async function getWorkouts(limit = 50) {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      sets(*, exercises(*)),
      cardio_log(*, exercises(*))
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getWorkout(id) {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      sets(*, exercises(*)),
      cardio_log(*, exercises(*))
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createWorkout({ date, name, notes }) {
  const { data, error } = await supabase
    .from('workouts')
    .insert({ date, name: name || null, notes: notes || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWorkout(id, updates) {
  const { data, error } = await supabase
    .from('workouts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWorkout(id) {
  const { error } = await supabase.from('workouts').delete().eq('id', id)
  if (error) throw error
}

// ─── Sets ────────────────────────────────────────────────

export async function addSet({ workout_id, exercise_id, set_number, reps, weight, duration_seconds, notes }) {
  const { data, error } = await supabase
    .from('sets')
    .insert({
      workout_id,
      exercise_id,
      set_number: set_number || 1,
      reps: reps || null,
      weight: weight || null,
      duration_seconds: duration_seconds || null,
      notes: notes || null
    })
    .select('*, exercises(*)')
    .single()
  if (error) throw error
  return data
}

export async function updateSet(id, updates) {
  const { data, error } = await supabase
    .from('sets')
    .update(updates)
    .eq('id', id)
    .select('*, exercises(*)')
    .single()
  if (error) throw error
  return data
}

export async function deleteSet(id) {
  const { error } = await supabase.from('sets').delete().eq('id', id)
  if (error) throw error
}

// ─── Cardio ──────────────────────────────────────────────

export async function addCardioEntry({ workout_id, exercise_id, date, distance_miles, duration_minutes, elevation_ft, vest_weight_lbs, ruck_weight_lbs, notes }) {
  const { data, error } = await supabase
    .from('cardio_log')
    .insert({
      workout_id: workout_id || null,
      exercise_id,
      date,
      distance_miles: distance_miles || null,
      duration_minutes: duration_minutes || null,
      elevation_ft: elevation_ft || null,
      vest_weight_lbs: vest_weight_lbs || null,
      ruck_weight_lbs: ruck_weight_lbs || null,
      notes: notes || null
    })
    .select('*, exercises(*)')
    .single()
  if (error) throw error
  return data
}

export async function deleteCardioEntry(id) {
  const { error } = await supabase.from('cardio_log').delete().eq('id', id)
  if (error) throw error
}

// ─── Stats ───────────────────────────────────────────────

export async function getRecentSets(days = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const { data, error } = await supabase
    .from('sets')
    .select('*, exercises(*), workouts!inner(date)')
    .gte('workouts.date', since.toISOString().split('T')[0])
  if (error) throw error
  return data
}

export async function getExerciseHistory(exerciseId, limit = 50) {
  const { data, error } = await supabase
    .from('sets')
    .select('*, workouts(date)')
    .eq('exercise_id', exerciseId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// ─── Labels ──────────────────────────────────────────────

const LABELS_KEY = 'exercise-tracker-saved-labels'

export function getSavedLabels() {
  try {
    const raw = localStorage.getItem(LABELS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLabel(label) {
  const labels = getSavedLabels()
  const trimmed = label.trim()
  if (!trimmed || labels.includes(trimmed)) return labels
  const updated = [...labels, trimmed].sort((a, b) => a.localeCompare(b))
  localStorage.setItem(LABELS_KEY, JSON.stringify(updated))
  return updated
}

export function removeLabel(label) {
  const labels = getSavedLabels().filter(l => l !== label)
  localStorage.setItem(LABELS_KEY, JSON.stringify(labels))
  return labels
}

export async function getDistinctLabels() {
  const { data, error } = await supabase
    .from('workouts')
    .select('name')
    .not('name', 'is', null)
    .order('name')
  if (error) throw error
  const unique = [...new Set(data.map(w => w.name).filter(Boolean))]
  return unique
}
