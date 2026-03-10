import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  language?: string
  timestamp: Date
}

export interface ISession extends Document {
  sessionId: string
  callerLanguage: string
  department: string
  status: 'active' | 'resolved' | 'transferred' | 'abandoned'
  messages: IMessage[]
  summary: string
  sentiment: 'positive' | 'neutral' | 'negative'
  createdAt: Date
  updatedAt: Date
  resolvedAt?: Date
}

const MessageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  language: { type: String, default: 'hi-IN' },
  timestamp: { type: Date, default: Date.now },
})

const SessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    callerLanguage: { type: String, default: 'unknown' },
    department: {
      type: String,
      enum: ['billing', 'technical', 'account', 'sales', 'general'],
      default: 'general',
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'transferred', 'abandoned'],
      default: 'active',
    },
    messages: [MessageSchema],
    summary: { type: String, default: '' },
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
)

const Session: Model<ISession> =
  (mongoose.models.Session as Model<ISession>) ||
  mongoose.model<ISession>('Session', SessionSchema)

export default Session