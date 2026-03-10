export default function Setup() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="card p-8 max-w-lg w-full space-y-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          <span style={{ color: 'var(--color-primary)' }}>⚡</span> Exercise Tracker Setup
        </h1>

        <div className="space-y-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <p>To get started, you need to connect a Supabase project:</p>

          <ol className="space-y-3 list-decimal list-inside">
            <li>Go to <a href="https://supabase.com" target="_blank" rel="noopener" className="underline" style={{ color: 'var(--color-primary)' }}>supabase.com</a> and create a free project</li>
            <li>Run the SQL schema from <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--color-surface-2)' }}>supabase-schema.sql</code> in the SQL Editor</li>
            <li>
              Create a <code className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--color-surface-2)' }}>.env</code> file in the project root:
              <pre className="mt-2 p-3 rounded text-xs overflow-x-auto" style={{ background: 'var(--color-surface-2)' }}>
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
              </pre>
            </li>
            <li>Restart the dev server</li>
          </ol>

          <p className="pt-2">
            Find your URL and anon key in Supabase under{' '}
            <strong>Settings → API</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
