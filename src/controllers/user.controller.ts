import type { NextFunction, Request, Response } from 'express';

import {
  addUserEventsClient,
  broadcastUsersChanged,
} from '../services/user-events.service';
import * as userService from '../services/user.service';

async function listUsers(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function getUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function createUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.createUser(req.body);
    broadcastUsersChanged({ action: 'created', userId: user.id });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    broadcastUsersChanged({ action: 'updated', userId: user.id });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await userService.deleteUser(req.params.id);
    broadcastUsersChanged({ action: 'deleted', userId: String(req.params.id) });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function loginUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const loginResponse = await userService.loginUser(req.body);
    res.json(loginResponse);
  } catch (err) {
    next(err);
  }
}

async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await userService.registerUser(req.body);
    broadcastUsersChanged({ action: 'registered', userId: user.id });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

function streamUserEvents(req: Request, res: Response): void {
  res.set({
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const cleanup = addUserEventsClient(res);
  req.on('close', cleanup);
}

export {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  loginUser,
  registerUser,
  streamUserEvents,
  updateUser,
};
