import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { query } from '../config/db';

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

const publicUserColumns = 'id, first_name, email, created_at';

async function findAll(): Promise<PublicUser[]> {
  return query<PublicUserRow[]>(
    `SELECT ${publicUserColumns} FROM users ORDER BY id DESC`,
  );
}

async function findById(id: number): Promise<PublicUser | undefined> {
  const rows = await query<PublicUserRow[]>(
    `SELECT ${publicUserColumns} FROM users WHERE id = ?`,
    [id],
  );

  return rows[0];
}

async function findByEmailForAuth(email: string): Promise<AuthUser | undefined> {
  const rows = await query<AuthUserRow[]>(
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
  const result = await query<ResultSetHeader>(
    'INSERT INTO users (first_name, email, password_hash) VALUES (?, ?, ?)',
    [firstName, email, passwordHash],
  );

  return result.insertId;
}

async function remove(id: number): Promise<ResultSetHeader> {
  return query<ResultSetHeader>('DELETE FROM users WHERE id = ?', [id]);
}

export { create, findAll, findByEmailForAuth, findById, remove };
