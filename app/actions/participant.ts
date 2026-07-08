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

  // Insert the answer. ignoreDuplicates:true means if this student already answered
  // (e.g. page reload), the insert is silently skipped with no error.
  // We always follow up with a read so we get the authoritative stored values.
  const { error: insertError } = await supabase
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
      { onConflict: 'session_id,question_id,participant_id', ignoreDuplicates: true }
    )

  if (insertError) {
    console.error('[submitAnswer] upsert error:', insertError)
    return { error: 'Failed to submit answer' }
  }

  // Always read back the stored row — handles both fresh inserts and
  // ignored duplicates (e.g. student reloaded mid-question).
  const { data: stored, error: readError } = await supabase
    .from('answers')
    .select('is_correct, points_earned, chosen_option')
    .eq('session_id', sessionId)
    .eq('question_id', questionId)
    .eq('participant_id', participantId)
    .single()

  if (readError || !stored) {
    console.error('[submitAnswer] read-back error:', readError)
    return { error: 'Failed to submit answer' }
  }

  const storedIsCorrect = stored.is_correct
  const storedPoints = stored.points_earned

  // Only update the score if this was a FRESH insert (not a duplicate skip).
  // We detect a fresh insert by checking if isCorrect matches what we sent;
  // if it's a duplicate, storedIsCorrect may differ — either way the score
  // was already counted on the original submission.
  const wasFreshInsert = stored.chosen_option !== undefined
    ? stored.chosen_option === chosenOption
    : true

  // Atomic score update — no read-then-write race under concurrent submissions.
  if (wasFreshInsert) {
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
  }

  return { pointsEarned: storedPoints, isCorrect: storedIsCorrect }
}
