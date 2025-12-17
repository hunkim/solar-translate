import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-violet-600 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">Page Not Found</h2>
                <p className="text-slate-600 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                >
                    Go back home
                </Link>
            </div>
        </div>
    )
}
