import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { QueryResultRow } from 'pg';

import {
  databaseClient,
  executePostgres,
  queryMySql,
  queryPostgres,
} from '../config/db';

export interface PublicUser {
  id: number;
  first_name: string;
  email: string;
  created_at: Date;
}

export interface AuthUser {
  id: number;
  first_name: string;
  email: string;
  password_hash: string;
}

interface PublicUserRow extends PublicUser, RowDataPacket {}

interface AuthUserRow extends AuthUser, RowDataPacket {}

interface CreateUserParams {
  firstName: string;
  email: string;
  passwordHash: string;
}

interface UpdateUserParams {
  firstName: string;
  email: string;
  passwordHash?: string;
}

interface MutationResult {
  affectedRows: number;
}

type PostgresPublicUserRow = PublicUser & QueryResultRow;
type PostgresAuthUserRow = AuthUser & QueryResultRow;
type PostgresInsertUserRow = { id: number } & QueryResultRow;

const publicUserColumns = 'id, first_name, email, created_at';

async function findAll(): Promise<PublicUser[]> {
  if (databaseClient === 'postgres') {
    return queryPostgres<PostgresPublicUserRow>(
      `SELECT ${publicUserColumns} FROM users ORDER BY id DESC`,
    );
  }

  return queryMySql<PublicUserRow[]>(
    `SELECT ${publicUserColumns} FROM users ORDER BY id DESC`,
  );
}

async function findById(id: number): Promise<PublicUser | undefined> {
  const rows =
    databaseClient === 'postgres'
      ? await queryPostgres<PostgresPublicUserRow>(
          `SELECT ${publicUserColumns} FROM users WHERE id = $1`,
          [id],
        )
      : await queryMySql<PublicUserRow[]>(
          `SELECT ${publicUserColumns} FROM users WHERE id = ?`,
          [id],
        );

  return rows[0];
}

async function findByEmailForAuth(email: string): Promise<AuthUser | undefined> {
  const rows =
    databaseClient === 'postgres'
      ? await queryPostgres<PostgresAuthUserRow>(
          'SELECT id, first_name, email, password_hash FROM users WHERE email = $1 LIMIT 1',
          [email],
        )
      : await queryMySql<AuthUserRow[]>(
          'SELECT id, first_name, email, password_hash FROM users WHERE email = ? LIMIT 1',
          [email],
        );

  return rows[0];
}

async function create({
  firstName,
  email,
  passwordHash,
}: CreateUserParams): Promise<number> {
  if (databaseClient === 'postgres') {
    const rows = await queryPostgres<PostgresInsertUserRow>(
      'INSERT INTO users (first_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [firstName, email, passwordHash],
    );

    return rows[0].id;
  }

  const result = await queryMySql<ResultSetHeader>(
    'INSERT INTO users (first_name, email, password_hash) VALUES (?, ?, ?)',
    [firstName, email, passwordHash],
  );

  return result.insertId;
}

async function update(
  id: number,
  { firstName, email, passwordHash }: UpdateUserParams,
): Promise<MutationResult> {
  if (databaseClient === 'postgres') {
    if (passwordHash) {
      return executePostgres(
        'UPDATE users SET first_name = $1, email = $2, password_hash = $3 WHERE id = $4',
        [firstName, email, passwordHash, id],
      );
    }

    return executePostgres(
      'UPDATE users SET first_name = $1, email = $2 WHERE id = $3',
      [firstName, email, id],
    );
  }

  const result = passwordHash
    ? await queryMySql<ResultSetHeader>(
        'UPDATE users SET first_name = ?, email = ?, password_hash = ? WHERE id = ?',
        [firstName, email, passwordHash, id],
      )
    : await queryMySql<ResultSetHeader>(
        'UPDATE users SET first_name = ?, email = ? WHERE id = ?',
        [firstName, email, id],
      );

  return { affectedRows: result.affectedRows };
}

async function remove(id: number): Promise<MutationResult> {
  if (databaseClient === 'postgres') {
    return executePostgres('DELETE FROM users WHERE id = $1', [id]);
  }

  const result = await queryMySql<ResultSetHeader>(
    'DELETE FROM users WHERE id = ?',
    [id],
  );

  return { affectedRows: result.affectedRows };
}

export { create, findAll, findByEmailForAuth, findById, remove, update };
