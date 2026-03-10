import { useState, useEffect } from 'react'
import { Plus, Trash2, Search } from 'lucide-react'
import { getExercises, addExercise, deleteExercise } from '../lib/db'

const CATEGORIES = ['Push', 'Pull', 'Legs', 'Core', 'Full Body', 'Cardio', 'Other']
const MUSCLE_GROUPS = ['Chest', 'Shoulders', 'Triceps', 'Back', 'Biceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body']

export default function Exercises() {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCategory, setNewCategory] = useState('Push')
  const [newMuscle, setNewMuscle] = useState('')
  const [newType, setNewType] = useState('strength')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getExercises()
      setExercises(data)
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    try {
      const ex = await addExercise({
        name: newName.trim(),
        category: newCategory,
        muscle_group: newMuscle || null,
        type: newType,
      })
      setExercises(prev => [...prev, ex].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewMuscle('')
      setShowAdd(false)
    } catch (err) {
      alert(err.message)
    }
    setSaving(false)
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This won't remove logged sets.`)) return
    try {
      await deleteExercise(id)
      setExercises(prev => prev.filter(e => e.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const filtered = search
    ? exercises.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.muscle_group || '').toLowerCase().includes(search.toLowerCase())
      )
    : exercises

  const grouped = filtered.reduce((acc, e) => {
    const cat = e.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(e)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>Exercise Library</h2>
        <button className="btn btn-primary text-xs" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="card p-4 space-y-3">
          <input
            className="input"
            placeholder="Exercise name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Category</label>
              <select className="input" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Type</label>
              <select className="input" value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="strength">Strength</option>
                <option value="cardio">Cardio</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>Muscle Group</label>
            <select className="input" value={newMuscle} onChange={e => setNewMuscle(e.target.value)}>
              <option value="">None</option>
              {MUSCLE_GROUPS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1" disabled={saving || !newName.trim()}>
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-faint)' }} />
        <input
          className="input pl-9"
          placeholder="Search exercises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading...</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([cat, exs]) => (
            <div key={cat}>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-text-muted)' }}>
                {cat} <span style={{ color: 'var(--color-text-faint)' }}>({exs.length})</span>
              </h3>
              <div className="card divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {exs.map(ex => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between px-3 py-2"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div>
                      <span className="text-sm">{ex.name}</span>
                      {ex.muscle_group && (
                        <span className="text-xs ml-2" style={{ color: 'var(--color-text-faint)' }}>{ex.muscle_group}</span>
                      )}
                    </div>
                    <button
                      className="p-1.5 rounded hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--color-text-faint)' }}
                      onClick={() => handleDelete(ex.id, ex.name)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-faint)' }}>No exercises found</p>
          )}
        </div>
      )}
    </div>
  )
}
