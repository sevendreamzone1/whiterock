import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../lib/auth';

export function NotFoundPage() {
  const { session } = useAuth();

  return (
    <section className="grid min-h-[calc(100vh-13rem)] place-items-center">
      <div className="panel w-full max-w-xl p-8 text-center">
        <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
          404
        </p>
        <h1 className="text-3xl font-black tracking-normal text-slate-950">
          Page not found
        </h1>
        <Link
          className="secondary-button mt-6"
          to={session ? '/dashboard' : '/login'}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back
        </Link>
      </div>
    </section>
  );
}
