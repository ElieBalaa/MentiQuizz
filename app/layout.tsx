import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuizLive — Real-time Interactive Quizzes',
  description: 'Host engaging live quizzes with real-time leaderboards, instant feedback, and beautiful visualizations. The ultimate audience engagement tool.',
  keywords: ['quiz', 'live quiz', 'interactive presentation', 'leaderboard', 'mentimeter'],
  openGraph: {
    title: 'QuizLive — Real-time Interactive Quizzes',
    description: 'Host engaging live quizzes with real-time leaderboards and instant feedback.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-mesh" />
        {children}
      </body>
    </html>
  )
}
