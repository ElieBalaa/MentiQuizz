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

  // Insert answer (ignore duplicate if already answered)
  const { error: answerError } = await supabase
    .from('answers')
    .upsert({
      session_id: sessionId,
      question_id: questionId,
      participant_id: participantId,
      chosen_option: chosenOption,
      is_correct: isCorrect,
      time_taken_ms: timeTakenMs,
      points_earned: pointsEarned,
    }, { onConflict: 'session_id,question_id,participant_id', ignoreDuplicates: true })

  if (answerError) return { error: 'Failed to submit answer' }

  // Update participant score
  if (isCorrect) {
    // Fetch current score and update manually
    const { data: pData } = await supabase
      .from('participants')
      .select('score, correct_count, answers_count')
      .eq('id', participantId)
      .single()

    if (pData) {
      await supabase
        .from('participants')
        .update({
          score: pData.score + pointsEarned,
          correct_count: pData.correct_count + 1,
          answers_count: pData.answers_count + 1,
        })
        .eq('id', participantId)
    }
  } else {
    // Update answer count only
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

  return { pointsEarned, isCorrect }
}
