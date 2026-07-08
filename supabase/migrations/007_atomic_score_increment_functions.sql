-- ============================================================
-- Migration: Atomic participant score increment functions
-- Replaces the read-then-write pattern in submitAnswer that
-- caused lost updates when many students submitted concurrently.
-- ============================================================

-- Called when a student answers CORRECTLY.
-- Atomically increments score, correct_count, and answers_count.
CREATE OR REPLACE FUNCTION increment_participant_correct(
  p_participant_id uuid,
  p_points integer
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.participants
  SET
    score         = score + p_points,
    correct_count = correct_count + 1,
    answers_count = answers_count + 1
  WHERE id = p_participant_id;
$$;

-- Called when a student answers INCORRECTLY.
-- Atomically increments answers_count only.
CREATE OR REPLACE FUNCTION increment_participant_answers(
  p_participant_id uuid
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.participants
  SET answers_count = answers_count + 1
  WHERE id = p_participant_id;
$$;
