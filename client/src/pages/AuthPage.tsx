import { useEffect } from 'react';
import { LoaderCircle, LogIn, UserPlus } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import type { AuthPayload } from '../api/types';
import { useAuth } from '../lib/auth';
import {
  useLoginMutation,
  useRegisterMutation,
} from '../mutations/auth.mutations';

type AuthMode = 'login' | 'register';

interface AuthPageProps {
  mode: AuthMode;
}

interface AuthFormValues {
  firstName: string;
  email: string;
  password: string;
}

interface AuthLocationState {
  notice?: string;
  email?: string;
}

function tabClass(active: boolean): string {
  return [
    'inline-flex min-h-11 flex-1 items-center justify-center rounded-md text-sm font-black transition',
    active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800',
  ].join(' ');
}

export function AuthPage({ mode }: AuthPageProps) {
  const { session, storeSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as AuthLocationState | null;
  const {
    formState: { errors },
    handleSubmit,
    register: registerField,
    reset,
  } = useForm<AuthFormValues>({
    defaultValues: {
      firstName: '',
      email: locationState?.email || '',
      password: '',
    },
  });

  const loginMutation = useLoginMutation({
    onSuccess: (nextSession) => {
      storeSession(nextSession);
      navigate('/dashboard', { replace: true });
    },
  });

  const registerMutation = useRegisterMutation({
    onSuccess: (user, values) => {
      navigate('/login', {
        replace: true,
        state: {
          email: values.email,
          notice: `${user.first_name} was registered. Sign in to continue.`,
        },
      });
    },
  });

  useEffect(() => {
    reset({
      firstName: '',
      email: locationState?.email || '',
      password: '',
    });
  }, [locationState?.email, mode, reset]);

  if (session) {
    return <Navigate replace to="/dashboard" />;
  }

  const isLoading = loginMutation.isPending || registerMutation.isPending;
  const mutationError =
    mode === 'login' ? loginMutation.error : registerMutation.error;
  const mutationMessage =
    mutationError instanceof Error ? mutationError.message : '';
  const submitLabel = mode === 'login' ? 'Sign in' : 'Create account';

  function onSubmit(values: AuthFormValues): void {
    const payload: AuthPayload = {
      email: values.email.trim(),
      password: values.password,
    };

    if (mode === 'register') {
      payload.firstName = values.firstName.trim();
      registerMutation.mutate(payload);
      return;
    }

    loginMutation.mutate(payload);
  }

  return (
    <section className="grid min-h-[calc(100vh-13rem)] items-center gap-6 lg:grid-cols-[0.85fr_1fr]">
      <div className="panel overflow-hidden bg-slate-950 text-white">
        <div className="grid min-h-[440px] content-between gap-8 p-8 sm:p-10">
          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-normal text-teal-300">
              Registration API
            </p>
            <h1 className="max-w-lg text-4xl font-black leading-none tracking-normal sm:text-5xl">
              Account Access
            </h1>
          </div>

          <div className="grid gap-4">
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <div className="mb-5 flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-rose-400" />
                <span className="size-2.5 rounded-full bg-amber-300" />
                <span className="size-2.5 rounded-full bg-emerald-300" />
              </div>
              <div className="flex items-center gap-4">
                <span className="grid size-14 place-items-center rounded-full bg-white text-sm font-black text-slate-950">
                  ID
                </span>
                <div className="grid flex-1 gap-2">
                  <span className="h-3 w-4/5 rounded-full bg-white/70" />
                  <span className="h-3 w-3/5 rounded-full bg-white/40" />
                  <span className="h-3 w-2/3 rounded-full bg-white/30" />
                </div>
              </div>
            </div>

            <p className="mb-0 max-w-md text-sm font-medium leading-6 text-slate-300">
              Secure sign-in and user management for the Express API.
            </p>
          </div>
        </div>
      </div>

      <div className="panel p-5 sm:p-7">
        <div className="mb-6 grid grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1">
          <Link className={tabClass(mode === 'login')} to="/login">
            Login
          </Link>
          <Link className={tabClass(mode === 'register')} to="/register">
            Register
          </Link>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
            {mode === 'login' ? 'Welcome back' : 'New account'}
          </p>
          <h2 className="text-2xl font-black tracking-normal text-slate-950">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          {mode === 'register' ? (
            <label className="form-label">
              <span>First name</span>
              <input
                autoComplete="given-name"
                className="form-input"
                type="text"
                {...registerField('firstName', {
                  required: 'First name is required',
                  setValueAs: (value) => value.trim(),
                })}
              />
              {errors.firstName ? (
                <span className="text-sm font-semibold text-rose-700">
                  {errors.firstName.message}
                </span>
              ) : null}
            </label>
          ) : null}

          <label className="form-label">
            <span>Email</span>
            <input
              autoComplete="email"
              className="form-input"
              type="email"
              {...registerField('email', {
                required: 'Email is required',
                setValueAs: (value) => value.trim(),
              })}
            />
            {errors.email ? (
              <span className="text-sm font-semibold text-rose-700">
                {errors.email.message}
              </span>
            ) : null}
          </label>

          <label className="form-label">
            <span>Password</span>
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="form-input"
              minLength={6}
              type="password"
              {...registerField('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />
            {errors.password ? (
              <span className="text-sm font-semibold text-rose-700">
                {errors.password.message}
              </span>
            ) : null}
          </label>

          {locationState?.notice && mode === 'login' ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              {locationState.notice}
            </div>
          ) : null}

          {mutationMessage ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
              {mutationMessage}
            </div>
          ) : null}

          <button className="primary-button mt-2" disabled={isLoading} type="submit">
            {isLoading ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : mode === 'login' ? (
              <LogIn aria-hidden="true" className="size-4" />
            ) : (
              <UserPlus aria-hidden="true" className="size-4" />
            )}
            {submitLabel}
          </button>
        </form>
      </div>
    </section>
  );
}
