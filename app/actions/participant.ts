'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

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
  // Use admin client so unauthenticated participants can always write answers.
  // RLS on the anon client blocks write operations for non-logged-in users
  // even when the policy says "with check (true)" due to PostgREST upsert
  // conflict resolution requiring an UPDATE grant that doesn't exist.
  const supabase = await createAdminClient()

  // Get correct answer
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('correct_answer, time_limit')
    .eq('id', questionId)
    .single()

  if (questionError || !question) {
    console.error('[submitAnswer] question fetch error:', questionError)
    return { error: 'Question not found' }
  }

  const isCorrect = chosenOption === question.correct_answer

  // Calculate points (Kahoot-style: 500–1000 based on speed)
  let pointsEarned = 0
  if (isCorrect) {
    const timeLimitMs = timeLimit * 1000
    const ratio = Math.max(0, 1 - timeTakenMs / timeLimitMs)
    pointsEarned = Math.floor(500 + 500 * ratio)
  }

  // Plain INSERT — if the student already answered (page reload / double-click),
  // Postgres returns error code 23505 (unique_violation). We catch that and
  // read back the existing row so the UI still gets the correct result.
  const { error: insertError } = await supabase
    .from('answers')
    .insert({
      session_id: sessionId,
      question_id: questionId,
      participant_id: participantId,
      chosen_option: chosenOption,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
      points_earned: pointsEarned,
    })

  if (insertError) {
    if (insertError.code === '23505') {
      // Duplicate — student already answered (e.g. page reload). Read the stored row.
      const { data: existing, error: readError } = await supabase
        .from('answers')
        .select('is_correct, points_earned')
        .eq('session_id', sessionId)
        .eq('question_id', questionId)
        .eq('participant_id', participantId)
        .single()

      if (readError || !existing) {
        console.error('[submitAnswer] duplicate read-back error:', readError)
        return { error: 'Failed to submit answer' }
      }

      return { pointsEarned: existing.points_earned, isCorrect: existing.is_correct }
    }

    console.error('[submitAnswer] insert error:', insertError)
    return { error: 'Failed to submit answer' }
  }

  // Fresh insert succeeded — atomically update the participant's score.
  if (isCorrect) {
    const { error: rpcError } = await supabase.rpc('increment_participant_correct', {
      p_participant_id: participantId,
      p_points: pointsEarned,
    })
    if (rpcError) {
      // Fallback to read-then-write if RPC doesn't exist yet
      console.warn('[submitAnswer] RPC not found, falling back:', rpcError.message)
      const { data: p } = await supabase
        .from('participants')
        .select('score, correct_count, answers_count')
        .eq('id', participantId)
        .single()
      if (p) {
        await supabase
          .from('participants')
          .update({
            score: p.score + pointsEarned,
            correct_count: p.correct_count + 1,
            answers_count: p.answers_count + 1,
          })
          .eq('id', participantId)
      }
    }
  } else {
    const { error: rpcError } = await supabase.rpc('increment_participant_answers', {
      p_participant_id: participantId,
    })
    if (rpcError) {
      console.warn('[submitAnswer] RPC not found, falling back:', rpcError.message)
      const { data: p } = await supabase
        .from('participants')
        .select('answers_count')
        .eq('id', participantId)
        .single()
      if (p) {
        await supabase
          .from('participants')
          .update({ answers_count: p.answers_count + 1 })
          .eq('id', participantId)
      }
    }
  }

  return { pointsEarned, isCorrect }
}
