const SARVAM_BASE = 'https://api.sarvam.ai'

const headers = () => ({
  'api-subscription-key': process.env.SARVAM_API_KEY!,
})

export async function speechToText(audioBlob: ArrayBuffer, mimeType = 'audio/wav'): Promise<{  transcript: string
  language_code: string
}> {
  const formData = new FormData()
  const blob = new Blob([audioBlob], { type: mimeType })
  formData.append('file', blob, 'audio.wav')
  formData.append('model', 'saaras:v3')
  formData.append('mode', 'transcribe')

  const res = await fetch(`${SARVAM_BASE}/speech-to-text`, {
    method: 'POST',
    headers: headers(),
    body: formData,
  })

  if (!res.ok) throw new Error(`STT failed: ${await res.text()}`)
  const data = await res.json()
  return { transcript: data.transcript, language_code: data.language_code ?? 'hi-IN' }
}

export async function textToSpeech(text: string, languageCode: string): Promise<string> {
  const langMap: Record<string, string> = {
    'hi-IN': 'hi-IN', 'ta-IN': 'ta-IN', 'te-IN': 'te-IN',
    'kn-IN': 'kn-IN', 'ml-IN': 'ml-IN', 'mr-IN': 'mr-IN',
    'bn-IN': 'bn-IN', 'gu-IN': 'gu-IN', 'pa-IN': 'pa-IN', 'en-IN': 'en-IN',
  }
  const lang = langMap[languageCode] ?? 'hi-IN'

  const res = await fetch(`${SARVAM_BASE}/text-to-speech`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: lang,
      speaker: 'anushka',
      model: 'bulbul:v3',
      enable_preprocessing: true,
    }),
  })

  if (!res.ok) throw new Error(`TTS failed: ${await res.text()}`)
  const data = await res.json()
  return data.audios[0] as string
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function chatCompletion(messages: Message[], systemPrompt: string): Promise<string> {
  const allMessages: Message[] = [{ role: 'system', content: systemPrompt }, ...messages]

  const res = await fetch(`${SARVAM_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'sarvam-m',
      messages: allMessages,
      max_tokens: 500,
      temperature: 0.7,
    }),
  })

  if (!res.ok) throw new Error(`Chat failed: ${await res.text()}`)
  const data = await res.json()
  const raw = data.choices[0].message.content as string
  console.log('Raw LLM response:', raw.substring(0, 300))

// sarvam-m uses <think> as a prefix tag, not a block - just remove the tag itself
  let clean = raw.replace(/<\/?think>/gi, '').trim()
  console.log('Cleaned response:', clean.substring(0, 300))
  return clean
}

export async function detectLanguage(text: string): Promise<string> {
  const res = await fetch(`${SARVAM_BASE}/text-lid`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text }),
  })
  if (!res.ok) return 'en-IN'
  const data = await res.json()
  return (data.language_code as string) ?? 'en-IN'
}

export const LANGUAGE_NAMES: Record<string, string> = {
  'hi-IN': 'Hindi', 'ta-IN': 'Tamil', 'te-IN': 'Telugu',
  'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'mr-IN': 'Marathi',
  'bn-IN': 'Bengali', 'gu-IN': 'Gujarati', 'pa-IN': 'Punjabi',
  'en-IN': 'English', 'od-IN': 'Odia',
}

export const DEPARTMENT_ROUTES: Record<string, string[]> = {
  billing: ['bill', 'payment', 'invoice', 'charge', 'refund', 'money', 'amount', 'pay',
    'बिल', 'भुगतान', 'चार्ज', 'पैसा', 'ரொக்கம்', 'பணம்'],
  technical: ['technical', 'internet', 'network', 'error', 'not working', 'slow', 'wifi',
    'तकनीकी', 'इंटरनेट', 'नेटवर्क', 'काम नहीं', 'இணையம்', 'நெட்வொர்க்'],
  account: ['account', 'login', 'password', 'profile', 'register', 'signup',
    'खाता', 'लॉगिन', 'पासवर्ड', 'கணக்கு', 'உள்நுழைவு'],
  sales: ['new', 'plan', 'subscribe', 'upgrade', 'offer', 'discount', 'buy',
    'नया', 'प्लान', 'ऑफर', 'புதிய', 'திட்டம்'],
}