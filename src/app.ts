import express, { type Request, type Response } from 'express';

import errorHandler from './middlewares/error.middleware';
import userRoutes from './routes/user.routes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Registration API is running' });
});

app.use('/api', userRoutes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

export default app;
