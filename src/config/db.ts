import './env';

import mysql, {
  type QueryResult as MySqlQueryResult,
  type RowDataPacket,
} from 'mysql2/promise';
import { Pool, type QueryResultRow } from 'pg';

type QueryParam = string | number | boolean | Date | null;
type DatabaseClient = 'mysql' | 'postgres';
type TableRow = { table_name: string };
type PostgresTableRow = TableRow & QueryResultRow;

interface MySqlTableRow extends TableRow, RowDataPacket {}

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

function hasPostgresConfig(): boolean {
  return Boolean(
    process.env.DATABASE_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.PGHOST ||
      process.env.POSTGRES_HOST,
  );
}

function resolveDatabaseClient(): DatabaseClient {
  const configuredClient = normalizeDatabaseClient(process.env.DB_CLIENT);

  if (configuredClient) {
    return configuredClient;
  }

  return process.env.VERCEL === '1' || hasPostgresConfig()
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
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL
  );
}

function getPostgresSslConfig(): false | { rejectUnauthorized: boolean } {
  const sslMode = process.env.PGSSLMODE?.toLowerCase();

  if (process.env.PG_SSL === 'false' || sslMode === 'disable') {
    return false;
  }

  if (
    process.env.PG_SSL === 'true' ||
    ['require', 'verify-ca', 'verify-full', 'no-verify'].includes(
      sslMode || '',
    ) ||
    process.env.VERCEL === '1' ||
    hasPostgresConfig()
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
    host:
      process.env.PGHOST ||
      process.env.PG_HOST ||
      process.env.POSTGRES_HOST ||
      '127.0.0.1',
    port: Number(process.env.PGPORT || process.env.PG_PORT || 5432),
    user:
      process.env.PGUSER ||
      process.env.PG_USER ||
      process.env.POSTGRES_USER ||
      'postgres',
    password:
      process.env.PGPASSWORD ||
      process.env.PG_PASSWORD ||
      process.env.POSTGRES_PASSWORD ||
      '',
    database:
      process.env.PGDATABASE ||
      process.env.PG_DATABASE ||
      process.env.POSTGRES_DATABASE ||
      'development',
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

async function listTables(): Promise<string[]> {
  if (databaseClient === 'postgres') {
    const rows = await queryPostgres<PostgresTableRow>(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    return rows.map((row) => row.table_name);
  }

  const rows = await queryMySql<MySqlTableRow[]>(`
    SELECT TABLE_NAME AS table_name
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
  `);

  return rows.map((row) => row.table_name);
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
  listTables,
  queryMySql,
  queryPostgres,
  testConnection,
};
