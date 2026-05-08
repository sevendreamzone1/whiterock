import { Router } from 'express';

import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from '../controllers/product.controller';
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
router.get('/products', listProducts);
router.post('/products', authenticateBearerToken, createProduct);
router.put('/products/:id', authenticateBearerToken, updateProduct);
router.delete('/products/:id', authenticateBearerToken, deleteProduct);
router.get('/users', authenticateBearerToken, listUsers);
router.get('/users/events', authenticateBearerToken, streamUserEvents);
router.get('/users/:id', authenticateBearerToken, getUser);
router.post('/users', authenticateBearerToken, createUser);
router.put('/users/:id', authenticateBearerToken, updateUser);
router.delete('/users/:id', authenticateBearerToken, deleteUser);

export default router;
