import express, { type Request, type Response } from 'express';

import { getAuthConfigStatus } from './config/auth';
import { databaseClient, listTables, testConnection } from './config/db';
import errorHandler from './middlewares/error.middleware';
import userRoutes from './routes/user.routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Registration API is running' });
});

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await testConnection();
    res.json({
      status: 'ok',
      database: {
        client: databaseClient,
        connected: true,
      },
      auth: getAuthConfigStatus(),
    });
  } catch (_err) {
    res.status(503).json({
      status: 'error',
      database: {
        client: databaseClient,
        connected: false,
      },
      auth: getAuthConfigStatus(),
    });
  }
});

app.get('/api/health/tables', async (_req: Request, res: Response) => {
  try {
    const tables = await listTables();

    res.json({
      status: 'ok',
      database: {
        client: databaseClient,
        connected: true,
      },
      auth: getAuthConfigStatus(),
      tables,
      checks: {
        usersTablePresent: tables.includes('users'),
      },
    });
  } catch (_err) {
    res.status(503).json({
      status: 'error',
      database: {
        client: databaseClient,
        connected: false,
      },
      auth: getAuthConfigStatus(),
      tables: [],
      checks: {
        usersTablePresent: false,
      },
    });
  }
});

app.use('/api', userRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

export default app;
