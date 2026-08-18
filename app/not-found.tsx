import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-6xl font-black text-emerald-800">404</h1>
        <h2 className="text-2xl font-bold text-gray-900">Page Not Found</h2>
        <p className="text-gray-600">
          The requested page could not be found. Please check the URL or return to Anand Hardware catalog.
        </p>
        <div>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-sm"
          >
            Return to Home Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
