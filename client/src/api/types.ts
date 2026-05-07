export interface LoginResponse {
  token_type: 'Bearer';
  access_token: string;
  expires_in: string;
  user: {
    id: number;
    firstName: string;
    email: string;
  };
}

export interface PublicUser {
  id: number;
  first_name: string;
  email: string;
  created_at: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  database: {
    client: string;
    connected: boolean;
  };
  auth?: {
    jwtConfigured: boolean;
    secretSource?: string;
  };
}

export interface AuthPayload {
  firstName?: string;
  email: string;
  password: string;
}

export interface UserPayload {
  firstName: string;
  email: string;
  password?: string;
}

export interface ApiErrorResponse {
  error?: string;
  details?: string;
}
