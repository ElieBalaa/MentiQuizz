-- ============================================================
-- SEED: Forensic Science & AI Quiz
-- Run this in the Supabase SQL Editor AFTER the schema migration
-- Replace 'YOUR_HOST_USER_ID' with your actual auth.users UUID
-- (find it in Supabase → Authentication → Users)
-- ============================================================

DO $$
DECLARE
  v_quiz_id uuid;
  v_host_id uuid;
BEGIN
  -- Get the first user (or replace with your specific user ID)
  SELECT id INTO v_host_id FROM auth.users LIMIT 1;

  -- Create the quiz
  INSERT INTO public.quizzes (id, host_id, title, description)
  VALUES (
    uuid_generate_v4(),
    v_host_id,
    'Forensic Science & AI',
    'Test your knowledge on forensic evidence, artificial intelligence, and how AI is transforming forensic science — from fingerprint recognition to machine learning.'
  )
  RETURNING id INTO v_quiz_id;

  -- ---- QUESTION 1 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which of these is considered forensic evidence?',
    '[
      {"id": "a", "text": "A fingerprint found at a crime scene"},
      {"id": "b", "text": "A movie ticket"},
      {"id": "c", "text": "A weather forecast"},
      {"id": "d", "text": "A social media like"}
    ]'::jsonb,
    'a', 20, 0
  );

  -- ---- QUESTION 2 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What does AI stand for?',
    '[
      {"id": "a", "text": "Automated Information"},
      {"id": "b", "text": "Artificial Intelligence"},
      {"id": "c", "text": "Advanced Internet"},
      {"id": "d", "text": "Artificial Investigation"}
    ]'::jsonb,
    'b', 20, 1
  );

  -- ---- QUESTION 3 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which of these is an example of Artificial Intelligence?',
    '[
      {"id": "a", "text": "A calculator"},
      {"id": "b", "text": "Face recognition on a smartphone"},
      {"id": "c", "text": "A flashlight"},
      {"id": "d", "text": "A USB drive"}
    ]'::jsonb,
    'b', 20, 2
  );

  -- ---- QUESTION 4 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which forensic field mainly studies fingerprints?',
    '[
      {"id": "a", "text": "Toxicology"},
      {"id": "b", "text": "Ballistics"},
      {"id": "c", "text": "Dactyloscopy"},
      {"id": "d", "text": "Anthropology"}
    ]'::jsonb,
    'c', 20, 3
  );

  -- ---- QUESTION 5 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'A traditional computer program usually makes decisions by:',
    '[
      {"id": "a", "text": "Guessing randomly"},
      {"id": "b", "text": "Following predefined rules written by a programmer"},
      {"id": "c", "text": "Thinking like a human"},
      {"id": "d", "text": "Learning by itself automatically"}
    ]'::jsonb,
    'b', 25, 4
  );

  -- ---- QUESTION 6 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Machine learning differs from traditional programming because it:',
    '[
      {"id": "a", "text": "Never uses data"},
      {"id": "b", "text": "Learns patterns from examples instead of only fixed rules"},
      {"id": "c", "text": "Always gives perfect answers"},
      {"id": "d", "text": "Only works with robots"}
    ]'::jsonb,
    'b', 25, 5
  );

  -- ---- QUESTION 7 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which type of data is most suitable for training an AI system to recognize fingerprints?',
    '[
      {"id": "a", "text": "Thousands of labeled fingerprint images"},
      {"id": "b", "text": "Weather reports"},
      {"id": "c", "text": "Music files"},
      {"id": "d", "text": "Word documents"}
    ]'::jsonb,
    'a', 25, 6
  );

  -- ---- QUESTION 8 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Why is human verification still important when AI analyzes forensic evidence?',
    '[
      {"id": "a", "text": "AI is illegal"},
      {"id": "b", "text": "AI may make mistakes or miss context"},
      {"id": "c", "text": "AI cannot use computers"},
      {"id": "d", "text": "Humans work faster than AI"}
    ]'::jsonb,
    'b', 25, 7
  );

  -- ---- QUESTION 9 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which task is AI commonly used for in forensic science?',
    '[
      {"id": "a", "text": "Detecting fingerprint similarities"},
      {"id": "b", "text": "Writing criminal laws"},
      {"id": "c", "text": "Replacing judges"},
      {"id": "d", "text": "Determining prison sentences"}
    ]'::jsonb,
    'a', 25, 8
  );

  -- ---- QUESTION 10 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'If an AI system identifies a fingerprint match with 95% confidence, what does this most likely mean?',
    '[
      {"id": "a", "text": "The match is guaranteed."},
      {"id": "b", "text": "The AI is 95% intelligent."},
      {"id": "c", "text": "The system estimates a high probability, but a human examiner should still verify it."},
      {"id": "d", "text": "The fingerprint belongs to 95 different people."}
    ]'::jsonb,
    'c', 30, 9
  );

  -- ---- QUESTION 11 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'In machine learning, what is a "feature"?',
    '[
      {"id": "a", "text": "The brand of the computer"},
      {"id": "b", "text": "A measurable characteristic used by the model to make predictions"},
      {"id": "c", "text": "The software license"},
      {"id": "d", "text": "The screen resolution"}
    ]'::jsonb,
    'b', 30, 10
  );

  -- ---- QUESTION 12 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What is a "false positive" in forensic AI?',
    '[
      {"id": "a", "text": "The AI correctly identifies evidence."},
      {"id": "b", "text": "The AI incorrectly identifies a match that is actually wrong."},
      {"id": "c", "text": "The AI refuses to analyze evidence."},
      {"id": "d", "text": "The AI finds no similarities."}
    ]'::jsonb,
    'b', 30, 11
  );

  -- ---- QUESTION 13 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Why can bias occur in an AI model?',
    '[
      {"id": "a", "text": "Because AI becomes emotional."},
      {"id": "b", "text": "Because the training data may not represent all cases fairly."},
      {"id": "c", "text": "Because computers get tired."},
      {"id": "d", "text": "Because AI changes the evidence."}
    ]'::jsonb,
    'b', 30, 12
  );

  -- ---- QUESTION 14 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which statement best describes deep learning?',
    '[
      {"id": "a", "text": "It is a type of machine learning that uses multiple layers of artificial neural networks."},
      {"id": "b", "text": "It is another name for computer programming."},
      {"id": "c", "text": "It is a database management system."},
      {"id": "d", "text": "It is fingerprint powder used by investigators."}
    ]'::jsonb,
    'a', 35, 13
  );

  -- ---- QUESTION 15 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which of the following would MOST improve the accuracy of an AI model used for fingerprint recognition?',
    '[
      {"id": "a", "text": "Using fewer fingerprint images"},
      {"id": "b", "text": "Training on a large, diverse, accurately labeled fingerprint dataset"},
      {"id": "c", "text": "Increasing the computer screen brightness"},
      {"id": "d", "text": "Changing the file names of the images"}
    ]'::jsonb,
    'b', 35, 14
  );

  RAISE NOTICE 'Quiz created successfully! Quiz ID: %', v_quiz_id;
END $$;

-- Verify the insert
SELECT q.title, count(qs.id) as question_count
FROM public.quizzes q
JOIN public.questions qs ON qs.quiz_id = q.id
WHERE q.title = 'Forensic Science & AI'
GROUP BY q.title;
