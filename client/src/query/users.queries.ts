import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { listUsers, openUserEventsStream } from '../api/users';
import { queryKeys } from './queryKeys';

function getServerEventType(message: string): string | undefined {
  return message
    .split(/\r?\n/)
    .find((line) => line.startsWith('event:'))
    ?.slice('event:'.length)
    .trim();
}

function useUsersEvents(token?: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const activeToken = token;
    const controller = new AbortController();
    const decoder = new TextDecoder();
    let closed = false;
    let retryTimer: number | undefined;

    function retryConnect(): void {
      if (closed || controller.signal.aborted) {
        return;
      }

      retryTimer = window.setTimeout(connect, 3000);
    }

    async function connect(): Promise<void> {
      try {
        const response = await openUserEventsStream(activeToken, controller.signal);

        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('api:unauthorized'));
          return;
        }

        if (!response.ok || !response.body) {
          throw new Error('Unable to connect to user updates');
        }

        const reader = response.body.getReader();
        let buffer = '';

        while (!closed) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          const messages = buffer.split(/\r?\n\r?\n/);
          buffer = messages.pop() || '';

          for (const message of messages) {
            if (getServerEventType(message) === 'users:changed') {
              queryClient.invalidateQueries({
                queryKey: queryKeys.users(activeToken),
              });
            }
          }
        }

        retryConnect();
      } catch (_err) {
        retryConnect();
      }
    }

    connect();

    return () => {
      closed = true;
      controller.abort();

      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [queryClient, token]);
}

export function useUsersQuery(token?: string) {
  useUsersEvents(token);

  return useQuery({
    queryKey: queryKeys.users(token),
    queryFn: () => listUsers(token || ''),
    enabled: Boolean(token),
  });
}
