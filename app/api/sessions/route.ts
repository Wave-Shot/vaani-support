import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import connectDB from '@/lib/mongodb'
import Session from '@/models/Session'

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const sessionId = uuidv4()
    const session = await Session.create({ sessionId, status: 'active', messages: [] })
    return NextResponse.json({ sessionId: session.sessionId }, { status: 201 })
  } catch (err) {
    console.error('Session create error:', err)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    const session = await Session.findOne({ sessionId })
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    return NextResponse.json(session)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}