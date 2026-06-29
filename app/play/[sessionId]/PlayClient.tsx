'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitAnswer } from '@/app/actions/participant'
import Link from 'next/link'

type SessionStatus = 'waiting' | 'active' | 'question' | 'results' | 'leaderboard' | 'finished'

interface QuestionOption { id: string; text: string }
interface Question {
  id: string
  question_text: string
  options: QuestionOption[]
  correct_answer: string
  time_limit: number
  order_index: number
}

interface Session {
  status: SessionStatus
  current_question_id: string | null
  current_question_index: number
  question_started_at: string | null
}

interface Participant {
  id: string
  display_name: string
  score: number
}

interface AnswerResult {
  isCorrect: boolean
  pointsEarned: number
  chosenOption: string
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const ANSWER_BTN_CLASSES = ['answer-btn-a', 'answer-btn-b', 'answer-btn-c', 'answer-btn-d']
const ANSWER_COLORS_HEX = ['#e85d04', '#2563eb', '#16a34a', '#9333ea']

interface Props {
  sessionId: string
  quizTitle: string
  initialStatus: string
}

export default function PlayClient({ sessionId, quizTitle, initialStatus }: Props) {
  const supabase = createClient()
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [session, setSession] = useState<Session>({
    status: initialStatus as SessionStatus,
    current_question_id: null,
    current_question_index: -1,
    question_started_at: null,
  })
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [leaderboard, setLeaderboard] = useState<Participant[]>([])
  const [myRank, setMyRank] = useState<number | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [countdown, setCountdown] = useState<number>(0)
  const questionStartRef = useRef<string | null>(null)
  const submittingRef = useRef(false)

  // Load participant from sessionStorage on mount
  useEffect(() => {
    const pid = sessionStorage.getItem('participantId')
    const name = sessionStorage.getItem('displayName') ?? ''
    setParticipantId(pid)
    setDisplayName(name)
  }, [])

  // Load full session on mount
  useEffect(() => {
    supabase
      .from('sessions')
      .select('status, current_question_id, current_question_index, question_started_at')
      .eq('id', sessionId)
      .single()
      .then(({ data }) => { if (data) setSession(data as Session) })
  }, [sessionId])

  // Real-time session subscription
  useEffect(() => {
    const channel = supabase
      .channel(`play-${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        const newSession = payload.new as Session
        
        // Reset answer state ONLY when the actual question ID changes, compared against previous React state
        setSession((prevSession) => {
          if (newSession.current_question_id !== prevSession.current_question_id) {
            setAnswerResult(null)
            setHasAnswered(false)
            submittingRef.current = false
            setCountdown(3)
          } else if (newSession.status === 'question' && prevSession.status !== 'question') {
            setCountdown(3)
          }
          return newSession
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId, supabase])

  // Load question when current_question_id changes
  useEffect(() => {
    if (!session.current_question_id) { setCurrentQuestion(null); return }
    
    // 1. Fetch question details
    supabase
      .from('questions')
      .select('*')
      .eq('id', session.current_question_id)
      .single()
      .then(({ data }) => {
        if (data) setCurrentQuestion(data as Question)
      })

    // 2. Load existing answer if the user reloaded the page
    if (participantId) {
      supabase
        .from('answers')
        .select('chosen_option, is_correct, points_earned')
        .eq('session_id', sessionId)
        .eq('question_id', session.current_question_id)
        .eq('participant_id', participantId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setAnswerResult({
              isCorrect: data.is_correct,
              pointsEarned: data.points_earned,
              chosenOption: data.chosen_option
            })
            setHasAnswered(true)
          }
        })
    }

    // 3. Check if countdown should run (if less than 3 seconds have elapsed since started)
    const elapsedMs = session.question_started_at
      ? Date.now() - new Date(session.question_started_at).getTime()
      : 0
    const elapsedSeconds = elapsedMs / 1000

    if (elapsedSeconds < 3 && session.status === 'question') {
      const remainingCountdown = Math.ceil(3 - elapsedSeconds)
      setCountdown(remainingCountdown)
    } else {
      setCountdown(0)
    }

    questionStartRef.current = session.question_started_at
  }, [session.current_question_id, session.question_started_at, participantId, sessionId, supabase, session.status])

  // Handle countdown ticks
  useEffect(() => {
    if (countdown <= 0) return

    const timer = setTimeout(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown])

  // Load leaderboard when entering leaderboard or finished phase
  useEffect(() => {
    if (session.status !== 'leaderboard' && session.status !== 'finished') return
    supabase
      .from('participants')
      .select('id, display_name, score')
      .eq('session_id', sessionId)
      .order('score', { ascending: false })
      .then(({ data }) => {
        if (!data) return
        setLeaderboard(data as Participant[])
        if (participantId) {
          const rank = data.findIndex(p => p.id === participantId)
          setMyRank(rank + 1)
          const me = data.find(p => p.id === participantId)
          if (me) setTotalScore(me.score)
        }
      })
  }, [session.status, participantId, sessionId])

  // Timer
  useEffect(() => {
    if (session.status !== 'question' || !session.question_started_at || !currentQuestion) {
      setTimeLeft(0); return
    }
    const update = () => {
      const elapsed = (Date.now() - new Date(session.question_started_at!).getTime()) / 1000
      const remaining = Math.max(0, currentQuestion.time_limit - elapsed)
      setTimeLeft(remaining)
    }
    update()
    const iv = setInterval(update, 100)
    return () => clearInterval(iv)
  }, [session.status, session.question_started_at, currentQuestion])

  async function handleAnswer(optionId: string) {
    if (hasAnswered || !currentQuestion || !participantId || submittingRef.current) return
    submittingRef.current = true
    setHasAnswered(true)

    const rawTimeTakenMs = session.question_started_at
      ? Date.now() - new Date(session.question_started_at).getTime()
      : currentQuestion.time_limit * 1000
    // Subtract 3s (3000ms) for the countdown, min 0
    const timeTakenMs = Math.max(0, rawTimeTakenMs - 3000)

    const result = await submitAnswer(
      sessionId,
      currentQuestion.id,
      participantId,
      optionId,
      timeTakenMs,
      currentQuestion.time_limit
    )

    if ('error' in result) {
      console.error(result.error)
      return
    }

    setAnswerResult({ isCorrect: result.isCorrect, pointsEarned: result.pointsEarned, chosenOption: optionId })
    if (result.isCorrect) setTotalScore(prev => prev + result.pointsEarned)
  }

  // ---- RENDER ----

  if (!participantId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
          <h2 style={{ marginBottom: 'var(--space-4)' }}>Session expired</h2>
          <p style={{ marginBottom: 'var(--space-6)' }}>Please rejoin the quiz.</p>
          <Link href="/join" className="btn btn-primary">Join Again</Link>
        </div>
      </div>
    )
  }

  // WAITING ROOM
  if (session.status === 'waiting') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <div className="card card-glow animate-bounce-in" style={{ textAlign: 'center', padding: 'var(--space-10)', maxWidth: 480, width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)', animation: 'mesh-float-1 3s ease-in-out infinite' }}>
            🎮
          </div>
          <h2 style={{ marginBottom: 'var(--space-2)' }}>You&apos;re in!</h2>
          <p style={{ marginBottom: 'var(--space-4)', fontSize: '1.1rem' }}>
            Welcome, <strong style={{ color: 'var(--color-primary-light)' }}>{displayName}</strong>!
          </p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            {quizTitle}
          </p>
          <div style={{
            padding: 'var(--space-4)', background: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: 'var(--radius-lg)',
          }}>
            <div className="flex items-center justify-center gap-2" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
              <span className="spinner" style={{ borderColor: 'rgba(124,58,237,0.3)', borderTopColor: 'var(--color-primary-light)' }} />
              <span style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Waiting for the host to start...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // QUESTION PHASE
  if (session.status === 'question' && currentQuestion) {
    if (countdown > 0) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
          <div className="card card-glow animate-bounce-in" style={{ textAlign: 'center', maxWidth: 480, width: '100%', padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
            <span className="question-number" style={{ fontSize: '1rem' }}>
              Question {session.current_question_index + 1}
            </span>
            <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', margin: 0 }}>Get Ready!</h2>
            <div
              key={countdown}
              style={{
                fontSize: '7rem',
                fontWeight: 900,
                fontFamily: 'var(--font-heading)',
                background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent-light))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'countdown-tick 1s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                lineHeight: 1,
              }}
            >
              {countdown}
            </div>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Look at the screen! Choices are appearing...
            </p>
          </div>
        </div>
      )
    }

    const progress = currentQuestion.time_limit > 0 ? timeLeft / currentQuestion.time_limit : 0
    const isUrgent = timeLeft <= 5

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: 'var(--space-4)' }}>
        {/* TIMER BAR */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
            <span className="question-number">Q{session.current_question_index + 1}</span>
            <span style={{
              fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.5rem',
              color: isUrgent ? 'var(--color-danger)' : 'var(--color-text-primary)',
              animation: isUrgent ? 'countdown-tick 1s ease-in-out infinite' : undefined,
              minWidth: 40, textAlign: 'right',
            }}>
              {Math.ceil(timeLeft)}
            </span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div
              className="progress-fill"
              style={{
                width: `${progress * 100}%`,
                background: isUrgent
                  ? 'linear-gradient(90deg, var(--color-danger), var(--color-danger-light))'
                  : timeLeft <= currentQuestion.time_limit * 0.4
                  ? 'linear-gradient(90deg, var(--color-warning), #fbbf24)'
                  : 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
                transition: 'width 0.1s linear, background 0.5s ease',
              }}
            />
          </div>
        </div>

        {/* QUESTION */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-8)' }}>
          <div className="card animate-slide-down" style={{ width: '100%', maxWidth: 800, textAlign: 'center', padding: 'var(--space-8)' }}>
            <p className="question-text">{currentQuestion.question_text}</p>
          </div>

          {/* ANSWER BUTTONS OR FEEDBACK */}
          {!hasAnswered ? (
            <div className="answer-grid" style={{ width: '100%', maxWidth: 800 }}>
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={opt.id}
                  id={`answer-btn-${opt.id}`}
                  className={`answer-btn ${ANSWER_BTN_CLASSES[idx]}`}
                  onClick={() => handleAnswer(opt.id)}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <span className="answer-label">{OPTION_LABELS[idx]}</span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="card card-glow animate-bounce-in" style={{ textAlign: 'center', maxWidth: 500, width: '100%', padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
              {answerResult ? (
                answerResult.isCorrect ? (
                  <>
                    <div style={{ fontSize: '4rem', animation: 'bounce-in 0.6s ease' }}>🎉</div>
                    <h2 style={{ color: 'var(--color-success-light)', fontFamily: 'var(--font-heading)' }}>Correct!</h2>
                    <div>
                      <p className="score-burst-points" style={{ fontSize: '3.5rem' }}>+{answerResult.pointsEarned.toLocaleString()}</p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>points earned for speed</p>
                    </div>
                    <div style={{ width: '100%', height: 1, background: 'var(--color-border)' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      Total Score: <strong style={{ color: 'var(--color-primary-light)' }}>{totalScore.toLocaleString()}</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '4rem' }}>😔</div>
                    <h2 style={{ color: 'var(--color-danger-light)', fontFamily: 'var(--font-heading)' }}>Incorrect</h2>
                    <p style={{ fontSize: '1.1rem', color: 'var(--color-text-secondary)' }}>
                      No points this round. Keep going!
                    </p>
                    <div style={{ width: '100%', height: 1, background: 'var(--color-border)' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      Total Score: <strong style={{ color: 'var(--color-primary-light)' }}>{totalScore.toLocaleString()}</strong>
                    </p>
                  </>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-6)' }}>
                  <span className="spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
                  <h3 style={{ color: 'var(--color-primary-light)', fontFamily: 'var(--font-heading)' }}>Answer Locked In!</h3>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Waiting for results...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // RESULTS PHASE (answer revealed) OR when time runs out on the client
  const isTimeUp = session.status === 'results' || (session.status === 'question' && timeLeft <= 0 && countdown === 0)

  if (isTimeUp && currentQuestion) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <div style={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', alignItems: 'center' }}>
          <div className="card animate-slide-down" style={{ width: '100%', textAlign: 'center', padding: 'var(--space-6)' }}>
            <p className="question-text" style={{ fontSize: '1.1rem' }}>{currentQuestion.question_text}</p>
          </div>

          <div className="answer-grid" style={{ width: '100%' }}>
            {currentQuestion.options.map((opt, idx) => {
              const isCorrect = opt.id === currentQuestion.correct_answer
              const wasMyAnswer = answerResult?.chosenOption === opt.id
              return (
                <div
                  key={opt.id}
                  className={`answer-btn ${ANSWER_BTN_CLASSES[idx]} ${isCorrect ? 'correct' : (!wasMyAnswer ? 'incorrect' : '')}`}
                  style={{ cursor: 'default', opacity: isCorrect ? 1 : 0.5 }}
                >
                  <span className="answer-label">{OPTION_LABELS[idx]}</span>
                  <span>{opt.text}</span>
                  {isCorrect && <span style={{ marginLeft: 'auto' }}>✓</span>}
                </div>
              )
            })}
          </div>

          {answerResult ? (
            <div className="card animate-bounce-in" style={{ textAlign: 'center', width: '100%', padding: 'var(--space-6)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>
                {answerResult.isCorrect ? '🎉' : '😔'}
              </div>
              <h3 style={{ color: answerResult.isCorrect ? 'var(--color-success-light)' : 'var(--color-danger-light)', marginBottom: 'var(--space-1)' }}>
                {answerResult.isCorrect ? 'Correct!' : 'Wrong answer'}
              </h3>
              {answerResult.isCorrect && (
                <p style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 900, color: '#fbbf24' }}>
                  +{answerResult.pointsEarned.toLocaleString()}
                </p>
              )}
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                Total score: <strong style={{ color: 'var(--color-primary-light)' }}>{totalScore.toLocaleString()}</strong>
              </p>
            </div>
          ) : (
            <div className="card animate-pop" style={{ textAlign: 'center', padding: 'var(--space-5)' }}>
              <p style={{ color: 'var(--color-warning)', fontWeight: 600 }}>⏰ Time&apos;s up — you didn&apos;t answer in time</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // LEADERBOARD PHASE
  if (session.status === 'leaderboard') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <div style={{ width: '100%', maxWidth: 500 }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }} className="animate-slide-down">
            <h2>🏆 Leaderboard</h2>
            {myRank && (
              <p style={{ marginTop: 'var(--space-2)' }}>
                You&apos;re <strong style={{ color: 'var(--color-primary-light)', fontSize: '1.1rem' }}>#{myRank}</strong> with{' '}
                <strong style={{ color: '#fbbf24' }}>{totalScore.toLocaleString()}</strong> points
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {leaderboard.slice(0, 10).map((p, i) => (
              <div
                key={p.id}
                className="leaderboard-item"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  border: p.id === participantId ? '1px solid var(--color-primary)' : undefined,
                  background: p.id === participantId ? 'rgba(124,58,237,0.1)' : undefined,
                }}
              >
                <div className={`leaderboard-rank ${i < 3 ? `rank-${i + 1}` : ''}`}>{i + 1}</div>
                <div className="avatar" style={{ background: `hsl(${(p.display_name.charCodeAt(0) * 37) % 360}, 70%, 50%)`, color: 'white', fontSize: '0.75rem' }}>
                  {p.display_name[0].toUpperCase()}
                </div>
                <span className="leaderboard-name">
                  {p.display_name} {p.id === participantId ? '(you)' : ''}
                </span>
                <span className="leaderboard-score">{p.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            <span className="spinner" style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} />
            Next question coming up...
          </p>
        </div>
      </div>
    )
  }

  // FINISHED
  if (session.status === 'finished') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
        <div className="card card-glow animate-bounce-in" style={{ textAlign: 'center', maxWidth: 500, width: '100%', padding: 'var(--space-10)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-5)' }}>
          <div style={{ fontSize: '4rem' }}>🎊</div>
          <h2>Quiz Over!</h2>
          <p style={{ fontSize: '1.1rem' }}>
            Great game, <strong style={{ color: 'var(--color-primary-light)' }}>{displayName}</strong>!
          </p>
          <div style={{ padding: 'var(--space-6)', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 'var(--radius-lg)', width: '100%' }}>
            <p style={{ color: '#fbbf24', fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: '3rem', lineHeight: 1 }}>
              {totalScore.toLocaleString()}
            </p>
            <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>final score</p>
          </div>
          {myRank && (
            <p style={{ fontSize: '1.1rem' }}>
              Final rank: <strong style={{ color: 'var(--color-primary-light)', fontSize: '1.3rem' }}>#{myRank}</strong>
              {myRank === 1 ? ' 🥇' : myRank === 2 ? ' 🥈' : myRank === 3 ? ' 🥉' : ''}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%', marginTop: 'var(--space-4)' }}>
            {leaderboard.slice(0, 5).map((p, i) => (
              <div key={p.id} className="leaderboard-item" style={{ animationDelay: `${i * 0.07}s`, border: p.id === participantId ? '1px solid var(--color-primary)' : undefined }}>
                <div className={`leaderboard-rank ${i < 3 ? `rank-${i + 1}` : ''}`}>{i + 1}</div>
                <span className="leaderboard-name">{p.display_name}</span>
                <span className="leaderboard-score">{p.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <Link href="/join" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>Play Another Quiz →</Link>
        </div>
      </div>
    )
  }

  // LOADING / FALLBACK
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <span className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto' }} />
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--color-text-muted)' }}>Loading...</p>
      </div>
    </div>
  )
}
