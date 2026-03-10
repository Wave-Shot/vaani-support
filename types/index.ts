export interface SessionSummary {
  sessionId: string
  callerLanguage: string
  department: string
  status: string
  sentiment: string
  messageCount: number
  summary: string
  createdAt: string
  resolvedAt?: string
}

export interface DashboardStats {
  totalSessions: number
  activeSessions: number
  resolvedToday: number
  avgMessagesPerSession: number
  topLanguage: string
  departmentBreakdown: { department: string; count: number }[]
  sentimentBreakdown: { sentiment: string; count: number }[]
  recentSessions: SessionSummary[]
}