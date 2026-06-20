import { createClient } from '@/utils/superbase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#e11d48' }}>
          Supabase Credentials Missing
        </h1>
        <div style={{ padding: '1rem', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3', color: '#9f1239' }}>
          <p>Next.js environment variables for Supabase are not set on Vercel or locally.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Please add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> in your environment settings.
          </p>
        </div>
      </div>
    )
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: todos } = await supabase.from('todos').select()

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Supabase Connection Test (Todos)</h1>
      
      {todos && todos.length > 0 ? (
        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem' }}>
          {todos.map((todo: any) => (
            <li key={todo.id} style={{ margin: '0.5rem 0' }}>
              <strong>{todo.name}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <div style={{ padding: '1rem', background: '#f3f4f6', borderRadius: '8px', color: '#6b7280' }}>
          <p>No todos found or connection is working but table is empty.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Verify that your Supabase project contains a <code>todos</code> table with columns <code>id</code> and <code>name</code>.
          </p>
        </div>
      )}
    </div>
  )
}
