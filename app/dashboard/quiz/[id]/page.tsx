import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import QuizEditorClient from './QuizEditorClient'
import type { Question } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function QuizEditorPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .eq('host_id', user.id)
    .single()

  if (!quiz) redirect('/dashboard')

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', id)
    .order('order_index')

  return (
    <main style={{ minHeight: '100vh', paddingBottom: 'var(--space-16)' }}>
      <nav className="navbar">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn btn-ghost btn-sm">← Back</Link>
          <span style={{ color: 'var(--color-border)' }}>|</span>
          <span className="logo" style={{ fontSize: '1.2rem' }}>⚡ QuizLive</span>
        </div>
        <Link href={`/dashboard/quiz/${id}/launch`} className="btn btn-primary btn-sm">
          🚀 Launch Quiz
        </Link>
      </nav>

      <div className="container-md" style={{ paddingTop: 'var(--space-10)' }}>
        <QuizEditorClient
          quiz={quiz}
          initialQuestions={(questions ?? []) as Question[]}
        />
      </div>
    </main>
  )
}
