import { Dumbbell, Clock, Library, BarChart3 } from 'lucide-react'

const tabs = [
  { id: 'log', label: 'Log', icon: Dumbbell },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'exercises', label: 'Library', icon: Library },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
]

export default function Nav({ page, setPage }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 border-t flex justify-around"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map(tab => {
        const Icon = tab.icon
        const active = page === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setPage(tab.id)}
            className="flex flex-col items-center gap-0.5 py-2 px-4 text-xs font-medium transition-colors"
            style={{
              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
