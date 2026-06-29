import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HostControlPanel from './HostControlPanel'

interface PageProps {
  params: Promise<{ sessionId: string }>
}

export default async function HostPage({ params }: PageProps) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: session } = await supabase
    .from('sessions')
    .select('*, quiz:quizzes(*, questions(*))')
    .eq('id', sessionId)
    .eq('host_id', user.id)
    .single()

  if (!session) redirect('/dashboard')

  // Sort questions by order_index
  const quiz = session.quiz as { title: string; questions: Array<{ id: string; order_index: number; question_text: string; options: Array<{id:string;text:string}>; correct_answer: string; time_limit: number }> }
  quiz.questions = quiz.questions.sort((a, b) => a.order_index - b.order_index)

  const { data: participants } = await supabase
    .from('participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('score', { ascending: false })

  return (
    <HostControlPanel
      initialSession={session}
      quiz={quiz}
      initialParticipants={participants ?? []}
    />
  )
}
