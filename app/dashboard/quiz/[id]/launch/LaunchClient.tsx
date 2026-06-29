'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSession } from '@/app/actions/session'

export default function LaunchClient({ quizId }: { quizId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const router = useRouter()

  function handleLaunch() {
    startTransition(async () => {
      try {
        const sessionId = await createSession(quizId)
        router.push(`/host/${sessionId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to launch')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', width: '100%' }}>
      {error && (
        <p style={{ color: 'var(--color-danger-light)', fontSize: '0.875rem' }}>{error}</p>
      )}
      <button
        id="launch-quiz-btn"
        onClick={handleLaunch}
        disabled={isPending}
        className="btn btn-primary btn-lg"
        style={{ width: '100%', maxWidth: '300px', justifyContent: 'center' }}
      >
        {isPending ? <><span className="spinner" /> Creating session...</> : '🚀 Launch Now'}
      </button>
    </div>
  )
}
