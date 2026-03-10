import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Session from '@/models/Session'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [totalSessions, activeSessions, resolvedToday, allSessions] = await Promise.all([
      Session.countDocuments(),
      Session.countDocuments({ status: 'active' }),
      Session.countDocuments({ status: 'resolved', resolvedAt: { $gte: today } }),
      Session.find().sort({ createdAt: -1 }).limit(100)
        .select('sessionId callerLanguage department status sentiment messages summary createdAt resolvedAt')
        .lean(),
    ])

    const avgMessages = allSessions.length > 0
      ? Math.round(allSessions.reduce((acc, s) => acc + (s.messages?.length ?? 0), 0) / allSessions.length)
      : 0

    const langCount: Record<string, number> = {}
    allSessions.forEach(s => { const l = s.callerLanguage || 'unknown'; langCount[l] = (langCount[l] ?? 0) + 1 })
    const topLanguage = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'en-IN'

    const deptCount: Record<string, number> = {}
    allSessions.forEach(s => { const d = s.department || 'general'; deptCount[d] = (deptCount[d] ?? 0) + 1 })
    const departmentBreakdown = Object.entries(deptCount).map(([department, count]) => ({ department, count }))

    const sentimentCount: Record<string, number> = { positive: 0, neutral: 0, negative: 0 }
    allSessions.forEach(s => { const sent = s.sentiment || 'neutral'; sentimentCount[sent] = (sentimentCount[sent] ?? 0) + 1 })
    const sentimentBreakdown = Object.entries(sentimentCount).map(([sentiment, count]) => ({ sentiment, count }))

    const recentSessions = allSessions.slice(0, 10).map(s => ({
      sessionId: s.sessionId,
      callerLanguage: s.callerLanguage,
      department: s.department,
      status: s.status,
      sentiment: s.sentiment,
      messageCount: s.messages?.length ?? 0,
      summary: s.summary ?? '',
      createdAt: (s.createdAt as Date)?.toISOString?.() ?? '',
      resolvedAt: (s.resolvedAt as Date)?.toISOString?.() ?? undefined,
    }))

    return NextResponse.json({
      totalSessions, activeSessions, resolvedToday,
      avgMessagesPerSession: avgMessages, topLanguage,
      departmentBreakdown, sentimentBreakdown, recentSessions,
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}