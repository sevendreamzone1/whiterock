import '../config/env';

import mysql from 'mysql2/promise';

const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'development';

if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
  throw new Error('Database name may only contain letters, numbers, and underscores');
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function main(): Promise<void> {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`Users table ready: ${dbName}.users`);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Database setup failed:', getErrorMessage(err));
  process.exit(1);
});
