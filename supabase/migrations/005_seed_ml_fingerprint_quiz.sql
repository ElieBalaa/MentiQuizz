-- ============================================================
-- SEED: Machine Learning and AI-Assisted Fingerprint Matching Quiz
-- Run this in the Supabase SQL Editor
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
    'Machine Learning and AI-Assisted Fingerprint Matching',
    'Select the best answer for each question.'
  )
  RETURNING id INTO v_quiz_id;

  -- ---- QUESTION 1 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'How does a machine-learning system usually learn to classify forensic evidence?',
    '[
      {"id": "a", "text": "By understanding the evidence in the same way as a human examiner"},
      {"id": "b", "text": "By learning patterns from previously provided examples"},
      {"id": "c", "text": "By following only one fixed rule written by an examiner"},
      {"id": "d", "text": "By randomly selecting the most common answer"}
    ]'::jsonb,
    'b', 20, 0
  );

  -- ---- QUESTION 2 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'A dataset contains toolmark examples labelled “Tool X,” “Tool Y,” and “Unknown.” What type of learning does this represent?',
    '[
      {"id": "a", "text": "Unsupervised learning"},
      {"id": "b", "text": "Reinforcement learning"},
      {"id": "c", "text": "Supervised learning"},
      {"id": "d", "text": "Random learning"}
    ]'::jsonb,
    'c', 20, 1
  );

  -- ---- QUESTION 3 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'An unknown toolmark has some features associated with Tool X and other features associated with Tool Y. The exact combination is not present in the training data. What is the most responsible conclusion?',
    '[
      {"id": "a", "text": "It must have been produced by Tool X"},
      {"id": "b", "text": "It must have been produced by Tool Y"},
      {"id": "c", "text": "The classification should be inconclusive"},
      {"id": "d", "text": "The model should select whichever class has more examples"}
    ]'::jsonb,
    'c', 20, 2
  );

  -- ---- QUESTION 4 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Why is explainability important when AI is used in forensic science?',
    '[
      {"id": "a", "text": "It allows the system to work without any training data"},
      {"id": "b", "text": "It helps the examiner understand why the system produced its result"},
      {"id": "c", "text": "It guarantees that every AI result is correct"},
      {"id": "d", "text": "It removes the need for human review"}
    ]'::jsonb,
    'b', 20, 3
  );

  -- ---- QUESTION 5 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What can happen when a machine-learning model is trained using incomplete, biased, or poor-quality data?',
    '[
      {"id": "a", "text": "Its results may become unreliable or misleading"},
      {"id": "b", "text": "It will automatically repair the data"},
      {"id": "c", "text": "It will always produce an inconclusive result"},
      {"id": "d", "text": "Its predictions will become completely objective"}
    ]'::jsonb,
    'a', 20, 4
  );

  -- ---- QUESTION 6 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What does AFIS stand for?',
    '[
      {"id": "a", "text": "Automated Forensic Imaging Service"},
      {"id": "b", "text": "Artificial Fingerprint Inspection Software"},
      {"id": "c", "text": "Automated Fingerprint Identification System"},
      {"id": "d", "text": "Advanced Friction-ridge Investigation System"}
    ]'::jsonb,
    'c', 20, 5
  );

  -- ---- QUESTION 7 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Which of the following is an example of fingerprint minutiae?',
    '[
      {"id": "a", "text": "The overall size of the finger"},
      {"id": "b", "text": "A ridge ending or bifurcation"},
      {"id": "c", "text": "The colour of the fingerprint powder"},
      {"id": "d", "text": "The surface on which the print was found"}
    ]'::jsonb,
    'b', 20, 6
  );

  -- ---- QUESTION 8 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What does it mean when AFIS returns a fingerprint “candidate”?',
    '[
      {"id": "a", "text": "The system has made a final identification"},
      {"id": "b", "text": "The candidate has already been confirmed by a court"},
      {"id": "c", "text": "The record shows similarity and requires further examination"},
      {"id": "d", "text": "The fingerprint belongs to the first person in the database"}
    ]'::jsonb,
    'c', 20, 7
  );

  -- ---- QUESTION 9 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'Why can fingerprint feature extraction affect the results of an automated search?',
    '[
      {"id": "a", "text": "Incorrect or incomplete feature marking may change the candidates returned"},
      {"id": "b", "text": "AFIS only searches fingerprints that have no minutiae"},
      {"id": "c", "text": "Feature extraction determines the age of the fingerprint"},
      {"id": "d", "text": "Automated feature extraction is always perfect"}
    ]'::jsonb,
    'a', 20, 8
  );

  -- ---- QUESTION 10 ----
  INSERT INTO public.questions (quiz_id, question_text, options, correct_answer, time_limit, order_index)
  VALUES (
    v_quiz_id,
    'What is the most appropriate role of AI in fingerprint examination?',
    '[
      {"id": "a", "text": "To make final identifications without human involvement"},
      {"id": "b", "text": "To assist examiners by identifying and ranking possible matches"},
      {"id": "c", "text": "To replace the fingerprint database"},
      {"id": "d", "text": "To prove that a suspect committed a crime"}
    ]'::jsonb,
    'b', 20, 9
  );

  RAISE NOTICE 'ML and AI-Assisted Fingerprint Matching quiz created successfully! Quiz ID: %', v_quiz_id;
END $$;

-- Verify the insert
SELECT q.title, count(qs.id) as question_count
FROM public.quizzes q
JOIN public.questions qs ON qs.quiz_id = q.id
WHERE q.title = 'Machine Learning and AI-Assisted Fingerprint Matching'
GROUP BY q.title;
