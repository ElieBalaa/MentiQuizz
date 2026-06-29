'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { joinSession } from '@/app/actions/participant'
import Link from 'next/link'

export default function JoinPage() {
  const [roomCode, setRoomCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!roomCode.trim() || !displayName.trim()) return
    setError('')

    startTransition(async () => {
      const result = await joinSession(roomCode.trim(), displayName.trim())
      if ('error' in result) {
        setError(result.error)
      } else {
        // Store participant ID in session storage
        sessionStorage.setItem('participantId', result.participantId)
        sessionStorage.setItem('displayName', displayName.trim())
        router.push(`/play/${result.sessionId}`)
      }
    })
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
    }}>
      <div className="container-sm">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }} className="animate-slide-down">
          <Link href="/" className="logo" style={{ display: 'inline-block', marginBottom: 'var(--space-6)' }}>
            ⚡ QuizLive
          </Link>
          <h1 style={{ fontSize: '2.2rem', marginBottom: 'var(--space-2)' }}>Join a Quiz</h1>
          <p>Enter the room code shown on screen</p>
        </div>

        <div className="card card-glow animate-slide-up" style={{ padding: 'var(--space-8)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div className="form-group">
              <label htmlFor="room-code" style={{ textAlign: 'center', display: 'block' }}>Room Code</label>
              <input
                id="room-code"
                className="input input-code"
                type="text"
                placeholder="000000"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                pattern="\d{6}"
                required
                autoFocus
                inputMode="numeric"
              />
            </div>

            <div className="form-group">
              <label htmlFor="display-name">Your Name</label>
              <input
                id="display-name"
                className="input input-lg"
                type="text"
                placeholder="How should we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 24))}
                maxLength={24}
                required
              />
            </div>

            {error && (
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-light)',
                fontSize: '0.875rem',
                textAlign: 'center',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-accent btn-lg"
              disabled={isPending || roomCode.length < 6 || !displayName.trim()}
              style={{ justifyContent: 'center', marginTop: 'var(--space-2)' }}
            >
              {isPending ? <><span className="spinner" /> Joining...</> : '🎮 Join Quiz →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: '0.875rem' }}>
          Want to host?{' '}
          <Link href="/auth" style={{ color: 'var(--color-primary-light)' }}>
            Create a quiz →
          </Link>
        </p>
      </div>
    </main>
  )
}
