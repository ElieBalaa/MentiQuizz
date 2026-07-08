-- ============================================================
-- SEED: Using Drones for Crime Scene Mapping Quiz
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
    'Using Drones for Crime Scene Mapping',
    'Test your knowledge on how drones are used in crime scene documentation and reconstruction. Choose the best answer.'
  )
  RETURNING id INTO v_quiz_id;

  -- ---- QUESTION 1 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What is one of the main benefits of using drones in crime scene documentation?',
    '[
      {"id": "a", "text": "They replace the investigator completely"},
      {"id": "b", "text": "They capture aerial views quickly while reducing scene disturbance"},
      {"id": "c", "text": "They automatically solve the crime"},
      {"id": "d", "text": "They remove the need for photographs"}
    ]'::jsonb,
    'b', 30, 0
  );

  -- ---- QUESTION 2 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What is the main difference between a ground view and an aerial view?',
    '[
      {"id": "a", "text": "Ground view shows more spatial relationships"},
      {"id": "b", "text": "Aerial view gives better overall scene context"},
      {"id": "c", "text": "Aerial view is always more detailed than ground view"},
      {"id": "d", "text": "Ground view is not useful in investigations"}
    ]'::jsonb,
    'b', 30, 1
  );

  -- ---- QUESTION 3 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'In photogrammetry, why do drone images need to overlap?',
    '[
      {"id": "a", "text": "To make the images look more professional"},
      {"id": "b", "text": "To allow the software to match common points and rebuild the scene"},
      {"id": "c", "text": "To reduce the number of images needed"},
      {"id": "d", "text": "To hide unclear areas in the scene"}
    ]'::jsonb,
    'b', 30, 2
  );

  -- ---- QUESTION 4 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What is an orthomosaic?',
    '[
      {"id": "a", "text": "A 3D animation of the suspect movement"},
      {"id": "b", "text": "A corrected aerial map made from many drone images"},
      {"id": "c", "text": "A single close-up evidence photograph"},
      {"id": "d", "text": "A video recorded by the drone"}
    ]'::jsonb,
    'b', 30, 3
  );

  -- ---- QUESTION 5 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which of the following is the best reason to plan the flight boundary before flying?',
    '[
      {"id": "a", "text": "To make the drone fly faster"},
      {"id": "b", "text": "To make sure the whole scene and buffer area are covered"},
      {"id": "c", "text": "To avoid taking too many photographs"},
      {"id": "d", "text": "To make the images darker"}
    ]'::jsonb,
    'b', 30, 4
  );

  -- ---- QUESTION 6 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What can a 3D model help investigators do?',
    '[
      {"id": "a", "text": "Interpret the scene from different angles"},
      {"id": "b", "text": "Replace all physical evidence"},
      {"id": "c", "text": "Prove automatically who committed the crime"},
      {"id": "d", "text": "Avoid writing a report"}
    ]'::jsonb,
    'a', 30, 5
  );

  -- ---- QUESTION 7 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What does AI evidence-marker detection usually provide?',
    '[
      {"id": "a", "text": "Final legal conclusions"},
      {"id": "b", "text": "Candidate objects that investigators must verify"},
      {"id": "c", "text": "A guaranteed list of all evidence"},
      {"id": "d", "text": "A replacement for chain of custody"}
    ]'::jsonb,
    'b', 30, 6
  );

  -- ---- QUESTION 8 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which factor can reduce the quality of a drone-based reconstruction?',
    '[
      {"id": "a", "text": "Good image overlap"},
      {"id": "b", "text": "Clear lighting"},
      {"id": "c", "text": "Blurry images"},
      {"id": "d", "text": "Proper flight planning"}
    ]'::jsonb,
    'c', 30, 7
  );

  -- ---- QUESTION 9 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Why is scale important in drone mapping?',
    '[
      {"id": "a", "text": "It makes the map visually attractive"},
      {"id": "b", "text": "It allows the model to become measurable and more reliable"},
      {"id": "c", "text": "It removes the need for investigators"},
      {"id": "d", "text": "It makes the drone fly higher"}
    ]'::jsonb,
    'b', 30, 8
  );

  -- ---- QUESTION 10 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which statement is best for professional reporting?',
    '[
      {"id": "a", "text": "The AI proves this object is the weapon."},
      {"id": "b", "text": "The model is perfect and contains no errors."},
      {"id": "c", "text": "The aerial data suggests a possible item of interest, which requires investigator confirmation."},
      {"id": "d", "text": "The drone result is enough without further verification."}
    ]'::jsonb,
    'c', 30, 9
  );

  RAISE NOTICE 'Drones for Crime Scene Mapping quiz created successfully! Quiz ID: %', v_quiz_id;
END $$;

-- Verify the insert
SELECT q.title, count(qs.id) as question_count
FROM public.quizzes q
JOIN public.questions qs ON qs.quiz_id = q.id
WHERE q.title = 'Using Drones for Crime Scene Mapping'
GROUP BY q.title;
