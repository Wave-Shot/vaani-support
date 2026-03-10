import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Session from '@/models/Session'
import {
  chatCompletion, detectLanguage, LANGUAGE_NAMES, DEPARTMENT_ROUTES, Message,
} from '@/lib/sarvam'

function buildSystemPrompt(department: string, language: string): string {
  const langName = LANGUAGE_NAMES[language] ?? 'English'
  const deptContext: Record<string, string> = {
    billing: 'You handle billing inquiries, payment issues, refunds, and invoice questions.',
    technical: 'You handle technical support: connectivity, device issues, service outages.',
    account: 'You handle account management: login issues, password resets, profile updates.',
    sales: 'You handle new subscriptions, plan upgrades, offers, and product information.',
    general: 'You are a general customer support agent.',
  }
  return `You are Vaani, a helpful customer support agent.
${deptContext[department] ?? deptContext.general}
Reply in ${langName}. Be conversational, warm, and concise (1-3 sentences).
Do not use markdown or bullet points. Do not output your reasoning or thinking process.`
}

function classifyDepartment(text: string): string {
  const lower = text.toLowerCase()
  for (const [dept, keywords] of Object.entries(DEPARTMENT_ROUTES)) {
    if (keywords.some((kw) => lower.includes(kw))) return dept
  }
  return 'general'
}

function analyzeSentiment(messages: { role: string; content: string }[]): 'positive' | 'neutral' | 'negative' {
  const userMessages = messages.filter((m) => m.role === 'user').map((m) => m.content.toLowerCase()).join(' ')
  const negativeWords = ['angry', 'frustrated', 'worst', 'terrible', 'bad', 'problem', 'issue', 'गुस्सा', 'परेशान', 'समस्या']
  const positiveWords = ['thank', 'great', 'good', 'excellent', 'resolved', 'helpful', 'धन्यवाद', 'நன்றி']
  const negScore = negativeWords.filter((w) => userMessages.includes(w)).length
  const posScore = positiveWords.filter((w) => userMessages.includes(w)).length
  if (negScore > posScore) return 'negative'
  if (posScore > negScore) return 'positive'
  return 'neutral'
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { sessionId, message } = await req.json()
    if (!sessionId || !message) return NextResponse.json({ error: 'sessionId and message required' }, { status: 400 })

    const session = await Session.findOne({ sessionId })
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

    const detectedLang = await detectLanguage(message)
    if (session.callerLanguage === 'unknown' || !session.callerLanguage) {
      session.callerLanguage = detectedLang
    }

    const newDept = classifyDepartment(message)
    if (session.department === 'general' && newDept !== 'general') {
      session.department = newDept
    }

    session.messages.push({ role: 'user', content: message, language: detectedLang, timestamp: new Date() })

    const history: Message[] = session.messages
      .slice(-10)
      .filter((m: { role: string }) => m.role !== 'system')
      .map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const systemPrompt = buildSystemPrompt(session.department, session.callerLanguage)
    let assistantReply = await chatCompletion(history, systemPrompt)

    // If still empty after stripping think tags, retry with simpler prompt
    if (!assistantReply || assistantReply.trim() === '') {
      console.log('Empty reply, retrying with simpler prompt...')
      assistantReply = await chatCompletion(
        [{ role: 'user', content: message }],
        'You are a helpful support agent. Reply in 1-2 sentences in the same language the user used. Do not use any XML tags.'
      )
    }

    // Final fallback
    if (!assistantReply || assistantReply.trim() === '') {
      assistantReply = 'Hello! How can I help you today?'
    }

    session.messages.push({
      role: 'assistant',
      content: assistantReply,
      language: session.callerLanguage,
      timestamp: new Date(),
    })

    session.sentiment = analyzeSentiment(session.messages)

    const lower = message.toLowerCase()
    const resolveKeywords = ['bye', 'thank you', 'goodbye', 'done', 'resolved', 'धन्यवाद', 'அலவிடை', 'நன்றி']
    if (resolveKeywords.some((kw) => lower.includes(kw))) {
      session.status = 'resolved'
      session.resolvedAt = new Date()
    }

    await session.save()

    return NextResponse.json({
      reply: assistantReply,
      language: session.callerLanguage,
      department: session.department,
      sentiment: session.sentiment,
      status: session.status,
    })
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json({ error: 'Chat failed', details: String(err) }, { status: 500 })
  }
}