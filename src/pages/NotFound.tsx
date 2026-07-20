import { Link } from 'react-router-dom';
import { Disc, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4">
      <Disc size={80} className="text-electric-red opacity-30" />
      <h1 className="font-display text-6xl font-extrabold text-on-surface">404</h1>
      <p className="font-mono text-sm text-muted-text uppercase tracking-widest">Page Not Found</p>
      <p className="text-muted-text max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 px-6 py-3 bg-electric-red text-white rounded-lg font-bold uppercase tracking-wider red-glow hover:brightness-110 transition-all"
        >
          <Home size={18} /> Go Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-6 py-3 bg-surface-gray border border-border-gray rounded-lg text-muted-text hover:text-on-surface hover:border-electric-red transition-all"
        >
          <ArrowLeft size={18} /> Go Back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
