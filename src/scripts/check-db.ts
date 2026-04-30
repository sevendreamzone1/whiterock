import { closeConnection, databaseClient, testConnection } from '../config/db';

const databaseName = databaseClient === 'postgres' ? 'PostgreSQL' : 'MySQL';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function main(): Promise<void> {
  try {
    await testConnection();
    console.log(`${databaseName} connection successful`);
  } catch (err) {
    console.error(`${databaseName} connection failed:`, getErrorMessage(err));
    process.exitCode = 1;
  } finally {
    await closeConnection();
  }
}

main();
