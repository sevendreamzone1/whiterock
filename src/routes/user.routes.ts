import { Router } from 'express';

import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  loginUser,
  registerUser,
  streamUserEvents,
  updateUser,
} from '../controllers/user.controller';
import authenticateBearerToken from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/users', authenticateBearerToken, listUsers);
router.get('/users/events', authenticateBearerToken, streamUserEvents);
router.get('/users/:id', authenticateBearerToken, getUser);
router.post('/users', authenticateBearerToken, createUser);
router.put('/users/:id', authenticateBearerToken, updateUser);
router.delete('/users/:id', authenticateBearerToken, deleteUser);

export default router;
