import './env';

interface HttpError extends Error {
  statusCode: number;
}

const jwtSecretEnvKeys = ['JWT_SECRET', 'AUTH_SECRET', 'NEXTAUTH_SECRET'] as const;

function createConfigError(message: string): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = 503;
  return error;
}

function getJwtSecretEntry(): { key: string; value: string } | undefined {
  for (const key of jwtSecretEnvKeys) {
    const value = process.env[key]?.trim();

    if (value) {
      return { key, value };
    }
  }

  return undefined;
}

export function requireJwtSecret(): string {
  const secret = getJwtSecretEntry();

  if (!secret) {
    throw createConfigError(
      'JWT secret is not configured. Set JWT_SECRET in Vercel environment variables and redeploy.',
    );
  }

  return secret.value;
}

export function getAuthConfigStatus(): {
  jwtConfigured: boolean;
  secretSource?: string;
} {
  const secret = getJwtSecretEntry();

  return {
    jwtConfigured: Boolean(secret),
    secretSource: secret?.key,
  };
}
