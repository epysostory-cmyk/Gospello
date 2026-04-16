import { Mail, MessageSquare, MapPin, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the Gospello team. We\'d love to hear from you.',
}

const CONTACT_ITEMS = [
  {
    icon: Mail,
    title: 'Email Us',
    value: 'hello@gospello.com',
    sub: 'We reply within 24 hours',
    href: 'mailto:hello@gospello.com',
    color: 'bg-indigo-50 text-indigo-500',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp',
    value: 'Chat with us',
    sub: 'Quick responses on WhatsApp',
    href: 'https://wa.me/234XXXXXXXXXX',
    color: 'bg-emerald-50 text-emerald-500',
  },
  {
    icon: MapPin,
    title: 'Based In',
    value: 'Lagos, Nigeria',
    sub: 'Serving all 36 states',
    href: null,
    color: 'bg-rose-50 text-rose-500',
  },
  {
    icon: Clock,
    title: 'Support Hours',
    value: 'Mon – Fri',
    sub: '9am – 6pm WAT',
    href: null,
    color: 'bg-amber-50 text-amber-500',
  },
]

export default function ContactPage() {
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
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            We&apos;d love to hear from you
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-5">
            <span className="text-white">Get in </span>
            <span className="bg-gradient-to-r from-amber-300 to-amber-400 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Questions, feedback, partnership enquiries — our team is ready to help.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Contact form — 3 cols */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 mb-1">Send us a message</h2>
              <p className="text-sm text-gray-500 mb-6">Fill in the form and we&apos;ll get back to you shortly.</p>

              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    Subject
                  </label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer">
                    <option value="">Select a topic...</option>
                    <option value="general">General Enquiry</option>
                    <option value="event">Event Question</option>
                    <option value="church">Church Registration</option>
                    <option value="partnership">Partnership</option>
                    <option value="report">Report an Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                    Message
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tell us how we can help..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-indigo-500/20 text-sm"
                >
                  Send Message <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-xs text-gray-400 text-center">
                  We typically respond within 24 hours on business days.
                </p>
              </form>
            </div>
          </div>

          {/* Contact info — 2 cols */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-1">Other ways to reach us</h2>
              <p className="text-sm text-gray-500 mb-5">Choose whichever works best for you.</p>
            </div>

            {CONTACT_ITEMS.map((item) => (
              <div key={item.title}>
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{item.title}</p>
                      <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{item.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                    <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{item.title}</p>
                      <p className="font-bold text-gray-900">{item.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Partnership box */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                  backgroundSize: '16px 16px',
                }}
              />
              <div className="relative">
                <p className="font-bold text-sm mb-1">Want to partner with us?</p>
                <p className="text-xs text-indigo-200 mb-3">Churches, ministries, and Christian organisations — let&apos;s work together.</p>
                <Link
                  href="mailto:partnerships@gospello.com"
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Mail className="w-3 h-3" /> partnerships@gospello.com
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
