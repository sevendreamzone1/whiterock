import '../config/env';

import fs from 'node:fs/promises';
import path from 'node:path';

import { createPostgresPool } from '../config/db';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function main(): Promise<void> {
  const schemaPath = path.join(__dirname, '..', '..', 'schema.postgres.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const pool = createPostgresPool();

  try {
    await pool.query(schema);
    console.log(`PostgreSQL schema executed from ${schemaPath}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('PostgreSQL schema run failed:', getErrorMessage(err));
  process.exit(1);
});
