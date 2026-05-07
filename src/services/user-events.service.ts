import type { Response } from 'express';

type UserChangeAction = 'created' | 'updated' | 'deleted' | 'registered';

interface UserChangePayload {
  action: UserChangeAction;
  userId: number | string;
}

interface UserEventsClient {
  heartbeat: NodeJS.Timeout;
  res: Response;
}

const clients = new Set<UserEventsClient>();

function writeEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function removeClient(client: UserEventsClient): void {
  clearInterval(client.heartbeat);
  clients.delete(client);
}

function isClientClosed(res: Response): boolean {
  return res.destroyed || res.writableEnded;
}

export function addUserEventsClient(res: Response): () => void {
  const heartbeat = setInterval(() => {
    if (!isClientClosed(res)) {
      res.write(': keep-alive\n\n');
    }
  }, 25000);
  const client = { heartbeat, res };

  clients.add(client);
  writeEvent(res, 'connected', { ok: true });

  return () => removeClient(client);
}

export function broadcastUsersChanged(payload: UserChangePayload): void {
  const data = {
    ...payload,
    changedAt: new Date().toISOString(),
  };

  for (const client of clients) {
    if (isClientClosed(client.res)) {
      removeClient(client);
      continue;
    }

    writeEvent(client.res, 'users:changed', data);
  }
}
