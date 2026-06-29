// Database types matching the Supabase schema

export type SessionStatus = 'waiting' | 'active' | 'question' | 'results' | 'leaderboard' | 'finished'

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Quiz {
  id: string
  host_id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
  questions?: Question[]
}

export interface QuestionOption {
  id: string  // 'a' | 'b' | 'c' | 'd'
  text: string
}

export interface Question {
  id: string
  quiz_id: string
  question_text: string
  options: QuestionOption[]
  correct_answer: string
  time_limit: number
  order_index: number
  created_at: string
}

export interface Session {
  id: string
  quiz_id: string
  host_id: string
  room_code: string
  status: SessionStatus
  current_question_index: number
  current_question_id: string | null
  question_started_at: string | null
  created_at: string
  updated_at: string
  quiz?: Quiz
}

export interface Participant {
  id: string
  session_id: string
  display_name: string
  score: number
  answers_count: number
  correct_count: number
  joined_at: string
  last_seen_at: string
}

export interface Answer {
  id: string
  session_id: string
  question_id: string
  participant_id: string
  chosen_option: string
  is_correct: boolean
  time_taken_ms: number
  points_earned: number
  created_at: string
}
