import Link from 'next/link'
import { ArrowRight, Heart, Globe, Users, Zap, Shield, MapPin } from 'lucide-react'

export const metadata = {
  title: 'About Us',
  description: 'Learn about Gospello — Nigeria\'s home for Christian events and churches.',
}

const VALUES = [
  {
    icon: Heart,
    title: 'Faith-First',
    description: 'Everything we build is rooted in serving the body of Christ — helping believers connect, gather, and grow together.',
    color: 'bg-rose-50 text-rose-500',
  },
  {
    icon: Globe,
    title: 'Accessible to All',
    description: 'From Lagos to Maiduguri, every church and believer across all 36 Nigerian states deserves to be seen and heard.',
    color: 'bg-indigo-50 text-indigo-500',
  },
  {
    icon: Zap,
    title: 'Built for Mobile',
    description: 'Nigerians live on their phones. Gospello is designed mobile-first so discovering events is fast, simple and joyful.',
    color: 'bg-amber-50 text-amber-500',
  },
  {
    icon: Shield,
    title: 'Trusted Platform',
    description: 'Every event goes through our moderation queue before going live — so you always find quality, verified gatherings.',
    color: 'bg-emerald-50 text-emerald-500',
  },
]

const STATS = [
  { value: '36', label: 'Nigerian States', sub: 'Coverage' },
  { value: '100%', label: 'Free to Use', sub: 'For attendees' },
  { value: '2025', label: 'Founded', sub: 'Est. Nigeria' },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-purple-700/15 rounded-full blur-[80px]" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-xs font-medium px-3 py-1.5 rounded-full mb-6 text-slate-400">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6">
            <span className="text-white">Built for the </span>
            <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">
              Body of Christ
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Gospello is Nigeria&apos;s central platform for discovering Christian events and churches — helping believers find what God is doing around them, one event at a time.
          </p>
        </div>
      </section>

      {/* ── MISSION STATEMENT ───────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 sm:p-12 shadow-sm text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-4">Our Mission</p>
          <blockquote className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight max-w-2xl mx-auto">
            &ldquo;To connect every believer in Nigeria with the gospel events and churches that will transform their faith.&rdquo;
          </blockquote>
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-black text-indigo-600">{stat.value}</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{stat.label}</p>
                <p className="text-xs text-gray-400">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR STORY ───────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">Our Story</p>
            <h2 className="text-3xl font-black text-gray-900 mb-5 leading-tight">
              Born out of a simple question
            </h2>
            <div className="space-y-4 text-gray-600 leading-relaxed text-sm sm:text-base">
              <p>
                &ldquo;Where are the gospel events happening near me?&rdquo; — that question had no great answer for Nigerian believers. Event posters floated across WhatsApp groups. Church programs were hidden in bulletins. Great gatherings went unattended simply because no one knew.
              </p>
              <p>
                Gospello was built to change that. A single, trusted platform where churches post their events, organizers reach their audience, and every believer can discover what God is doing in their city — for free.
              </p>
              <p>
                We launched in 2025 with a vision to reach every state in Nigeria and beyond, powered by the belief that the gospel deserves the best technology.
              </p>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-300 flex-shrink-0" />
                  <p className="font-semibold">Lagos, Nigeria — and growing</p>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-amber-300 flex-shrink-0" />
                  <p className="font-semibold">Serving churches, organizers & believers</p>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-amber-300 flex-shrink-0" />
                  <p className="font-semibold">All 36 Nigerian states</p>
                </div>
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-amber-300 flex-shrink-0" />
                  <p className="font-semibold">100% free for attendees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ──────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3">What We Stand For</p>
            <h2 className="text-3xl font-black text-gray-900">Our Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map((value) => (
              <div key={value.title} className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all">
                <div className={`w-10 h-10 rounded-xl ${value.color} flex items-center justify-center flex-shrink-0`}>
                  <value.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{value.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="relative bg-slate-950 py-16 sm:py-20 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Ready to{' '}
            <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">
              get involved?
            </span>
          </h2>
          <p className="text-slate-400 mb-8">
            Discover events happening near you, or post your own for thousands of believers to find.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold px-7 py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
            >
              Explore Events <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/12 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors border border-white/10"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
