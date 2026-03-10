import { NextRequest, NextResponse } from 'next/server'
import { speechToText } from '@/lib/sarvam'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    if (!audioFile) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })

    const arrayBuffer = await audioFile.arrayBuffer()
    const result = await speechToText(arrayBuffer, audioFile.type || 'audio/webm')
    return NextResponse.json(result)
  } catch (err) {
    console.error('STT error:', err)
    return NextResponse.json({ error: 'Speech-to-text failed', details: String(err) }, { status: 500 })
  }
}