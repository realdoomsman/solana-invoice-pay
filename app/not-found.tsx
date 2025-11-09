import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-black text-white/20">404</h1>
          <div className="relative -mt-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Page Not Found
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              The payment link or page you're looking for doesn't exist.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/30 transition-all border border-white/30"
          >
            View Dashboard
          </Link>
        </div>

        <div className="mt-12 text-blue-200 text-sm">
          <p>Looking for a payment link? Make sure you have the correct URL.</p>
        </div>
      </div>
    </div>
  )
}
