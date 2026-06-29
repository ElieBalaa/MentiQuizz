import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh' }}>
      {/* NAVBAR */}
      <nav className="navbar">
        <span className="logo">⚡ QuizLive</span>
        <div className="flex gap-3">
          <Link href="/join" className="btn btn-ghost btn-sm">Join Quiz</Link>
          <Link href="/auth" className="btn btn-primary btn-sm">Host a Quiz</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: 'calc(100vh - 65px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 'var(--space-16) var(--space-6)',
        gap: 'var(--space-8)',
      }}>
        <div className="animate-slide-down" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-6)' }}>
          <div className="badge badge-primary">
            <span>⚡</span>
            Real-time Interactive Quizzes
          </div>
          <h1 style={{ maxWidth: '800px', letterSpacing: '-0.02em' }}>
            Engage Your Audience with{' '}
            <span className="gradient-text">Live Quizzes</span>
          </h1>
          <p style={{ maxWidth: '560px', fontSize: '1.1rem', lineHeight: 1.7 }}>
            Create and host interactive quizzes with real-time leaderboards,
            instant feedback, and beautiful visualizations. Make every presentation unforgettable.
          </p>
        </div>

        <div className="flex gap-4 animate-slide-up" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/auth" className="btn btn-primary btn-lg">
            🎯 Start Hosting
          </Link>
          <Link href="/join" className="btn btn-ghost btn-lg">
            🎮 Join a Quiz
          </Link>
        </div>

        {/* FEATURES GRID */}
        <div className="grid-2 animate-fade-in" style={{
          maxWidth: '900px',
          width: '100%',
          marginTop: 'var(--space-12)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {[
            { icon: '⚡', title: 'Real-time Sync', desc: 'Questions and answers sync instantly across all devices via WebSockets' },
            { icon: '🏆', title: 'Live Leaderboard', desc: 'Speed-based scoring keeps players engaged and competitive' },
            { icon: '📊', title: 'Live Results', desc: 'See answer distributions update in real-time as players respond' },
            { icon: '🎨', title: 'Beautiful Design', desc: 'A stunning experience for both hosts and participants' },
          ].map((feature) => (
            <div key={feature.title} className="card" style={{ textAlign: 'left', gap: 'var(--space-3)', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '2rem' }}>{feature.icon}</span>
              <h4 style={{ fontFamily: 'var(--font-heading)' }}>{feature.title}</h4>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
