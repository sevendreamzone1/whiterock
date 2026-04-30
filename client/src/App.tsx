import { FormEvent, useEffect, useMemo, useState } from 'react';

type AuthMode = 'login' | 'register';
type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

interface LoginResponse {
  token_type: 'Bearer';
  access_token: string;
  expires_in: string;
  user: {
    id: number;
    firstName: string;
    email: string;
  };
}

interface RegisterResponse {
  id: number;
  first_name: string;
  email: string;
  created_at: string;
}

interface HealthResponse {
  status: 'ok' | 'error';
  database: {
    client: string;
    connected: boolean;
  };
}

interface ApiErrorResponse {
  error?: string;
  details?: string;
}

const sessionStorageKey = 'registration_api_session';
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const { error, details } = payload as ApiErrorResponse;
    return details || error || fallback;
  }

  return fallback;
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_err) {
    return { error: text };
  }
}

async function postJson<T>(path: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Request failed'));
  }

  return payload as T;
}

function loadStoredSession(): LoginResponse | null {
  const value = window.localStorage.getItem(sessionStorageKey);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as LoginResponse;
  } catch (_err) {
    window.localStorage.removeItem(sessionStorageKey);
    return null;
  }
}

function App() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<RequestStatus>('idle');
  const [message, setMessage] = useState('');
  const [session, setSession] = useState<LoginResponse | null>(() =>
    loadStoredSession(),
  );
  const [health, setHealth] = useState<HealthResponse | null>(null);

  const submitLabel = useMemo(() => {
    if (status === 'loading') {
      return mode === 'login' ? 'Signing in...' : 'Creating account...';
    }

    return mode === 'login' ? 'Sign in' : 'Create account';
  }, [mode, status]);

  useEffect(() => {
    let active = true;

    fetch(apiUrl('/api/health'))
      .then(async (response) => {
        const payload = (await parseJsonResponse(response)) as HealthResponse;

        if (active) {
          setHealth(payload);
        }
      })
      .catch(() => {
        if (active) {
          setHealth({
            status: 'error',
            database: { client: 'unknown', connected: false },
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function selectMode(nextMode: AuthMode): void {
    setMode(nextMode);
    setStatus('idle');
    setMessage('');
  }

  function clearSession(): void {
    window.localStorage.removeItem(sessionStorageKey);
    setSession(null);
    setStatus('idle');
    setMessage('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      if (mode === 'register') {
        const user = await postJson<RegisterResponse>('/api/register', {
          firstName,
          email,
          password,
        });

        setStatus('success');
        setMessage(`${user.first_name} was registered. Sign in to continue.`);
        setMode('login');
        setFirstName('');
        setPassword('');
        return;
      }

      const login = await postJson<LoginResponse>('/api/login', {
        email,
        password,
      });

      window.localStorage.setItem(sessionStorageKey, JSON.stringify(login));
      setSession(login);
      setStatus('success');
      setMessage(`Signed in as ${login.user.firstName}.`);
      setPassword('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Request failed');
    }
  }

  return (
    <main className="page-shell">
      <section className="auth-layout" aria-labelledby="auth-title">
        <div className="brand-panel">
          <div>
            <p className="eyebrow">Registration API</p>
            <h1 id="auth-title">Account Access</h1>
            <p className="intro">
              Sign in or create a user account backed by your active API
              database.
            </p>
          </div>

          <div className="status-panel" aria-live="polite">
            <span
              className={
                health?.database.connected ? 'status-dot online' : 'status-dot'
              }
            />
            <div>
              <p className="status-title">
                {health?.database.connected ? 'API online' : 'API unavailable'}
              </p>
              <p className="status-copy">
                Database: {health?.database.client || 'checking'}
              </p>
            </div>
          </div>

          <div className="identity-preview" aria-hidden="true">
            <div className="preview-header">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-body">
              <div className="avatar-mark">{session ? 'IN' : 'ID'}</div>
              <div className="preview-lines">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="preview-footer">
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="auth-panel">
          <div className="mode-switch" role="tablist" aria-label="Auth mode">
            <button
              className={mode === 'login' ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => selectMode('login')}
            >
              Login
            </button>
            <button
              className={mode === 'register' ? 'active' : ''}
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => selectMode('register')}
            >
              Register
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label>
                <span>First name</span>
                <input
                  autoComplete="given-name"
                  name="firstName"
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  type="text"
                  value={firstName}
                />
              </label>
            ) : null}

            <label>
              <span>Email</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={6}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            {message ? (
              <div className={`form-message ${status}`} role="status">
                {message}
              </div>
            ) : null}

            <button className="submit-button" disabled={status === 'loading'}>
              {submitLabel}
            </button>
          </form>

          {session ? (
            <section className="session-panel" aria-label="Current session">
              <div>
                <p className="session-label">Signed in</p>
                <h2>{session.user.firstName}</h2>
                <p>{session.user.email}</p>
              </div>
              <div className="token-box">
                <span>Bearer token</span>
                <code>{session.access_token}</code>
              </div>
              <button className="secondary-button" type="button" onClick={clearSession}>
                Log out
              </button>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default App;
