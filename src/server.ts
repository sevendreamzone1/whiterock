import app from './app';
import { databaseClient, testConnection } from './config/db';

const port = Number(process.env.PORT || 3000);
const databaseName = databaseClient === 'postgres' ? 'PostgreSQL' : 'MySQL';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function start(): Promise<void> {
  try {
    await testConnection();
    console.log(`${databaseName} connection ready`);
  } catch (err) {
    console.error(`Unable to connect to ${databaseName}:`, getErrorMessage(err));
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

start();
