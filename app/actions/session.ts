'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createSession(quizId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Generate unique room code via DB function
  const { data: codeData } = await supabase.rpc('generate_room_code')
  const roomCode = codeData as string

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      quiz_id: quizId,
      host_id: user.id,
      room_code: roomCode,
      status: 'waiting',
      current_question_index: -1,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

export async function advanceSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Get current session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*, quiz:quizzes(questions(*))')
    .eq('id', sessionId)
    .eq('host_id', user.id)
    .single()

  if (sessionError || !session) throw new Error('Session not found')

  const questions = (session.quiz as { questions: { id: string; order_index: number }[] })
    ?.questions?.sort((a, b) => a.order_index - b.order_index) ?? []

  const nextIndex = session.current_question_index + 1

  if (session.status === 'question') {
    // Move to results phase first
    await supabase
      .from('sessions')
      .update({ status: 'results', updated_at: new Date().toISOString() })
      .eq('id', sessionId)
    revalidatePath(`/host/${sessionId}`)
    return
  }

  if (session.status === 'results' || session.status === 'leaderboard') {
    // Move to leaderboard or next question
    if (session.status === 'results') {
      await supabase
        .from('sessions')
        .update({ status: 'leaderboard', updated_at: new Date().toISOString() })
        .eq('id', sessionId)
      revalidatePath(`/host/${sessionId}`)
      return
    }
  }

  if (nextIndex >= questions.length) {
    // End the game
    await supabase
      .from('sessions')
      .update({ status: 'finished', updated_at: new Date().toISOString() })
      .eq('id', sessionId)
  } else {
    // Next question
    const nextQuestion = questions[nextIndex]
    await supabase
      .from('sessions')
      .update({
        status: 'question',
        current_question_index: nextIndex,
        current_question_id: nextQuestion.id,
        question_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
  }

  revalidatePath(`/host/${sessionId}`)
}

export async function startSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*, quiz:quizzes(questions(*))')
    .eq('id', sessionId)
    .eq('host_id', user.id)
    .single()

  if (sessionError || !session) throw new Error('Session not found')

  const questions = (session.quiz as { questions: { id: string; order_index: number }[] })
    ?.questions?.sort((a, b) => a.order_index - b.order_index) ?? []

  if (questions.length === 0) throw new Error('No questions in quiz')

  const firstQuestion = questions[0]

  await supabase
    .from('sessions')
    .update({
      status: 'question',
      current_question_index: 0,
      current_question_id: firstQuestion.id,
      question_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  revalidatePath(`/host/${sessionId}`)
}

export async function endSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  await supabase
    .from('sessions')
    .update({ status: 'finished', updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('host_id', user.id)

  revalidatePath(`/host/${sessionId}`)
}

export async function skipLeaderboardToNextQuestion(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*, quiz:quizzes(questions(*))')
    .eq('id', sessionId)
    .eq('host_id', user.id)
    .single()

  if (sessionError || !session) throw new Error('Session not found')

  const questions = (session.quiz as { questions: { id: string; order_index: number }[] })
    ?.questions?.sort((a, b) => a.order_index - b.order_index) ?? []

  const nextIndex = session.current_question_index + 1

  if (nextIndex >= questions.length) {
    await supabase
      .from('sessions')
      .update({ status: 'finished', updated_at: new Date().toISOString() })
      .eq('id', sessionId)
  } else {
    const nextQuestion = questions[nextIndex]
    await supabase
      .from('sessions')
      .update({
        status: 'question',
        current_question_index: nextIndex,
        current_question_id: nextQuestion.id,
        question_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
  }

  revalidatePath(`/host/${sessionId}`)
}
