import { pool, testConnection } from '../config/db';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function main(): Promise<void> {
  try {
    await testConnection();
    console.log('MySQL connection successful');
  } catch (err) {
    console.error('MySQL connection failed:', getErrorMessage(err));
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
