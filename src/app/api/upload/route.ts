import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'event-banners'
    const folder = (formData.get('folder') as string) || 'event-banners'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate type + size
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' }, { status: 400 })
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 2 MB' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Ensure bucket exists
    const { data: existing } = await admin.storage.getBucket(bucket)
    if (!existing) {
      await admin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 2097152,
        allowedMimeTypes: allowed,
      })
    }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${folder}/${user.id}/${Date.now()}.${ext}`
    const bytes = await file.arrayBuffer()

    const { error: uploadErr } = await admin.storage
      .from(bucket)
      .upload(path, bytes, { contentType: file.type, upsert: true })

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr)
      return NextResponse.json({ error: uploadErr.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('Upload API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
