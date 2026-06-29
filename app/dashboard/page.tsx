import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*, questions(count)')
    .eq('host_id', user.id)
    .order('updated_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', user.id)
    .single()

  return (
    <main style={{ minHeight: '100vh', paddingBottom: 'var(--space-16)' }}>
      <nav className="navbar">
        <Link href="/" className="logo">⚡ QuizLive</Link>
        <div className="flex gap-3 items-center">
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            {profile?.display_name || profile?.email}
          </span>
          <SignOutButton />
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 'var(--space-10)' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-1)' }}>My Quizzes</h1>
            <p>Create and manage your interactive quizzes</p>
          </div>
          <DashboardClient />
        </div>

        {(!quizzes || quizzes.length === 0) ? (
          <div className="empty-state animate-fade-in">
            <div className="empty-state-icon">🎯</div>
            <h3>No quizzes yet</h3>
            <p>Create your first quiz to get started</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}>
            {quizzes.map((quiz, i) => (
              <div
                key={quiz.id}
                className="card animate-slide-up"
                style={{ animationDelay: `${i * 0.05}s`, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
              >
                <div className="flex justify-between items-center">
                  <span className="badge badge-primary">
                    {(quiz.questions as unknown as Array<{ count: number }>)?.[0]?.count ?? 0} questions
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {new Date(quiz.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <h3 style={{ marginBottom: 'var(--space-1)', fontSize: '1.2rem' }}>{quiz.title}</h3>
                  {quiz.description && (
                    <p style={{ fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {quiz.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2" style={{ marginTop: 'auto', flexWrap: 'wrap' }}>
                  <Link href={`/dashboard/quiz/${quiz.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                    ✏️ Edit
                  </Link>
                  <LaunchButton quizId={quiz.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function SignOutButton() {
  return (
    <form action="/auth/signout" method="POST">
      <button type="submit" className="btn btn-ghost btn-sm">Sign Out</button>
    </form>
  )
}

function LaunchButton({ quizId }: { quizId: string }) {
  return (
    <Link href={`/dashboard/quiz/${quizId}/launch`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
      🚀 Launch
    </Link>
  )
}
