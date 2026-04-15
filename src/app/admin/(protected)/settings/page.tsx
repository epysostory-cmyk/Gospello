export const dynamic = 'force-dynamic'

import { Settings, Bell, Shield, Database } from 'lucide-react'

export default async function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1 text-sm">Configure platform settings and preferences</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {/* General Settings */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <Settings className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">General Settings</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Platform Name</label>
              <input
                type="text"
                defaultValue="Gospello"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Support Email</label>
              <input
                type="email"
                defaultValue="support@gospello.com"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium">
              Save Changes
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-white/5 border-white/20" />
              <span className="text-sm text-gray-300">Email on new events submitted</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-white/5 border-white/20" />
              <span className="text-sm text-gray-300">Email on user registrations</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded bg-white/5 border-white/20" />
              <span className="text-sm text-gray-300">Weekly digest summary</span>
            </label>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-semibold text-white">Security</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                defaultValue="30"
                className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium">
              Update Security Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
