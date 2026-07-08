'use server'

import { createClient } from '@/lib/supabase/server'

export async function joinSession(roomCode: string, displayName: string): Promise<{ sessionId: string; participantId: string } | { error: string }> {
  const supabase = await createClient()

  // Find session by room code
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, status')
    .eq('room_code', roomCode.trim())
    .single()

  if (sessionError || !session) {
    return { error: 'Room not found. Check your code and try again.' }
  }

  if (session.status === 'finished') {
    return { error: 'This quiz has already ended.' }
  }

  // Create participant record
  const { data: participant, error: participantError } = await supabase
    .from('participants')
    .insert({
      session_id: session.id,
      display_name: displayName.trim(),
      score: 0,
    })
    .select()
    .single()

  if (participantError || !participant) {
    return { error: 'Failed to join. Please try again.' }
  }

  return { sessionId: session.id, participantId: participant.id }
}

export async function submitAnswer(
  sessionId: string,
  questionId: string,
  participantId: string,
  chosenOption: string,
  timeTakenMs: number,
  timeLimit: number
): Promise<{ pointsEarned: number; isCorrect: boolean } | { error: string }> {
  const supabase = await createClient()

  // Get correct answer
  const { data: question } = await supabase
    .from('questions')
    .select('correct_answer, time_limit')
    .eq('id', questionId)
    .single()

  if (!question) return { error: 'Question not found' }

  const isCorrect = chosenOption === question.correct_answer

  // Calculate points
  let pointsEarned = 0
  if (isCorrect) {
    const timeLimitMs = timeLimit * 1000
    const ratio = Math.max(0, 1 - timeTakenMs / timeLimitMs)
    pointsEarned = Math.floor(500 + 500 * ratio)
  }

  // Upsert the answer. ignoreDuplicates:false means if a row already exists
  // (duplicate key) it will update it and return the stored values.
  const { data: inserted, error: answerError } = await supabase
    .from('answers')
    .upsert(
      {
        session_id: sessionId,
        question_id: questionId,
        participant_id: participantId,
        chosen_option: chosenOption,
        is_correct: isCorrect,
        time_taken_ms: timeTakenMs,
        points_earned: pointsEarned,
      },
      { onConflict: 'session_id,question_id,participant_id', ignoreDuplicates: false }
    )
    .select('is_correct, points_earned, chosen_option')
    .single()

  if (answerError || !inserted) {
    // Last-resort: try to read the existing row (e.g. RLS blocked the upsert)
    const { data: existing } = await supabase
      .from('answers')
      .select('is_correct, points_earned')
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
      .eq('participant_id', participantId)
      .single()
    if (existing) {
      return { pointsEarned: existing.points_earned, isCorrect: existing.is_correct }
    }
    return { error: 'Failed to submit answer' }
  }

  // Use values that were actually stored (handles the case where this was a duplicate
  // and the upsert updated the row with new values).
  const storedIsCorrect = inserted.is_correct
  const storedPoints = inserted.points_earned

  // Atomic score update using Postgres-level increment to avoid lost-update
  // races when many students submit at the same time.
  if (storedIsCorrect) {
    await supabase.rpc('increment_participant_correct', {
      p_participant_id: participantId,
      p_points: storedPoints,
    })
  } else {
    await supabase.rpc('increment_participant_answers', {
      p_participant_id: participantId,
    })
  }

  return { pointsEarned: storedPoints, isCorrect: storedIsCorrect }
}
