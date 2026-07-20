import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-9xl font-black text-slate-800 mb-4 tracking-tighter">404</h1>
      <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
      <p className="text-slate-400 mb-8 max-w-md">
        Oops! The page you are looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
        <Home className="w-4 h-4" /> Back to Dashboard
      </Link>
    </div>
  );
}
