'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BarChart3, Phone, Users, Clock, Globe, ArrowLeft, TrendingUp, MessageSquare, CheckCircle, AlertCircle, Loader2, PhoneCall } from 'lucide-react'
import type { DashboardStats } from '@/types'

const DEPT_COLORS: Record<string, string> = {
  billing: '#f59e0b', technical: '#3b82f6',
  account: '#a855f7', sales: '#22c55e', general: '#64748b',
}
const SENTIMENT_ICONS: Record<string, string> = { positive: '😊', neutral: '😐', negative: '😟' }
const STATUS_STYLES: Record<string, string> = {
  active:      'text-green-400 bg-green-400/10 border-green-400/30',
  resolved:    'text-blue-400 bg-blue-400/10 border-blue-400/30',
  transferred: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  abandoned:   'text-red-400 bg-red-400/10 border-red-400/30',
}
const LANGUAGE_NAMES: Record<string, string> = {
  'hi-IN': 'Hindi', 'ta-IN': 'Tamil', 'te-IN': 'Telugu',
  'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'mr-IN': 'Marathi',
  'bn-IN': 'Bengali', 'gu-IN': 'Gujarati', 'pa-IN': 'Punjabi',
  'en-IN': 'English', unknown: 'Unknown',
}

function StatCard({ icon: Icon, label, value, sub, color = 'text-blue-400' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className={`w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="text-3xl font-black text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-600 mt-1 font-mono">{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats]   = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false) })
      .catch(() => { setError('Failed to load dashboard. Make sure MongoDB is connected.'); setLoading(false) })
  }, [])

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 80% 20%, rgba(26,58,255,0.4) 0%, transparent 50%)`,
      }} />

      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-white transition-colors"><ArrowLeft size={16} /></Link>
          <div>
            <h1 className="font-bold text-xl text-white">Operations Dashboard</h1>
            <p className="text-slate-500 text-xs font-mono mt-0.5">Vaani Support Analytics</p>
          </div>
        </div>
        <Link href="/call" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all glow-blue">
          <PhoneCall size={14} />New Call
        </Link>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 size={32} className="text-blue-400 animate-spin" />
          </div>
        )}
        {error && (
          <div className="glass-card rounded-2xl p-6 border border-red-500/20 text-red-400 flex items-center gap-3">
            <AlertCircle size={20} />{error}
          </div>
        )}
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users}        label="Total Sessions"  value={stats.totalSessions} />
              <StatCard icon={Phone}        label="Active Now"       value={stats.activeSessions} color="text-green-400" />
              <StatCard icon={CheckCircle}  label="Resolved Today"  value={stats.resolvedToday}  color="text-blue-400" />
              <StatCard icon={MessageSquare} label="Avg. Messages"  value={stats.avgMessagesPerSession} sub="per session" color="text-amber-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Globe size={16} className="text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Top Language</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{LANGUAGE_NAMES[stats.topLanguage] ?? stats.topLanguage}</div>
                <div className="text-xs text-slate-500 font-mono">{stats.topLanguage}</div>
              </div>

              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={16} className="text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">By Department</span>
                </div>
                <div className="space-y-2">
                  {stats.departmentBreakdown.slice(0, 4).map(({ department, count }) => {
                    const max = Math.max(...stats.departmentBreakdown.map((d) => d.count))
                    const pct = max > 0 ? (count / max) * 100 : 0
                    return (
                      <div key={department}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400 capitalize">{department}</span>
                          <span className="text-slate-500 font-mono">{count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: DEPT_COLORS[department] ?? '#4d6bff' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Caller Sentiment</span>
                </div>
                <div className="space-y-3">
                  {stats.sentimentBreakdown.map(({ sentiment, count }) => {
                    const total = stats.sentimentBreakdown.reduce((a, b) => a + b.count, 0)
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0
                    const colors: Record<string, string> = { positive: '#22c55e', neutral: '#64748b', negative: '#ef4444' }
                    return (
                      <div key={sentiment} className="flex items-center gap-3">
                        <span className="text-lg">{SENTIMENT_ICONS[sentiment]}</span>
                        <div className="flex-1">
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[sentiment] }} />
                          </div>
                        </div>
                        <span className="text-xs text-slate-500 font-mono w-8 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-400" />
                  <span className="font-medium text-slate-200">Recent Sessions</span>
                </div>
                <span className="text-xs text-slate-600 font-mono">Last 10</span>
              </div>
              {stats.recentSessions.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <Phone size={32} className="mx-auto mb-3 opacity-30" />
                  <p>No sessions yet. <Link href="/call" className="text-blue-400 hover:text-blue-300">Start a call</Link></p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {['Session ID','Language','Department','Messages','Sentiment','Status','Time'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 font-mono uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentSessions.map((session) => (
                        <tr key={session.sessionId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-400">...{session.sessionId.slice(-8)}</td>
                          <td className="px-4 py-3 text-slate-300">{LANGUAGE_NAMES[session.callerLanguage] ?? session.callerLanguage}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-xs capitalize"
                              style={{ backgroundColor: (DEPT_COLORS[session.department] ?? '#4d6bff') + '20', color: DEPT_COLORS[session.department] ?? '#4d6bff' }}>
                              {session.department}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 font-mono">{session.messageCount}</td>
                          <td className="px-4 py-3 text-base">{SENTIMENT_ICONS[session.sentiment] ?? '😐'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded text-xs border ${STATUS_STYLES[session.status] ?? STATUS_STYLES.active}`}>
                              {session.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs font-mono">
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