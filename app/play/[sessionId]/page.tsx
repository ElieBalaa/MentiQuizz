import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlayClient from './PlayClient'

interface PageProps {
  params: Promise<{ sessionId: string }>
}

export default async function PlayPage({ params }: PageProps) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: session } = await supabase
    .from('sessions')
    .select('*, quiz:quizzes(title)')
    .eq('id', sessionId)
    .single()

  if (!session) redirect('/join')
  if (session.status === 'finished') redirect('/join')

  const quizTitle = (session.quiz as { title: string })?.title ?? 'Quiz'

  return <PlayClient sessionId={sessionId} quizTitle={quizTitle} initialStatus={session.status} />
}
