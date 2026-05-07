import '../config/env';

import fs from 'node:fs/promises';
import path from 'node:path';

import mysql from 'mysql2/promise';

const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'development';

if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
  throw new Error('Database name may only contain letters, numbers, and underscores');
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function main(): Promise<void> {
  const schemaPath = path.join(__dirname, '..', '..', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    await connection.query(schema);
    console.log(`Schema executed from ${schemaPath} into ${dbName}`);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Schema run failed:', getErrorMessage(err));
  process.exit(1);
});
