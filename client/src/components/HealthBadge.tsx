import { Activity } from 'lucide-react';

import { useHealthQuery } from '../query/health.queries';

export function HealthBadge() {
  const { data, isError, isLoading } = useHealthQuery();

  const connected = Boolean(data?.database.connected) && !isError;
  const label = connected ? 'API online' : isLoading ? 'Checking API' : 'API unavailable';

  return (
    <div className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm">
      <span
        className={`grid size-6 place-items-center rounded-full ${
          connected
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-rose-100 text-rose-700'
        }`}
      >
        <Activity aria-hidden="true" className="size-3.5" />
      </span>
      <span className="grid leading-tight">
        <strong className="font-bold text-slate-800">{label}</strong>
        <span className="text-xs text-slate-500">
          Database: {data?.database.client || 'checking'}
        </span>
      </span>
    </div>
  );
}
