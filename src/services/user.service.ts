import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { requireJwtSecret } from '../config/auth';
import * as userModel from '../models/user.model';
import type { AuthUser, PublicUser } from '../models/user.model';

interface HttpError extends Error {
  statusCode: number;
}

interface DatabaseError extends Error {
  code?: string;
}

interface UserPayload {
  firstName?: string;
  first_name?: string;
  email?: string;
  password?: string;
}

interface RegisterUserPayload {
  firstName: string;
  email: string;
  password: string;
}

interface UpdateUserPayload {
  firstName: string;
  email: string;
  password?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  token_type: 'Bearer';
  access_token: string;
  expires_in: string;
  user: {
    id: number;
    firstName: string;
    email: string;
  };
}

function createError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function isDuplicateEmailError(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }

  const code = (err as DatabaseError).code;
  return code === 'ER_DUP_ENTRY' || code === '23505';
}

function getPayloadValue(body: unknown, key: keyof UserPayload): string | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

function validateRegistrationPayload(body: unknown = {}): RegisterUserPayload {
  const firstName =
    getPayloadValue(body, 'firstName')?.trim() ||
    getPayloadValue(body, 'first_name')?.trim();
  const email = getPayloadValue(body, 'email')?.trim();
  const password = getPayloadValue(body, 'password')?.trim();

  if (!firstName || !email || !password) {
    throw createError('First name, email, and password are required', 400);
  }

  if (!email.includes('@')) {
    throw createError('Email must be valid', 400);
  }

  if (password.length < 6) {
    throw createError('Password must be at least 6 characters', 400);
  }

  return { firstName, email, password };
}

function validateUpdatePayload(body: unknown = {}): UpdateUserPayload {
  const firstName =
    getPayloadValue(body, 'firstName')?.trim() ||
    getPayloadValue(body, 'first_name')?.trim();
  const email = getPayloadValue(body, 'email')?.trim();
  const password = getPayloadValue(body, 'password')?.trim();

  if (!firstName || !email) {
    throw createError('First name and email are required', 400);
  }

  if (!email.includes('@')) {
    throw createError('Email must be valid', 400);
  }

  if (password && password.length < 6) {
    throw createError('Password must be at least 6 characters', 400);
  }

  return { firstName, email, password: password || undefined };
}

function validateLoginPayload(body: unknown = {}): LoginPayload {
  const email = getPayloadValue(body, 'email')?.trim();
  const password = getPayloadValue(body, 'password');

  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }

  return { email, password };
}

function parseUserId(id: unknown): number {
  if (typeof id !== 'string') {
    throw createError('Invalid user id', 400);
  }

  const parsed = Number(id);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError('Invalid user id', 400);
  }

  return parsed;
}

function createAccessToken(user: AuthUser): string {
  const jwtSecret = requireJwtSecret();

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || '1h') as SignOptions['expiresIn'],
    subject: String(user.id),
  };

  return jwt.sign(
    {
      email: user.email,
      firstName: user.first_name,
    },
    jwtSecret,
    options,
  );
}

async function createUser(body: unknown): Promise<PublicUser> {
  const { firstName, email, password } = validateRegistrationPayload(body);
  const passwordHash = await bcrypt.hash(password, 10);
  let userId: number;

  try {
    userId = await userModel.create({ firstName, email, passwordHash });
  } catch (err) {
    if (isDuplicateEmailError(err)) {
      throw createError('Email is already registered', 409);
    }

    throw err;
  }

  const user = await userModel.findById(userId);

  if (!user) {
    throw createError('Registered user not found', 500);
  }

  return user;
}

async function updateUser(idParam: unknown, body: unknown): Promise<PublicUser> {
  const id = parseUserId(idParam);
  const existingUser = await userModel.findById(id);

  if (!existingUser) {
    throw createError('User not found', 404);
  }

  const { firstName, email, password } = validateUpdatePayload(body);
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  try {
    await userModel.update(id, { firstName, email, passwordHash });
  } catch (err) {
    if (isDuplicateEmailError(err)) {
      throw createError('Email is already registered', 409);
    }

    throw err;
  }

  const updatedUser = await userModel.findById(id);

  if (!updatedUser) {
    throw createError('Updated user not found', 500);
  }

  return updatedUser;
}

async function registerUser(body: unknown): Promise<PublicUser> {
  return createUser(body);
}

async function loginUser(body: unknown): Promise<LoginResponse> {
  const { email, password } = validateLoginPayload(body);
  const user = await userModel.findByEmailForAuth(email);

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw createError('Invalid email or password', 401);
  }

  return {
    token_type: 'Bearer',
    access_token: createAccessToken(user),
    expires_in: process.env.JWT_EXPIRES_IN || '1h',
    user: {
      id: user.id,
      firstName: user.first_name,
      email: user.email,
    },
  };
}

async function listUsers(): Promise<PublicUser[]> {
  return userModel.findAll();
}

async function getUserById(idParam: unknown): Promise<PublicUser> {
  const id = parseUserId(idParam);
  const user = await userModel.findById(id);

  if (!user) {
    throw createError('User not found', 404);
  }

  return user;
}

async function deleteUser(idParam: unknown): Promise<void> {
  const id = parseUserId(idParam);
  const result = await userModel.remove(id);

  if (result.affectedRows === 0) {
    throw createError('User not found', 404);
  }
}

export {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  loginUser,
  registerUser,
  updateUser,
};
