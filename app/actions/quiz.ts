'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Quiz, Question, QuestionOption } from '@/lib/types'

// ---- QUIZ CRUD ----

export async function createQuiz(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const title = formData.get('title') as string
  const description = formData.get('description') as string

  const { data, error } = await supabase
    .from('quizzes')
    .insert({ host_id: user.id, title, description })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  redirect(`/dashboard/quiz/${data.id}`)
}

export async function updateQuiz(id: string, updates: Partial<Pick<Quiz, 'title' | 'description'>>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { error } = await supabase
    .from('quizzes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('host_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/quiz/${id}`)
}

export async function deleteQuiz(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', id)
    .eq('host_id', user.id)

  if (error) throw new Error(error.message)
  revalidatePath('/dashboard')
  redirect('/dashboard')
}

// ---- QUESTION CRUD ----

export async function createQuestion(
  quizId: string,
  data: {
    question_text: string
    options: QuestionOption[]
    correct_answer: string
    time_limit: number
    order_index: number
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { error } = await supabase
    .from('questions')
    .insert({ quiz_id: quizId, ...data })

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/quiz/${quizId}`)
}

export async function updateQuestion(
  questionId: string,
  quizId: string,
  data: {
    question_text: string
    options: QuestionOption[]
    correct_answer: string
    time_limit: number
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { error } = await supabase
    .from('questions')
    .update(data)
    .eq('id', questionId)

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/quiz/${quizId}`)
}

export async function deleteQuestion(questionId: string, quizId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) throw new Error(error.message)
  revalidatePath(`/dashboard/quiz/${quizId}`)
}

export async function reorderQuestions(quizId: string, orderedIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const updates = orderedIds.map((id, index) => ({
    id,
    order_index: index,
  }))

  for (const update of updates) {
    await supabase
      .from('questions')
      .update({ order_index: update.order_index })
      .eq('id', update.id)
  }

  revalidatePath(`/dashboard/quiz/${quizId}`)
}
