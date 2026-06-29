'use client'

import { useState } from 'react'
import { createQuiz } from '@/app/actions/quiz'

export default function DashboardClient() {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await createQuiz(formData)
    // redirect handled by server action
  }

  return (
    <>
      <button
        id="create-quiz-btn"
        className="btn btn-primary"
        onClick={() => setShowModal(true)}
      >
        + New Quiz
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="modal">
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-6)' }}>
              <h3>Create New Quiz</h3>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-icon"
                style={{ width: 36, height: 36, fontSize: '1.2rem' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label htmlFor="title">Quiz Title *</label>
                <input
                  id="title"
                  name="title"
                  className="input"
                  placeholder="e.g. World Geography Challenge"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description (optional)</label>
                <textarea
                  id="description"
                  name="description"
                  className="input"
                  placeholder="A short description of your quiz..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3" style={{ marginTop: 'var(--space-2)' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
                  {loading ? <span className="spinner" /> : '🎯 Create Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
