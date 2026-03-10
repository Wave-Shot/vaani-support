import Link from 'next/link'
import { Mic, BarChart3, Phone, Globe, Zap, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 overflow-hidden">
      <div className="fixed inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(26,58,255,0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(26,58,255,0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-10 pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-64 h-64 bg-blue-400 rounded-full blur-3xl opacity-8 pointer-events-none" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-blue-900/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 glow-blue flex items-center justify-center">
            <Mic size={16} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">
            वाणी<span className="text-blue-400"> Support</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/call" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-all glow-blue">
            Start Call
          </Link>
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950 border border-blue-700 text-blue-300 text-xs font-mono mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Powered by Sarvam AI — sarvam-m + saaras:v3 + bulbul:v3
        </div>

        <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tight mb-6">
          <span className="gradient-text">वाणी</span>
          <br />
          <span className="text-white">Support</span>
        </h1>

        <p className="text-slate-400 text-lg max-w-xl mb-12 leading-relaxed">
          Dialect-aware AI customer support bot. Speak in Hindi, Tamil, Telugu, or any Indian
          language — Vaani understands and responds naturally.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link href="/call" className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-white transition-all glow-blue-strong">
            <Phone size={20} />
            Start Support Call
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-8 py-4 glass-card rounded-xl font-medium text-slate-300 hover:text-white transition-colors">
            <BarChart3 size={20} />
            View Dashboard
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-16">
          {[
            { icon: Globe,  label: '22 Indian Languages' },
            { icon: Zap,    label: 'Auto Language Detection' },
            { icon: Shield, label: 'Smart Dept. Routing' },
            { icon: Mic,    label: 'Voice-First Interface' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 px-4 py-2 glass-card rounded-full text-sm text-slate-300">
              <Icon size={14} className="text-blue-400" />
              {label}
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 text-center py-8 text-slate-600 text-xs font-mono border-t border-slate-800">
        Built with Sarvam AI · Next.js · MongoDB
      </footer>
    </div>
  )
}