'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Phone, Users, Clock, Globe, ArrowLeft, TrendingUp, MessageSquare, CheckCircle, AlertCircle, Loader2, PhoneCall } from 'lucide-react'
import type { DashboardStats } from '@/types'

const DEPT_BG: Record<string, string> = {
  billing: '#ffe600', technical: '#3d5afe',
  account: '#e040fb', sales: '#00e676', general: '#0a0a0a',
}
const SENTIMENT_EMOJI: Record<string, string> = { positive: '😊', neutral: '😐', negative: '😟' }
const SENTIMENT_BG: Record<string, string> = { positive: '#00e676', neutral: '#eee', negative: '#ff3b3b' }
const STATUS_BG: Record<string, string> = {
  active: '#00e676', resolved: '#3d5afe', transferred: '#ffe600', abandoned: '#ff3b3b',
}
const LANGUAGE_NAMES: Record<string, string> = {
  'hi-IN': 'Hindi', 'ta-IN': 'Tamil', 'te-IN': 'Telugu',
  'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'mr-IN': 'Marathi',
  'bn-IN': 'Bengali', 'gu-IN': 'Gujarati', 'pa-IN': 'Punjabi',
  'en-IN': 'English', unknown: 'Unknown',
}

function StatCard({ icon: Icon, label, value, bg = '#ffe600' }: {
  icon: React.ElementType; label: string; value: string | number; bg?: string
}) {
  return (
    <div className="nb-card p-5 transition-transform hover:-translate-y-1" style={{ background: bg, boxShadow: '6px 6px 0 #0a0a0a' }}>
      <Icon size={20} color="#0a0a0a" className="mb-3" />
      <div style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: '2.5rem', lineHeight: 1, color: '#0a0a0a' }}>
        {value}
      </div>
      <div className="font-mono text-xs font-bold tracking-wider mt-2 uppercase" style={{ color: '#0a0a0a', opacity: 0.7 }}>
        {label}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats]     = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => { setError('Failed to load. Check MongoDB connection.'); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen hatch-bg" style={{ background: '#fafaf5' }}>

      <header className="flex items-center justify-between px-6 py-5 border-b-[3px] border-black bg-white">
        <div className="flex items-center gap-4">
          <Link href="/" className="nb-btn px-4 py-2 text-sm flex items-center gap-2" style={{ background: 'white', color: '#0a0a0a' }}>
            <ArrowLeft size={14} /> BACK
          </Link>
          <div>
            <h1 style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
              OPERATIONS DASHBOARD
            </h1>
            <p className="font-mono text-xs" style={{ color: '#777' }}>VAANI SUPPORT ANALYTICS</p>
          </div>
        </div>
        <Link href="/call" className="nb-btn-yellow px-5 py-2.5 text-sm flex items-center gap-2">
          <PhoneCall size={14} /> NEW CALL
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {loading && (
          <div className="flex items-center justify-center h-64 gap-3">
            <Loader2 size={28} className="animate-spin" />
            <span className="font-mono font-bold tracking-widest text-sm">LOADING...</span>
          </div>
        )}

        {error && (
          <div className="nb-card p-6 flex items-center gap-3" style={{ background: '#ff3b3b', boxShadow: '6px 6px 0 #0a0a0a' }}>
            <AlertCircle size={20} color="white" />
            <span className="font-bold text-white">{error}</span>
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users}         label="Total Sessions"  value={stats.totalSessions}         bg="#ffe600" />
              <StatCard icon={Phone}         label="Active Now"       value={stats.activeSessions}        bg="#00e676" />
              <StatCard icon={CheckCircle}   label="Resolved Today"  value={stats.resolvedToday}         bg="#ffffff" />
              <StatCard icon={MessageSquare} label="Avg Messages"    value={stats.avgMessagesPerSession}  bg="#0a0a0a" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="nb-card p-6" style={{ background: '#0a0a0a', boxShadow: '6px 6px 0 #ffe600' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={16} color="#ffe600" />
                  <span className="font-mono text-xs font-bold tracking-widest" style={{ color: '#ffe600' }}>TOP LANGUAGE</span>
                </div>
                <div style={{ fontFamily: 'Epilogue, sans-serif', fontWeight: 900, fontSize: '2rem', color: '#ffe600' }}>
                  {LANGUAGE_NAMES[stats.topLanguage] ?? stats.topLanguage}
                </div>
                <div className="font-mono text-xs mt-1" style={{ color: '#555' }}>{stats.topLanguage}</div>
              </div>

              <div className="nb-card p-6" style={{ background: '#ffffff', boxShadow: '6px 6px 0 #0a0a0a' }}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={16} />
                  <span className="font-mono text-xs font-bold tracking-widest">BY DEPARTMENT</span>
                </div>
                <div className="space-y-3">
                  {stats.departmentBreakdown.slice(0, 4).map(({ department, count }) => {
                    const max = Math.max(...stats.departmentBreakdown.map(d => d.count))
                    const pct = max > 0 ? (count / max) * 100 : 0
                    return (
                      <div key={department}>
                        <div className="flex justify-between font-mono text-xs mb-1">
                          <span className="font-bold uppercase">{department}</span>
                          <span style={{ color: '#777' }}>{count}</span>
                        </div>
                        <div className="h-3 border-2 border-black" style={{ background: '#eee' }}>
                          <div className="h-full transition-all duration-700 border-r-2 border-black"
                            style={{ width: `${pct}%`, background: DEPT_BG[department] ?? '#ffe600' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="nb-card p-6" style={{ background: '#ffffff', boxShadow: '6px 6px 0 #0a0a0a' }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} />
                  <span className="font-mono text-xs font-bold tracking-widest">SENTIMENT</span>
                </div>
                <div className="space-y-3">
                  {stats.sentimentBreakdown.map(({ sentiment, count }) => {
                    const total = stats.sentimentBreakdown.reduce((a, b) => a + b.count, 0)
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    return (
                      <div key={sentiment} className="flex items-center gap-3">
                        <span className="text-xl">{SENTIMENT_EMOJI[sentiment]}</span>
                        <div className="flex-1 h-3 border-2 border-black" style={{ background: '#eee' }}>
                          <div className="h-full border-r-2 border-black"
                            style={{ width: `${pct}%`, background: SENTIMENT_BG[sentiment] }} />
                        </div>
                        <span className="font-mono text-xs font-bold w-8">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="nb-card overflow-hidden" style={{ boxShadow: '6px 6px 0 #0a0a0a' }}>
              <div className="flex items-center justify-between px-6 py-4 border-b-[3px] border-black" style={{ background: '#0a0a0a' }}>
                <div className="flex items-center gap-2">
                  <Clock size={16} color="#ffe600" />
                  <span className="font-mono text-sm font-bold tracking-widest" style={{ color: '#ffe600' }}>RECENT SESSIONS</span>
                </div>
                <span className="font-mono text-xs" style={{ color: '#555' }}>LAST 10</span>
              </div>

              {stats.recentSessions.length === 0 ? (
                <div className="text-center py-12">
                  <Phone size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="font-mono text-sm">NO SESSIONS YET. <Link href="/call" className="underline font-bold">START A CALL</Link></p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-[3px] border-black" style={{ background: '#f5f5f0' }}>
                        {['Session ID','Language','Department','Messages','Sentiment','Status','Time'].map(h => (
                          <th key={h} className="px-4 py-3 text-left font-mono text-xs font-bold tracking-widest uppercase">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentSessions.map((session, i) => (
                        <tr key={session.sessionId} className="border-b-2 border-black transition-colors hover:bg-yellow-50"
                          style={{ borderColor: i === stats.recentSessions.length - 1 ? 'transparent' : '#0a0a0a' }}>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: '#777' }}>...{session.sessionId.slice(-8)}</td>
                          <td className="px-4 py-3 font-bold text-xs">{LANGUAGE_NAMES[session.callerLanguage] ?? session.callerLanguage}</td>
                          <td className="px-4 py-3">
                            <span className="nb-tag text-xs" style={{ background: DEPT_BG[session.department] ?? '#eee', color: '#0a0a0a' }}>
                              {session.department.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono font-bold">{session.messageCount}</td>
                          <td className="px-4 py-3 text-xl">{SENTIMENT_EMOJI[session.sentiment] ?? '😐'}</td>
                          <td className="px-4 py-3">
                            <span className="nb-tag" style={{ background: STATUS_BG[session.status] ?? '#eee', color: '#0a0a0a' }}>
                              {session.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: '#777' }}>
                            {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}