import {
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../lib/auth';
import { getInitials } from '../lib/format';
import { HealthBadge } from './HealthBadge';

function navClass({ isActive }: { isActive: boolean }): string {
  return [
    'inline-flex min-h-9 items-center rounded-md px-3 text-sm font-bold transition',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-white',
  ].join(' ');
}

function sidebarNavClass({ isActive }: { isActive: boolean }): string {
  return [
    'inline-flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-black transition',
    isActive
      ? 'bg-slate-900 text-white shadow-sm'
      : 'text-slate-600 hover:bg-white hover:text-slate-950',
  ].join(' ');
}

export function AppLayout() {
  const { clearSession, session } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const initials = getInitials(session?.user.firstName || '');

  function handleLogout(): void {
    clearSession();
    queryClient.removeQueries();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#eef4f1] text-slate-900">
      <header className="border-b border-slate-200/80 bg-[#eef4f1]/95">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <NavLink
            className="inline-flex items-center gap-3 rounded-md text-left"
            to={session ? '/dashboard' : '/login'}
          >
            <span className="grid size-10 place-items-center rounded-md bg-slate-900 text-white">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <span className="grid">
              <strong className="text-base font-black leading-tight text-slate-950">
                Registration API
              </strong>
              <span className="text-xs font-semibold text-slate-500">
                User admin
              </span>
            </span>
          </NavLink>

          <nav
            className={`flex flex-wrap items-center gap-2 ${session ? 'md:hidden' : ''}`}
            aria-label="Main"
          >
            {session ? (
              <>
                <NavLink className={navClass} to="/dashboard">
                  Dashboard
                </NavLink>
                <NavLink className={navClass} to="/products">
                  Products
                </NavLink>
                <NavLink className={navClass} to="/shop">
                  Shop
                </NavLink>
              </>
            ) : (
              <>
                <NavLink className={navClass} to="/shop">
                  Shop
                </NavLink>
                <NavLink className={navClass} to="/login">
                  Login
                </NavLink>
                <NavLink className={navClass} to="/register">
                  Register
                </NavLink>
              </>
            )}
          </nav>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <HealthBadge />
            {session ? (
              <>
                <div className="flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 shadow-sm">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-teal-700 text-xs font-black text-white">
                    {initials}
                  </span>
                  <span className="grid min-w-0 leading-tight">
                    <strong className="max-w-40 truncate text-sm font-bold text-slate-800">
                      {session.user.firstName}
                    </strong>
                    <span className="max-w-40 truncate text-xs text-slate-500">
                      {session.user.email}
                    </span>
                  </span>
                </div>
                <button
                  className="secondary-button"
                  title="Log out"
                  type="button"
                  onClick={handleLogout}
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Log out
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {session ? (
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
          <aside className="hidden md:block" aria-label="Sidebar">
            <div className="sticky top-6 grid gap-2">
              <NavLink className={sidebarNavClass} to="/dashboard">
                <LayoutDashboard aria-hidden="true" className="size-4" />
                Users
              </NavLink>
              <NavLink className={sidebarNavClass} to="/products">
                <ShoppingBag aria-hidden="true" className="size-4" />
                Products
              </NavLink>
              <NavLink className={sidebarNavClass} to="/shop">
                <Store aria-hidden="true" className="size-4" />
                Shop
              </NavLink>
            </div>
          </aside>

          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      ) : (
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      )}

      <footer className="border-t border-slate-200 px-4 py-5 text-center text-sm font-medium text-slate-500 sm:px-6">
        <span>Registration API dashboard</span>
      </footer>
    </div>
  );
}
