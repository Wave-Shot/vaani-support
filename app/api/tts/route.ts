import { NextRequest, NextResponse } from 'next/server'
import { textToSpeech } from '@/lib/sarvam'

export async function POST(req: NextRequest) {
  try {
    const { text, language } = await req.json()
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 })

    const audioBase64 = await textToSpeech(text, language ?? 'hi-IN')
    return NextResponse.json({ audio: audioBase64 })
  } catch (err) {
    console.error('TTS error:', err)
    return NextResponse.json({ error: 'Text-to-speech failed', details: String(err) }, { status: 500 })
  }
}