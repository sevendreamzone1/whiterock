import './env';

import mysql, { type QueryResult as MySqlQueryResult } from 'mysql2/promise';
import { Pool, type QueryResultRow } from 'pg';

type QueryParam = string | number | boolean | Date | null;
type DatabaseClient = 'mysql' | 'postgres';

function normalizeDatabaseClient(value: string | undefined): DatabaseClient | undefined {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (['postgres', 'postgresql', 'pg', 'neon'].includes(normalized)) {
    return 'postgres';
  }

  if (normalized === 'mysql') {
    return 'mysql';
  }

  throw new Error(`Unsupported DB_CLIENT value: ${value}`);
}

function resolveDatabaseClient(): DatabaseClient {
  const configuredClient = normalizeDatabaseClient(process.env.DB_CLIENT);

  if (configuredClient) {
    return configuredClient;
  }

  return process.env.VERCEL === '1' || process.env.DATABASE_URL
    ? 'postgres'
    : 'mysql';
}

const databaseClient = resolveDatabaseClient();

function createMySqlPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.MYSQL_HOST || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306),
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'development',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
  });
}

function getPostgresConnectionString(): string | undefined {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL;
}

function getPostgresSslConfig(): false | { rejectUnauthorized: boolean } {
  if (process.env.PG_SSL === 'false') {
    return false;
  }

  if (
    process.env.PG_SSL === 'true' ||
    process.env.VERCEL === '1' ||
    getPostgresConnectionString()
  ) {
    return { rejectUnauthorized: false };
  }

  return false;
}

function getPostgresConnectionLimit(): number {
  return Number(
    process.env.PG_CONNECTION_LIMIT || (process.env.VERCEL === '1' ? 1 : 10),
  );
}

function createPostgresPool(): Pool {
  const connectionString = getPostgresConnectionString();
  const baseConfig = {
    max: getPostgresConnectionLimit(),
    ssl: getPostgresSslConfig(),
  };

  if (connectionString) {
    return new Pool({
      ...baseConfig,
      connectionString,
    });
  }

  return new Pool({
    ...baseConfig,
    host: process.env.PG_HOST || '127.0.0.1',
    port: Number(process.env.PG_PORT || 5432),
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || '',
    database: process.env.PG_DATABASE || 'development',
  });
}

const mysqlPool = databaseClient === 'mysql' ? createMySqlPool() : undefined;
const postgresPool =
  databaseClient === 'postgres' ? createPostgresPool() : undefined;

function getMySqlPool(): mysql.Pool {
  if (!mysqlPool) {
    throw new Error('MySQL is not the active database client');
  }

  return mysqlPool;
}

function getPostgresPool(): Pool {
  if (!postgresPool) {
    throw new Error('PostgreSQL is not the active database client');
  }

  return postgresPool;
}

async function queryMySql<T extends MySqlQueryResult>(
  sql: string,
  params: QueryParam[] = [],
): Promise<T> {
  const [rows] = await getMySqlPool().execute<T>(sql, params);
  return rows;
}

async function queryPostgres<T extends QueryResultRow>(
  sql: string,
  params: QueryParam[] = [],
): Promise<T[]> {
  const result = await getPostgresPool().query<T>(sql, params);
  return result.rows;
}

async function executePostgres(
  sql: string,
  params: QueryParam[] = [],
): Promise<{ affectedRows: number }> {
  const result = await getPostgresPool().query(sql, params);
  return { affectedRows: result.rowCount ?? 0 };
}

async function testConnection(): Promise<void> {
  if (databaseClient === 'postgres') {
    await getPostgresPool().query('SELECT 1');
    return;
  }

  const connection = await getMySqlPool().getConnection();

  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

async function closeConnection(): Promise<void> {
  if (postgresPool) {
    await postgresPool.end();
    return;
  }

  if (mysqlPool) {
    await mysqlPool.end();
  }
}

export {
  closeConnection,
  createPostgresPool,
  databaseClient,
  executePostgres,
  queryMySql,
  queryPostgres,
  testConnection,
};
