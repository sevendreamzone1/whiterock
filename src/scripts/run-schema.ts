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

async function columnExists(
  connection: mysql.Connection,
  tableName: string,
  columnName: string,
): Promise<boolean> {
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName],
  );

  return rows.length > 0;
}

async function ensureProductSchema(connection: mysql.Connection): Promise<void> {
  if (!(await columnExists(connection, 'products', 'category'))) {
    await connection.query(
      "ALTER TABLE products ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'General' AFTER name",
    );
  }

  if (await columnExists(connection, 'products', 'image_url')) {
    await connection.query('ALTER TABLE products DROP COLUMN image_url');
  }
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
    await ensureProductSchema(connection);
    console.log(`Schema executed from ${schemaPath} into ${dbName}`);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Schema run failed:', getErrorMessage(err));
  process.exit(1);
});
