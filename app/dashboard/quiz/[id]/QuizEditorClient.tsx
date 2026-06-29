'use client'

import { useState, useOptimistic } from 'react'
import type { Quiz, Question, QuestionOption } from '@/lib/types'
import { createQuestion, updateQuestion, deleteQuestion, updateQuiz, deleteQuiz } from '@/app/actions/quiz'
import { useRouter } from 'next/navigation'

const OPTION_IDS = ['a', 'b', 'c', 'd']
const OPTION_LABELS = ['A', 'B', 'C', 'D']
const ANSWER_COLORS = ['var(--color-answer-a)', 'var(--color-answer-b)', 'var(--color-answer-c)', 'var(--color-answer-d)']

const DEFAULT_QUESTION = {
  question_text: '',
  options: OPTION_IDS.map((id, i) => ({ id, text: `Option ${OPTION_LABELS[i]}` })),
  correct_answer: 'a',
  time_limit: 20,
}

interface QuizEditorClientProps {
  quiz: Quiz
  initialQuestions: Question[]
}

export default function QuizEditorClient({ quiz, initialQuestions }: QuizEditorClientProps) {
  const router = useRouter()
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState(false)
  const [quizTitle, setQuizTitle] = useState(quiz.title)

  async function handleSaveTitle() {
    await updateQuiz(quiz.id, { title: quizTitle })
    setEditingTitle(false)
    router.refresh()
  }

  async function handleCreateQuestion(data: typeof DEFAULT_QUESTION) {
    setLoading(true)
    try {
      await createQuestion(quiz.id, { ...data, order_index: questions.length })
      setShowNewForm(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateQuestion(data: typeof DEFAULT_QUESTION) {
    if (!editingQuestion) return
    setLoading(true)
    try {
      await updateQuestion(editingQuestion.id, quiz.id, data)
      setEditingQuestion(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteQuestion(qId: string) {
    setLoading(true)
    try {
      await deleteQuestion(qId, quiz.id)
      setDeleteConfirm(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteQuiz() {
    setLoading(true)
    await deleteQuiz(quiz.id)
  }

  return (
    <div className="animate-fade-in">
      {/* QUIZ HEADER */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          {editingTitle ? (
            <div className="flex gap-2 items-center">
              <input
                className="input"
                value={quizTitle}
                onChange={e => setQuizTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveTitle() }}
                autoFocus
                style={{ fontSize: '1.25rem', fontWeight: 700 }}
              />
              <button className="btn btn-primary btn-sm" onClick={handleSaveTitle}>Save</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingTitle(false)}>Cancel</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 style={{ fontSize: '1.5rem' }}>{quiz.title}</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingTitle(true)}>✏️</button>
            </div>
          )}
          <p style={{ marginTop: 4 }}>{questions.length} question{questions.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm('quiz')} disabled={loading}>
          🗑️ Delete Quiz
        </button>
      </div>

      {/* QUESTIONS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        {questions.length === 0 && !showNewForm && (
          <div className="empty-state" style={{ padding: 'var(--space-12)' }}>
            <div className="empty-state-icon">❓</div>
            <h3>No questions yet</h3>
            <p>Add your first question to get started</p>
          </div>
        )}

        {questions.map((q, i) => (
          <div key={q.id} className="card animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-3)' }}>
              <div className="flex items-center gap-3">
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-hover)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.8rem', fontFamily: 'var(--font-heading)', flexShrink: 0,
                  color: 'var(--color-primary-light)'
                }}>
                  {i + 1}
                </span>
                <span className="badge badge-primary">{q.time_limit}s</span>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditingQuestion(q)}>✏️ Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(q.id)}>🗑️</button>
              </div>
            </div>
            <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
              {q.question_text}
            </p>
            <div className="answer-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {q.options.map((opt, optIdx) => (
                <div key={opt.id} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  background: ANSWER_COLORS[optIdx] + '22',
                  border: `1px solid ${ANSWER_COLORS[optIdx]}44`,
                  fontSize: '0.875rem',
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 4,
                    background: ANSWER_COLORS[optIdx],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0,
                  }}>
                    {OPTION_LABELS[optIdx]}
                  </span>
                  <span style={{ color: q.correct_answer === opt.id ? 'var(--color-success-light)' : 'var(--color-text-secondary)', fontWeight: q.correct_answer === opt.id ? 700 : 400 }}>
                    {opt.text} {q.correct_answer === opt.id ? '✓' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ADD QUESTION BUTTON */}
      {!showNewForm && !editingQuestion && (
        <button
          id="add-question-btn"
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: 'var(--space-4)' }}
          onClick={() => setShowNewForm(true)}
        >
          + Add Question
        </button>
      )}

      {/* NEW QUESTION FORM */}
      {showNewForm && (
        <QuestionForm
          onSave={handleCreateQuestion}
          onCancel={() => setShowNewForm(false)}
          loading={loading}
        />
      )}

      {/* EDIT QUESTION FORM */}
      {editingQuestion && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setEditingQuestion(null) }}>
          <div className="modal" style={{ maxWidth: 680 }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
              <h3>Edit Question</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditingQuestion(null)} style={{ width: 36, height: 36 }}>×</button>
            </div>
            <QuestionForm
              initial={editingQuestion}
              onSave={handleUpdateQuestion}
              onCancel={() => setEditingQuestion(null)}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>⚠️</div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>
              {deleteConfirm === 'quiz' ? 'Delete this quiz?' : 'Delete this question?'}
            </h3>
            <p style={{ marginBottom: 'var(--space-6)' }}>This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                disabled={loading}
                onClick={() => deleteConfirm === 'quiz' ? handleDeleteQuiz() : handleDeleteQuestion(deleteConfirm)}
              >
                {loading ? <span className="spinner" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---- QUESTION FORM ----

interface QuestionFormProps {
  initial?: Question
  onSave: (data: { question_text: string; options: QuestionOption[]; correct_answer: string; time_limit: number }) => Promise<void>
  onCancel: () => void
  loading: boolean
}

function QuestionForm({ initial, onSave, onCancel, loading }: QuestionFormProps) {
  const [questionText, setQuestionText] = useState(initial?.question_text ?? '')
  const [options, setOptions] = useState<QuestionOption[]>(
    initial?.options ?? OPTION_IDS.map((id, i) => ({ id, text: `Option ${OPTION_LABELS[i]}` }))
  )
  const [correctAnswer, setCorrectAnswer] = useState(initial?.correct_answer ?? 'a')
  const [timeLimit, setTimeLimit] = useState(initial?.time_limit ?? 20)

  function updateOption(id: string, text: string) {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, text } : o))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!questionText.trim()) return
    if (options.some(o => !o.text.trim())) return
    await onSave({ question_text: questionText, options, correct_answer: correctAnswer, time_limit: timeLimit })
  }

  return (
    <div className="card animate-slide-up" style={{ border: '1px solid var(--color-primary)', boxShadow: 'var(--shadow-glow-primary)' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="form-group">
          <label htmlFor="question-text">Question *</label>
          <textarea
            id="question-text"
            className="input"
            placeholder="What is the capital of France?"
            value={questionText}
            onChange={e => setQuestionText(e.target.value)}
            required
            rows={2}
            autoFocus
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--space-3)' }}>Answer Options *</label>
          <div className="answer-grid">
            {options.map((opt, idx) => (
              <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                  background: ANSWER_COLORS[idx],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                  border: correctAnswer === opt.id ? '3px solid white' : '3px solid transparent',
                  boxShadow: correctAnswer === opt.id ? '0 0 0 2px ' + ANSWER_COLORS[idx] : 'none',
                  transition: 'all 0.15s',
                }}
                  onClick={() => setCorrectAnswer(opt.id)}
                  title="Click to mark as correct"
                >
                  {OPTION_LABELS[idx]}
                </span>
                <input
                  className="input"
                  placeholder={`Option ${OPTION_LABELS[idx]}`}
                  value={opt.text}
                  onChange={e => updateOption(opt.id, e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                {correctAnswer === opt.id && (
                  <span style={{ color: 'var(--color-success-light)', fontSize: '1.1rem', flexShrink: 0 }}>✓</span>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
            Click a letter to mark it as the correct answer
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="time-limit">Time Limit: {timeLimit}s</label>
          <input
            id="time-limit"
            type="range"
            min={5} max={60} step={5}
            value={timeLimit}
            onChange={e => setTimeLimit(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary-light)' }}
          />
          <div className="flex justify-between" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            <span>5s</span><span>30s</span><span>60s</span>
          </div>
        </div>

        <div className="flex gap-3" style={{ marginTop: 'var(--space-2)' }}>
          <button type="button" className="btn btn-ghost" onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
            {loading ? <span className="spinner" /> : initial ? '💾 Save Changes' : '+ Add Question'}
          </button>
        </div>
      </form>
    </div>
  )
}
