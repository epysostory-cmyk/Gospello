import Link from 'next/link'
import HaveAnEventCTA from '@/components/ui/HaveAnEventCTA'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-4">
        <p className="text-7xl font-extrabold text-indigo-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link
          href="/"
          className="bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
      <div className="w-full max-w-md">
        <HaveAnEventCTA />
      </div>
    </div>
  )
}
