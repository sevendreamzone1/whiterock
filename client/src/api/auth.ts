import { apiRequest } from './http';
import type { AuthPayload, LoginResponse, PublicUser } from './types';

export function login(payload: AuthPayload): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/login', {
    method: 'POST',
    body: payload,
  });
}

export function register(payload: AuthPayload): Promise<PublicUser> {
  return apiRequest<PublicUser>('/api/register', {
    method: 'POST',
    body: payload,
  });
}
