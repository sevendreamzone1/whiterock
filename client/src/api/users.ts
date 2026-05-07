import { apiRequest, apiUrl } from './http';
import type { PublicUser, UserPayload } from './types';

export function listUsers(token: string): Promise<PublicUser[]> {
  return apiRequest<PublicUser[]>('/api/users', { token });
}

export function createUser(
  token: string,
  payload: UserPayload,
): Promise<PublicUser> {
  return apiRequest<PublicUser>('/api/users', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateUser(
  token: string,
  userId: number,
  payload: UserPayload,
): Promise<PublicUser> {
  return apiRequest<PublicUser>(`/api/users/${userId}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export function deleteUser(token: string, userId: number): Promise<null> {
  return apiRequest<null>(`/api/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export function openUserEventsStream(
  token: string,
  signal: AbortSignal,
): Promise<Response> {
  return fetch(apiUrl('/api/users/events'), {
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    signal,
  });
}
