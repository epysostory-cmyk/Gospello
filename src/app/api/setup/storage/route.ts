import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

const BUCKETS = [
  { id: 'event-banners', name: 'event-banners', public: true },
  { id: 'church-assets', name: 'church-assets', public: true },
  { id: 'avatars', name: 'avatars', public: true },
]

export async function POST() {
  try {
    const admin = createAdminClient()
    const results: Record<string, string> = {}

    for (const bucket of BUCKETS) {
      // Check if bucket already exists first
      const { data: existing } = await admin.storage.getBucket(bucket.id)

      if (existing) {
        results[bucket.id] = 'exists'
        continue
      }

      // Create if missing
      const { error } = await admin.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      })

      results[bucket.id] = error ? `error: ${error.message}` : 'created'
    }

    return NextResponse.json({ ok: true, buckets: results })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
