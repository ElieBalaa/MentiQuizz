-- ============================================================
-- SEED: Relationship Quiz
-- Run this in the Supabase SQL Editor
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
    'Relationship Quiz ❤️',
    'Choose one answer for each question. No overthinking allowed 😄'
  )
  RETURNING id INTO v_quiz_id;

  -- ---- QUESTION 1 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What is your ideal date with me?',
    '[
      {"id": "a", "text": "Dinner at a nice restaurant"},
      {"id": "b", "text": "Movie night at home"},
      {"id": "c", "text": "A spontaneous road trip"},
      {"id": "d", "text": "A fun activity or adventure"}
    ]'::jsonb,
    'd', 20, 0
  );

  -- ---- QUESTION 2 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What is the best way for me to cheer you up?',
    '[
      {"id": "a", "text": "Give you a hug"},
      {"id": "b", "text": "Bring you food"},
      {"id": "c", "text": "Make you laugh"},
      {"id": "d", "text": "Listen and let you talk"}
    ]'::jsonb,
    'd', 20, 1
  );

  -- ---- QUESTION 3 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which gift would make you happiest?',
    '[
      {"id": "a", "text": "Flowers"},
      {"id": "b", "text": "Jewellery"},
      {"id": "c", "text": "Something handmade or personal"},
      {"id": "d", "text": "A surprise experience together"}
    ]'::jsonb,
    'd', 20, 2
  );

  -- ---- QUESTION 4 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What do you love most about our relationship?',
    '[
      {"id": "a", "text": "Our conversations"},
      {"id": "b", "text": "The fun we have together"},
      {"id": "c", "text": "The support we give each other"},
      {"id": "d", "text": "The romantic moments"}
    ]'::jsonb,
    'c', 20, 3
  );

  -- ---- QUESTION 5 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Where would you most like us to travel together?',
    '[
      {"id": "a", "text": "Paris"},
      {"id": "b", "text": "The Maldives"},
      {"id": "c", "text": "Italy"},
      {"id": "d", "text": "A destination chosen randomly"}
    ]'::jsonb,
    'c', 20, 4
  );

  -- ---- QUESTION 6 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'My most attractive quality is:',
    '[
      {"id": "a", "text": "My appearance"},
      {"id": "b", "text": "My sense of humour"},
      {"id": "c", "text": "My personality"},
      {"id": "d", "text": "The way I treat you"}
    ]'::jsonb,
    'd', 20, 5
  );

  -- ---- QUESTION 7 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which couple activity sounds the most fun?',
    '[
      {"id": "a", "text": "Cooking together"},
      {"id": "b", "text": "Playing games"},
      {"id": "c", "text": "Watching a series"},
      {"id": "d", "text": "Exploring a new place"}
    ]'::jsonb,
    'd', 20, 6
  );

  -- ---- QUESTION 8 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'When we disagree, what should I do first?',
    '[
      {"id": "a", "text": "Apologise immediately"},
      {"id": "b", "text": "Give you some space"},
      {"id": "c", "text": "Calmly discuss the situation"},
      {"id": "d", "text": "Bring snacks and negotiate"}
    ]'::jsonb,
    'c', 20, 7
  );

  -- ---- QUESTION 9 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What nickname would you prefer me to call you?',
    '[
      {"id": "a", "text": "Baby"},
      {"id": "b", "text": "Princess"},
      {"id": "c", "text": "My love"},
      {"id": "d", "text": "A special nickname only we use"}
    ]'::jsonb,
    'd', 20, 8
  );

  -- ---- QUESTION 10 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'How do you imagine us one year from now?',
    '[
      {"id": "a", "text": "Travelling together"},
      {"id": "b", "text": "Creating more beautiful memories"},
      {"id": "c", "text": "Becoming even closer"},
      {"id": "d", "text": "All of the above ❤️"}
    ]'::jsonb,
    'd', 20, 9
  );

  RAISE NOTICE 'Relationship quiz created successfully! Quiz ID: %', v_quiz_id;
END $$;

-- Verify the insert
SELECT q.title, count(qs.id) as question_count
FROM public.quizzes q
JOIN public.questions qs ON qs.quiz_id = q.id
WHERE q.title = 'Relationship Quiz ❤️'
GROUP BY q.title;
