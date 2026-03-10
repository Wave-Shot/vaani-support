'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Mic, MicOff, Volume2, ArrowLeft, Phone, PhoneOff, Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  language?: string
  timestamp: string
}

type CallStatus = 'idle' | 'connecting' | 'active' | 'recording' | 'processing' | 'speaking' | 'ended'

const DEPT_COLORS: Record<string, string> = {
  billing:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  technical: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  account:   'bg-purple-500/20 text-purple-300 border-purple-500/30',
  sales:     'bg-green-500/20 text-green-300 border-green-500/30',
  general:   'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

const DEPT_LABELS: Record<string, string> = {
  billing: 'Billing', technical: 'Tech Support',
  account: 'Accounts', sales: 'Sales', general: 'General',
}

const LANGUAGE_NAMES: Record<string, string> = {
  'hi-IN': 'Hindi', 'ta-IN': 'Tamil', 'te-IN': 'Telugu',
  'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'mr-IN': 'Marathi',
  'bn-IN': 'Bengali', 'gu-IN': 'Gujarati', 'pa-IN': 'Punjabi', 'en-IN': 'English',
}

export default function CallPage() {
  const [status, setStatus]         = useState<CallStatus>('idle')
  const [messages, setMessages]     = useState<Message[]>([])
  const [sessionId, setSessionId]   = useState<string | null>(null)
  const [department, setDepartment] = useState('general')
  const [detectedLang, setDetectedLang] = useState('hi-IN')
  const [sentiment, setSentiment]   = useState('neutral')
  const [textInput, setTextInput]   = useState('')
  const [isTyping, setIsTyping]     = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const messagesEndRef   = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const playAudio = useCallback((base64: string) => {
    setStatus('speaking')
    const audio = new Audio(`data:audio/wav;base64,${base64}`)
    audio.onended = () => setStatus('active')
    audio.onerror = () => setStatus('active')
    audio.play().catch(() => setStatus('active'))
  }, [])

  const sendMessage = useCallback(async (content: string, sid?: string) => {
    const id = sid ?? sessionId
    if (!id) return

    if (content !== 'Hello') {
      setMessages((prev) => [...prev, { role: 'user', content, timestamp: new Date().toISOString() }])
    }

    setIsTyping(true)
    setStatus('processing')

    try {
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: id, message: content }),
      })
      const chatData = await chatRes.json()
      if (!chatRes.ok) throw new Error(chatData.error)

      setDetectedLang(chatData.language ?? 'hi-IN')
      setDepartment(chatData.department ?? 'general')
      setSentiment(chatData.sentiment ?? 'neutral')

      setMessages((prev) => [...prev, {
        role: 'assistant', content: chatData.reply,
        language: chatData.language, timestamp: new Date().toISOString(),
      }])

      const ttsRes = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: chatData.reply, language: chatData.language }),
      })
      const ttsData = await ttsRes.json()
      if (ttsData.audio) playAudio(ttsData.audio)
      else setStatus('active')

      if (chatData.status === 'resolved') setTimeout(() => setStatus('ended'), 3000)
    } catch (err) {
      console.error(err)
      setStatus('active')
    } finally {
      setIsTyping(false)
    }
  }, [sessionId, playAudio])

  const startCall = async () => {
    setStatus('connecting')
    try {
      const res = await fetch('/api/sessions', { method: 'POST' })
      const data = await res.json()
      setSessionId(data.sessionId)
      setStatus('active')
      await sendMessage('Hello', data.sessionId)
    } catch {
      setStatus('idle')
      alert('Failed to start call. Check your connection.')
    }
  }

  const endCall = () => {
    setStatus('ended')
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  const startRecording = async () => {
    if (status !== 'active') return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setStatus('processing')
        const formData = new FormData()
        formData.append('audio', blob, 'recording.webm')
        try {
          const sttRes = await fetch('/api/stt', { method: 'POST', body: formData })
          const sttData = await sttRes.json()
          if (sttData.transcript) await sendMessage(sttData.transcript)
          else setStatus('active')
        } catch { setStatus('active') }
      }

      mediaRecorder.start()
      setStatus('recording')
    } catch { alert('Microphone permission denied.') }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
  }

  const handleTextSend = async () => {
    if (!textInput.trim() || status !== 'active') return
    const msg = textInput.trim()
    setTextInput('')
    await sendMessage(msg)
  }

  const sentimentColor = { positive: 'text-green-400', neutral: 'text-slate-400', negative: 'text-red-400' }[sentiment]
  const sentimentEmoji = { positive: '😊', neutral: '😐', negative: '😟' }[sentiment as 'positive' | 'neutral' | 'negative']

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(26,58,255,0.4) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(77,107,255,0.3) 0%, transparent 50%)`,
      }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /><span className="text-sm">Back</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${
            ['active','recording','speaking'].includes(status) ? 'bg-green-400 animate-pulse' :
            status === 'processing' ? 'bg-amber-400 animate-pulse' :
            status === 'ended' ? 'bg-red-400' : 'bg-slate-600'
          }`} />
          <span className="text-sm font-mono text-slate-400">
            {status === 'idle' && 'Ready'}{status === 'connecting' && 'Connecting...'}
            {status === 'active' && 'Live'}{status === 'recording' && 'Recording...'}
            {status === 'processing' && 'Processing...'}{status === 'speaking' && 'Speaking...'}
            {status === 'ended' && 'Call Ended'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sessionId && (
            <>
              <span className={`px-2 py-1 rounded-md text-xs border ${DEPT_COLORS[department]}`}>
                {DEPT_LABELS[department]}
              </span>
              <span className="px-2 py-1 rounded-md text-xs bg-slate-800 text-slate-300 border border-slate-700">
                {LANGUAGE_NAMES[detectedLang] ?? detectedLang}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">

        {/* Idle */}
        {status === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-950 border-2 border-blue-700 flex items-center justify-center mb-8 glow-blue">
              <Phone size={36} className="text-blue-400" />
            </div>
            <h2 className="text-3xl font-bold mb-3">वाणी<span className="text-blue-400"> Support</span></h2>
            <p className="text-slate-400 mb-8 max-w-sm">
              AI-powered IVR in Indian languages. Speak naturally — Vaani detects your language and routes you intelligently.
            </p>
            <button onClick={startCall} className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-semibold text-white transition-all glow-blue-strong text-lg">
              <Phone size={22} />Start Call
            </button>
            <p className="text-slate-600 text-xs mt-6 font-mono">Supports Hindi · Tamil · Telugu · Kannada · Bengali + more</p>
          </div>
        )}

        {/* Connecting */}
        {status === 'connecting' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="flex gap-1 justify-center mb-4">
                {[1,2,3,4,5].map((i) => <div key={i} className="wave-bar" style={{ animationDelay: `${(i-1)*0.1}s` }} />)}
              </div>
              <p className="text-slate-400">Connecting to Vaani...</p>
            </div>
          </div>
        )}

        {/* Active call */}
        {['active','recording','processing','speaking','ended'].includes(status) && (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
              {messages.length === 0 && status !== 'processing' && (
                <div className="text-center text-slate-600 text-sm mt-8">Speak or type to begin...</div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-700 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Volume2 size={12} className="text-blue-400" />
                    </div>
                  )}
                  <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'glass-card text-slate-100 rounded-bl-sm'
                  }`}>
                    {msg.content}
                    <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-600'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start animate-fade-in">
                  <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-700 flex items-center justify-center mr-2 flex-shrink-0">
                    <Volume2 size={12} className="text-blue-400" />
                  </div>
                  <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      {[0,1,2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {status === 'speaking' && (
              <div className="flex items-center justify-center gap-2 py-3 mb-2">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((i) => <div key={i} className="wave-bar" style={{ animationDelay: `${(i-1)*0.1}s` }} />)}
                </div>
                <span className="text-blue-400 text-sm">Vaani is speaking...</span>
              </div>
            )}

            {status === 'ended' && (
              <div className="text-center py-4 mb-4">
                <div className="text-slate-400 text-sm mb-2">Call ended</div>
                <div className={`text-sm ${sentimentColor}`}>Caller sentiment: {sentimentEmoji} {sentiment}</div>
                <Link href="/dashboard" className="text-blue-400 text-sm hover:text-blue-300 transition-colors mt-2 inline-block">
                  View in Dashboard →
                </Link>
              </div>
            )}

            {status !== 'ended' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text" value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTextSend()}
                    placeholder="Type in any language..."
                    disabled={status !== 'active'}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-40"
                  />
                  <button onClick={handleTextSend} disabled={status !== 'active' || !textInput.trim()}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 rounded-xl transition-colors">
                    <Send size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <button
                    onMouseDown={startRecording} onMouseUp={stopRecording}
                    onTouchStart={startRecording} onTouchEnd={stopRecording}
                    disabled={status !== 'active' && status !== 'recording'}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      status === 'recording' ? 'bg-red-500 scale-110 pulse-ring' : 'bg-blue-600 hover:bg-blue-500 disabled:opacity-40'
                    }`}>
                    {status === 'recording' ? <MicOff size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
                  </button>
                  <button onClick={endCall} className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors">
                    <PhoneOff size={20} className="text-white" />
                  </button>
                </div>
                <p className="text-center text-slate-600 text-xs font-mono">Hold mic button to speak · Release to send</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}