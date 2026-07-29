import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 text-neutral-800">
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-neutral-600 mb-4">Page not found</p>
      <Link href="/" className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors">
        Back to Home
      </Link>
    </div>
  );
}
