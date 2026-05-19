import { redirect } from 'next/navigation'

export default function AdminOrganizersPage() {
  redirect('/admin/seededchurches?type=organizer')
}
