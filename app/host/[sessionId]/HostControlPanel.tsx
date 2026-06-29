'use client'

import { useEffect, useState, useCallback, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { advanceSession, startSession, endSession, skipLeaderboardToNextQuestion } from '@/app/actions/session'
import type { Participant, Answer } from '@/lib/types'
import Link from 'next/link'

type SessionStatus = 'waiting' | 'active' | 'question' | 'results' | 'leaderboard' | 'finished'

interface Question {
  id: string
  question_text: string
  options: Array<{ id: string; text: string }>
  correct_answer: string
  time_limit: number
  order_index: number
}

interface Quiz {
  title: string
  questions: Question[]
}

interface Session {
  id: string
  room_code: string
  status: SessionStatus
  current_question_index: number
  current_question_id: string | null
  question_started_at: string | null
  show_final_leaderboard: boolean
}

interface Props {
  initialSession: Session
  quiz: Quiz
  initialParticipants: Participant[]
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const ANSWER_COLORS = ['#e85d04', '#2563eb', '#16a34a', '#9333ea']

export default function HostControlPanel({ initialSession, quiz, initialParticipants }: Props) {
  const supabase = createClient()
  const [session, setSession] = useState<Session>(initialSession)
  const [participants, setParticipants] = useState<Participant[]>(initialParticipants)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isPending, startTransition] = useTransition()

  const currentQuestion = session.current_question_id
    ? quiz.questions.find(q => q.id === session.current_question_id) ?? null
    : null

  const totalQuestions = quiz.questions.length

  // Real-time: session updates
  useEffect(() => {
    const channel = supabase
      .channel(`host-session-${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${session.id}`,
      }, (payload) => {
        setSession(payload.new as Session)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'participants',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        setParticipants(prev => [...prev, payload.new as Participant])
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'participants',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        setParticipants(prev =>
          prev.map(p => p.id === payload.new.id ? payload.new as Participant : p)
        )
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'answers',
        filter: `session_id=eq.${session.id}`,
      }, (payload) => {
        setAnswers(prev => [...prev, payload.new as Answer])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [session.id])

  // Load answers when question changes
  useEffect(() => {
    if (!session.current_question_id) { setAnswers([]); return }
    supabase
      .from('answers')
      .select('*')
      .eq('session_id', session.id)
      .eq('question_id', session.current_question_id)
      .then(({ data }) => setAnswers(data ?? []))
  }, [session.current_question_id])

  // Countdown timer
  useEffect(() => {
    if (session.status !== 'question' || !session.question_started_at || !currentQuestion) {
      setTimeLeft(0)
      return
    }
    let interval: ReturnType<typeof setInterval>
    const update = () => {
      const elapsed = (Date.now() - new Date(session.question_started_at!).getTime()) / 1000
      const remaining = Math.max(0, currentQuestion.time_limit - elapsed)
      setTimeLeft(remaining)
      if (remaining <= 0) clearInterval(interval)
    }
    update()
    interval = setInterval(update, 250)
    return () => clearInterval(interval)
  }, [session.status, session.question_started_at, currentQuestion])

  function handleAdvance() {
    startTransition(async () => {
      if (session.status === 'waiting') {
        await startSession(session.id)
      } else {
        await advanceSession(session.id)
      }
    })
  }

  function handleEnd() {
    startTransition(async () => { await endSession(session.id) })
  }

  function handleSkipLeaderboard() {
    startTransition(async () => {
      await skipLeaderboardToNextQuestion(session.id)
    })
  }

  // Answer distribution
  const answerCounts = currentQuestion?.options.reduce((acc, opt) => {
    acc[opt.id] = answers.filter(a => a.chosen_option === opt.id).length
    return acc
  }, {} as Record<string, number>) ?? {}

  const maxCount = Math.max(1, ...Object.values(answerCounts))
  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score)

  const getButtonLabel = () => {
    if (session.status === 'waiting') return '▶ Start Quiz'
    if (session.status === 'question') return '⏭ Show Results'
    if (session.status === 'results') return '🏆 Show Leaderboard'
    if (session.status === 'leaderboard') {
      const nextIdx = session.current_question_index + 1
      return nextIdx >= totalQuestions ? '🏁 End Game' : '▶ Next Question'
    }
    return '▶ Next'
  }

  if (session.status === 'finished') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <div className="card card-glow animate-bounce-in" style={{ maxWidth: 600, width: '100%', textAlign: 'center', padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
          <div style={{ fontSize: '4rem' }}>🎉</div>
          <h2>Quiz Complete!</h2>
          <p>Final Leaderboard</p>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {sortedParticipants.slice(0, 10).map((p, i) => (
              <div key={p.id} className="leaderboard-item" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={`leaderboard-rank ${i < 3 ? `rank-${i + 1}` : ''}`}>{i + 1}</div>
                <span className="leaderboard-name">{p.display_name}</span>
                <span className="leaderboard-score">{p.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <Link href="/dashboard" className="btn btn-primary">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* NAVBAR */}
      <nav className="navbar">
        <Link href="/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link>
        <span className="logo" style={{ fontSize: '1.1rem' }}>⚡ {quiz.title}</span>
        <div className="flex gap-2 items-center">
          <span className="badge badge-primary">{participants.length} players</span>
          {session.status !== 'waiting' && (
            <button className="btn btn-danger btn-sm" onClick={handleEnd} disabled={isPending}>End</button>
          )}
        </div>
      </nav>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 'var(--space-6)', padding: 'var(--space-6)', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {/* MAIN PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>

          {/* WAITING ROOM */}
          {session.status === 'waiting' && (
            <div className="card card-glow animate-fade-in" style={{ textAlign: 'center', padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
              <p style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Join at quizlive.app • Room Code
              </p>
              <div className="room-code-display animate-pulse-glow">{session.room_code}</div>
              <p style={{ color: 'var(--color-text-secondary)' }}>
                {participants.length === 0 ? 'Waiting for players to join...' : `${participants.length} player${participants.length !== 1 ? 's' : ''} ready!`}
              </p>
              <div className="waiting-room-grid" style={{ maxWidth: 500 }}>
                {participants.map((p, i) => (
                  <div key={p.id} className="participant-chip" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div className="avatar" style={{ background: `hsl(${(p.display_name.charCodeAt(0) * 37) % 360}, 70%, 50%)`, color: 'white' }}>
                      {p.display_name[0].toUpperCase()}
                    </div>
                    {p.display_name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUESTION VIEW */}
          {(session.status === 'question' || session.status === 'results') && currentQuestion && (
            <div className="animate-slide-down">
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
                  <span className="question-number">
                    Q{session.current_question_index + 1} / {totalQuestions}
                  </span>
                  {session.status === 'question' && (
                    <TimerCircle timeLeft={timeLeft} total={currentQuestion.time_limit} />
                  )}
                  {session.status === 'results' && (
                    <span className="badge badge-success">Time&apos;s Up!</span>
                  )}
                </div>
                <p className="question-text" style={{ marginBottom: 'var(--space-6)' }}>
                  {currentQuestion.question_text}
                </p>

                {/* ANSWER DISTRIBUTION — horizontal rows with option text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%', marginTop: 'var(--space-2)' }}>
                  {currentQuestion.options.map((opt, idx) => {
                    const count = answerCounts[opt.id] ?? 0
                    const pct = answers.length > 0 ? (count / answers.length) * 100 : 0
                    const isCorrect = session.status === 'results' && opt.id === currentQuestion.correct_answer
                    return (
                      <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        {/* Letter badge */}
                        <span style={{
                          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                          background: ANSWER_COLORS[idx],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 800, fontSize: '1rem',
                          fontFamily: 'var(--font-heading)',
                          boxShadow: isCorrect ? `0 0 16px ${ANSWER_COLORS[idx]}` : undefined,
                          border: isCorrect ? '2px solid rgba(255,255,255,0.7)' : '2px solid transparent',
                        }}>
                          {OPTION_LABELS[idx]}
                        </span>

                        {/* Option text + bar */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontFamily: 'var(--font-heading)', fontWeight: 600,
                              fontSize: '0.9rem', color: isCorrect ? '#86efac' : 'var(--color-text-primary)',
                              textAlign: 'left',
                            }}>
                              {opt.text} {isCorrect ? '✓' : ''}
                            </span>
                            <span style={{
                              fontFamily: 'var(--font-heading)', fontWeight: 700,
                              fontSize: '0.9rem', color: 'var(--color-text-secondary)',
                              marginLeft: 'var(--space-3)', flexShrink: 0,
                            }}>
                              {count}
                            </span>
                          </div>
                          {/* Fill bar */}
                          <div style={{ height: 10, background: 'rgba(255,255,255,0.07)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${pct}%`,
                              background: ANSWER_COLORS[idx],
                              borderRadius: 'var(--radius-full)',
                              transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                              boxShadow: isCorrect ? `0 0 12px ${ANSWER_COLORS[idx]}88` : undefined,
                            }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {session.status === 'results' && (
                  <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ color: 'var(--color-success-light)', fontWeight: 700 }}>
                      ✓ Correct answer: {OPTION_LABELS[currentQuestion.options.findIndex(o => o.id === currentQuestion.correct_answer)]} — {currentQuestion.options.find(o => o.id === currentQuestion.correct_answer)?.text}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  {answers.length} / {participants.length} answered
                </span>
                <div className="progress-bar" style={{ marginTop: 'var(--space-2)' }}>
                  <div className="progress-fill" style={{ width: `${participants.length > 0 ? (answers.length / participants.length) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
          )}

          {/* LEADERBOARD PHASE */}
          {session.status === 'leaderboard' && (
            <div className="animate-slide-up">
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <h3 style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>🏆 Leaderboard</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {sortedParticipants.slice(0, 10).map((p, i) => (
                    <div key={p.id} className="leaderboard-item" style={{ animationDelay: `${i * 0.08}s` }}>
                      <div className={`leaderboard-rank ${i < 3 ? `rank-${i + 1}` : ''}`}>{i + 1}</div>
                      <span className="leaderboard-name">{p.display_name}</span>
                      <span className="leaderboard-score">{p.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ADVANCE BUTTONS */}
          <div className="flex gap-3" style={{ width: '100%' }}>
            <button
              id="host-advance-btn"
              className="btn btn-primary btn-lg"
              style={{ flex: session.status === 'results' ? 2 : 1, justifyContent: 'center' }}
              onClick={handleAdvance}
              disabled={isPending}
            >
              {isPending ? <><span className="spinner" /> Please wait...</> : getButtonLabel()}
            </button>

            {session.status === 'results' && (
              <button
                id="host-skip-leaderboard-btn"
                className="btn btn-ghost btn-lg"
                style={{ flex: 1, justifyContent: 'center', borderColor: 'var(--color-primary-light)', color: 'var(--color-primary-light)' }}
                onClick={handleSkipLeaderboard}
                disabled={isPending}
              >
                ⏭ Direct Next
              </button>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* ROOM CODE */}
          <div className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Room Code</p>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900, letterSpacing: '0.2em', background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {session.room_code}
            </div>
          </div>

          {/* STATS */}
          <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="stat-card">
              <span className="stat-value">{participants.length}</span>
              <span className="stat-label">Players</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{session.current_question_index + 1}/{totalQuestions}</span>
              <span className="stat-label">Progress</span>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="card">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
              Quiz Progress
            </p>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${session.current_question_index < 0 ? 0 : ((session.current_question_index + 1) / totalQuestions) * 100}%`
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
              <span>Start</span>
              <span>Finish</span>
            </div>
          </div>

          {/* SETTINGS CARD */}
          <div className="card">
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
              Settings
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input
                id="toggle-final-leaderboard"
                type="checkbox"
                checked={session.show_final_leaderboard}
                onChange={async (e) => {
                  const val = e.target.checked
                  // Optimistic update
                  setSession(prev => ({ ...prev, show_final_leaderboard: val }))
                  // DB update
                  await supabase
                    .from('sessions')
                    .update({ show_final_leaderboard: val })
                    .eq('id', session.id)
                }}
                style={{ width: 18, height: 18, accentColor: 'var(--color-primary-light)', cursor: 'pointer' }}
              />
              <label htmlFor="toggle-final-leaderboard" style={{ cursor: 'pointer', fontSize: '0.85rem', textTransform: 'none', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                Show final leaderboard to players
              </label>
            </div>
          </div>

          {/* LIVE PLAYERS */}
          <div className="card" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
              Players
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {sortedParticipants.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2" style={{ fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 20, textAlign: 'right', flexShrink: 0, fontFamily: 'var(--font-heading)', fontWeight: 700 }}>{i + 1}</span>
                  <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.65rem', background: `hsl(${(p.display_name.charCodeAt(0) * 37) % 360}, 70%, 50%)`, color: 'white' }}>
                    {p.display_name[0].toUpperCase()}
                  </div>
                  <span style={{ flex: 1, color: 'var(--color-text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.display_name}</span>
                  <span style={{ color: 'var(--color-primary-light)', fontWeight: 700, fontFamily: 'var(--font-heading)', flexShrink: 0 }}>{p.score.toLocaleString()}</span>
                </div>
              ))}
              {participants.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  Waiting for players...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- TIMER CIRCLE ----
function TimerCircle({ timeLeft, total }: { timeLeft: number; total: number }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const progress = total > 0 ? timeLeft / total : 0
  const dashOffset = circumference * (1 - progress)
  const isUrgent = timeLeft <= 5

  const stroke = isUrgent
    ? 'var(--color-danger)'
    : timeLeft <= total * 0.4
    ? 'var(--color-warning)'
    : 'var(--color-success)'

  return (
    <div className="timer-container">
      <svg className="timer-svg" viewBox="0 0 80 80">
        <circle className="timer-track" cx="40" cy="40" r={radius} />
        <circle
          className="timer-progress"
          cx="40" cy="40" r={radius}
          stroke={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span
        className="timer-number"
        style={{
          color: isUrgent ? 'var(--color-danger)' : 'var(--color-text-primary)',
          animation: isUrgent ? 'countdown-tick 1s ease-in-out infinite' : undefined,
        }}
      >
        {Math.ceil(timeLeft)}
      </span>
    </div>
  )
}
