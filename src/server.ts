import app from './app';
import { testConnection } from './config/db';

const port = Number(process.env.PORT || 3000);

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function start(): Promise<void> {
  try {
    await testConnection();
    console.log('MySQL connection ready');
  } catch (err) {
    console.error('Unable to connect to MySQL:', getErrorMessage(err));
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

start();
