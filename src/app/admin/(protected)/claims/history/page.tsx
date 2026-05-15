import { redirect } from 'next/navigation'

export default function ClaimsHistoryRedirect() {
  redirect('/admin/claims?tab=history')
}
