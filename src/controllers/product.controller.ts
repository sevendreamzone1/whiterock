import type { NextFunction, Request, Response } from 'express';

import * as productService from '../services/product.service';

async function listProducts(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const products = await productService.listProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
}

async function createProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

async function updateProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err) {
    next(err);
  }
}

async function deleteProduct(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export { createProduct, deleteProduct, listProducts, updateProduct };
