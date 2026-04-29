import '../config/env';

import fs from 'node:fs/promises';
import path from 'node:path';

import mysql from 'mysql2/promise';

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function main(): Promise<void> {
  const schemaPath = path.join(__dirname, '..', '..', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    await connection.query(schema);
    console.log(`Schema executed from ${schemaPath}`);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Schema run failed:', getErrorMessage(err));
  process.exit(1);
});
