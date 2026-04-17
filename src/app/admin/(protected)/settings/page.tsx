export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Settings, Bell, Shield, Layout, Heart, MessageSquare } from 'lucide-react'
import { saveGeneralSettings, saveNotificationSettings, saveSecuritySettings } from './actions'
import { getSiteSettings } from '@/app/actions/site-settings'
import BrandingSettings from './BrandingSettings'

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const saved = params.saved === '1'
  const siteSettings = await getSiteSettings()

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1 text-sm">Configure platform settings and preferences</p>
      </div>

      {saved && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Settings saved successfully.
        </div>
      )}

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* Branding */}
        <BrandingSettings
          initialLogoUrl={siteSettings.site_logo_url}
          initialFaviconUrl={siteSettings.site_favicon_url}
        />
        {/* General Settings */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">General Settings</h2>
          </div>
          <form action={saveGeneralSettings} className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Platform Name</label>
              <input
                type="text"
                name="platform_name"
                defaultValue="Gospello"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Support Email</label>
              <input
                type="email"
                name="support_email"
                defaultValue="support@gospello.com"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Notification Settings */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          <form action={saveNotificationSettings} className="px-5 py-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="email_new_events" defaultChecked className="w-4 h-4 rounded bg-white/5 border-white/20" />
              <span className="text-sm text-gray-300">Email on new events submitted</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="email_registrations" defaultChecked className="w-4 h-4 rounded bg-white/5 border-white/20" />
              <span className="text-sm text-gray-300">Email on user registrations</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="weekly_digest" className="w-4 h-4 rounded bg-white/5 border-white/20" />
              <span className="text-sm text-gray-300">Weekly digest summary</span>
            </label>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Save Notifications
            </button>
          </form>
        </div>

        {/* Security Settings */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Security</h2>
          </div>
          <form action={saveSecuritySettings} className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                name="session_timeout"
                defaultValue="30"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Update Security Settings
            </button>
          </form>
        </div>

        {/* Hero Section */}
        <Link href="/admin/settings/hero" className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center justify-between hover:bg-white/8 transition-colors group">
          <div className="flex items-center gap-3">
            <Layout className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="font-semibold text-white text-sm">Hero Section</h2>
              <p className="text-xs text-gray-500 mt-0.5">Customize homepage headline, badge, CTAs and search tags</p>
            </div>
          </div>
          <span className="text-gray-500 group-hover:text-gray-300 text-sm transition-colors">Edit →</span>
        </Link>

        {/* About Page */}
        <Link href="/admin/settings/about" className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center justify-between hover:bg-white/8 transition-colors group">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-rose-400" />
            <div>
              <h2 className="font-semibold text-white text-sm">About Page</h2>
              <p className="text-xs text-gray-500 mt-0.5">Customize hero text, mission statement, story paragraphs and CTA</p>
            </div>
          </div>
          <span className="text-gray-500 group-hover:text-gray-300 text-sm transition-colors">Edit →</span>
        </Link>

        {/* Contact Page */}
        <Link href="/admin/settings/contact" className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center justify-between hover:bg-white/8 transition-colors group">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="font-semibold text-white text-sm">Contact Page</h2>
              <p className="text-xs text-gray-500 mt-0.5">Update email, WhatsApp number, location, hours and partnership details</p>
            </div>
          </div>
          <span className="text-gray-500 group-hover:text-gray-300 text-sm transition-colors">Edit →</span>
        </Link>
      </div>
    </div>
  )
}
