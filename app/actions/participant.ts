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

  // ── STEP 1: verify env vars are present ──────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    const missing = [!supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL', !serviceKey && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean).join(', ')
    return { error: `[DEBUG] Missing env vars: ${missing}` }
  }

  // ── STEP 2: build admin client ────────────────────────────────────────────
  let supabase: Awaited<ReturnType<typeof createAdminClient>>
  try {
    supabase = await createAdminClient()
  } catch (e) {
    return { error: `[DEBUG] createAdminClient threw: ${String(e)}` }
  }

  // ── STEP 3: fetch the question ────────────────────────────────────────────
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('correct_answer, time_limit')
    .eq('id', questionId)
    .single()

  if (questionError || !question) {
    return { error: `[DEBUG] Question fetch failed — code:${questionError?.code} msg:${questionError?.message} hint:${questionError?.hint}` }
  }

  const isCorrect = chosenOption === question.correct_answer

  let pointsEarned = 0
  if (isCorrect) {
    const timeLimitMs = timeLimit * 1000
    const ratio = Math.max(0, 1 - timeTakenMs / timeLimitMs)
    pointsEarned = Math.floor(500 + 500 * ratio)
  }

  // ── STEP 4: insert the answer ─────────────────────────────────────────────
  const { error: insertError } = await supabase
    .from('answers')
    .insert({
      session_id: sessionId,
      question_id: questionId,
      participant_id: participantId,
      chosen_option: chosenOption,
      is_correct: isCorrect,
      time_taken_ms: Math.round(timeTakenMs), // DB column is INTEGER — round the float
      points_earned: pointsEarned,
    })

  if (insertError) {
    if (insertError.code === '23505') {
      // Duplicate — student already answered. Read the stored row.
      const { data: existing, error: readError } = await supabase
        .from('answers')
        .select('is_correct, points_earned')
        .eq('session_id', sessionId)
        .eq('question_id', questionId)
        .eq('participant_id', participantId)
        .single()

      if (readError || !existing) {
        return { error: `[DEBUG] Duplicate read-back failed — code:${readError?.code} msg:${readError?.message}` }
      }
      return { pointsEarned: existing.points_earned, isCorrect: existing.is_correct }
    }
    return { error: `[DEBUG] INSERT failed — code:${insertError.code} msg:${insertError.message} hint:${insertError.hint} details:${insertError.details}` }
  }

  // ── STEP 5: update participant score ──────────────────────────────────────
  if (isCorrect) {
    const { error: rpcError } = await supabase.rpc('increment_participant_correct', {
      p_participant_id: participantId,
      p_points: pointsEarned,
    })
    if (rpcError) {
      // RPC not created yet — fall back to read-then-write
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
