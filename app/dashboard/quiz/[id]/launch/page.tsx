import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LaunchClient from './LaunchClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function LaunchPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*, questions(count)')
    .eq('id', id)
    .eq('host_id', user.id)
    .single()

  if (!quiz) redirect('/dashboard')

  const questionCount = (quiz.questions as unknown as Array<{ count: number }>)?.[0]?.count ?? 0

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div className="container-sm">
        <div className="card card-glow animate-bounce-in" style={{ textAlign: 'center', gap: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-10)' }}>
          <div style={{ fontSize: '4rem' }}>🚀</div>
          <div>
            <h2 style={{ marginBottom: 'var(--space-2)' }}>{quiz.title}</h2>
            <p>{questionCount} questions ready to go</p>
          </div>

          {questionCount === 0 ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-danger-light)', marginBottom: 'var(--space-4)' }}>
                ⚠️ You need at least 1 question before launching.
              </p>
              <Link href={`/dashboard/quiz/${id}`} className="btn btn-primary">
                Add Questions
              </Link>
            </div>
          ) : (
            <LaunchClient quizId={id} />
          )}

          <Link href={`/dashboard/quiz/${id}`} className="btn btn-ghost btn-sm">
            ← Back to Editor
          </Link>
        </div>
      </div>
    </main>
  )
}
