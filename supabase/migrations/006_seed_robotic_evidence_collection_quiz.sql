-- ============================================================
-- SEED: Robotic Systems for Evidence Collection Quiz
-- After-Class Comprehension Check
-- Run this in the Supabase SQL Editor
-- Replace 'YOUR_HOST_USER_ID' with your actual auth.users UUID
-- (find it in Supabase -> Authentication -> Users)
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
    'Robotic Systems for Evidence Collection',
    'After-Class Comprehension Check: Test your understanding of how robotic systems are used in forensic evidence collection. Choose the best answer.'
  )
  RETURNING id INTO v_quiz_id;

  -- ---- QUESTION 1 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What is one benefit of using robots in forensic evidence collection?',
    '[
      {"id": "a", "text": "They replace the forensic investigator completely"},
      {"id": "b", "text": "They can help access risky or difficult areas"},
      {"id": "c", "text": "They automatically identify the suspect"},
      {"id": "d", "text": "They remove the need for documentation"}
    ]'::jsonb,
    'b', 30, 0
  );

  -- ---- QUESTION 2 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    '"Robots replace forensic investigators" is best described as:',
    '[
      {"id": "a", "text": "Reality"},
      {"id": "b", "text": "Myth"},
      {"id": "c", "text": "Always true in modern crime scenes"},
      {"id": "d", "text": "True only when AI is used"}
    ]'::jsonb,
    'b', 30, 1
  );

  -- ---- QUESTION 3 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'How can robots help reduce contamination at a crime scene?',
    '[
      {"id": "a", "text": "By limiting unnecessary human entry into the scene"},
      {"id": "b", "text": "By deleting unclear evidence"},
      {"id": "c", "text": "By deciding which evidence is important"},
      {"id": "d", "text": "By replacing chain of custody"}
    ]'::jsonb,
    'a', 30, 2
  );

  -- ---- QUESTION 4 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which statement about robots and fragile evidence is correct?',
    '[
      {"id": "a", "text": "Robots can never damage evidence"},
      {"id": "b", "text": "Robots may damage fragile evidence if not controlled carefully"},
      {"id": "c", "text": "Robots should always collect fragile evidence first"},
      {"id": "d", "text": "Robots make evidence stronger"}
    ]'::jsonb,
    'b', 30, 3
  );

  -- ---- QUESTION 5 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Why might a robot be used before investigators enter a dangerous scene?',
    '[
      {"id": "a", "text": "To clean the scene"},
      {"id": "b", "text": "To document and assess the area safely"},
      {"id": "c", "text": "To remove all evidence quickly"},
      {"id": "d", "text": "To interview witnesses"}
    ]'::jsonb,
    'b', 30, 4
  );

  -- ---- QUESTION 6 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What is one limitation of robotic systems in forensic work?',
    '[
      {"id": "a", "text": "They do not need human supervision"},
      {"id": "b", "text": "They may have difficulty handling complex or delicate situations"},
      {"id": "c", "text": "They always make better decisions than experts"},
      {"id": "d", "text": "They can work without documentation"}
    ]'::jsonb,
    'b', 30, 5
  );

  -- ---- QUESTION 7 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which task can a robot support at a crime scene?',
    '[
      {"id": "a", "text": "Scene documentation"},
      {"id": "b", "text": "Writing the final court judgment"},
      {"id": "c", "text": "Deciding guilt"},
      {"id": "d", "text": "Replacing the forensic report"}
    ]'::jsonb,
    'a', 30, 6
  );

  -- ---- QUESTION 8 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Why is human control still important when using forensic robots?',
    '[
      {"id": "a", "text": "Because robots cannot be used indoors"},
      {"id": "b", "text": "Because investigators must guide, interpret, and validate the robot''s actions"},
      {"id": "c", "text": "Because robots are only for entertainment"},
      {"id": "d", "text": "Because robots automatically understand legal rules"}
    ]'::jsonb,
    'b', 30, 7
  );

  -- ---- QUESTION 9 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    '"Robots are always safer than humans" is best described as:',
    '[
      {"id": "a", "text": "Reality"},
      {"id": "b", "text": "Myth"},
      {"id": "c", "text": "A proven forensic rule"},
      {"id": "d", "text": "A legal requirement"}
    ]'::jsonb,
    'b', 30, 8
  );

  -- ---- QUESTION 10 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which statement is most professional for a forensic report?',
    '[
      {"id": "a", "text": "The robot proved what happened."},
      {"id": "b", "text": "The robot collected possible evidence, which should be verified and documented by investigators."},
      {"id": "c", "text": "The robot''s result does not need review."},
      {"id": "d", "text": "The robot replaces the investigator''s judgment."}
    ]'::jsonb,
    'b', 30, 9
  );

  RAISE NOTICE 'Robotic Systems for Evidence Collection quiz created successfully! Quiz ID: %', v_quiz_id;
END $$;

-- Verify the insert
SELECT q.title, count(qs.id) as question_count
FROM public.quizzes q
JOIN public.questions qs ON qs.quiz_id = q.id
WHERE q.title = 'Robotic Systems for Evidence Collection'
GROUP BY q.title;
