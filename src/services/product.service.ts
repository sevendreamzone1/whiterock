import * as productModel from '../models/product.model';
import type { Product } from '../models/product.model';

interface HttpError extends Error {
  statusCode: number;
}

interface ProductPayload {
  category?: string;
  name?: string;
  price?: number | string;
}

interface CreateProductPayload {
  category: string;
  name: string;
  price: number;
}

function createError(message: string, statusCode: number): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  return error;
}

function getPayloadValue(
  body: unknown,
  key: keyof ProductPayload,
): string | number | undefined {
  if (!body || typeof body !== 'object') {
    return undefined;
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' || typeof value === 'number'
    ? value
    : undefined;
}

function parseProductId(id: unknown): number {
  if (typeof id !== 'string') {
    throw createError('Invalid product id', 400);
  }

  const parsed = Number(id);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError('Invalid product id', 400);
  }

  return parsed;
}

function validateProductPayload(body: unknown = {}): CreateProductPayload {
  const category = String(getPayloadValue(body, 'category') || 'General').trim();
  const name = String(getPayloadValue(body, 'name') || '').trim();
  const price = Number(getPayloadValue(body, 'price'));

  if (!name || !Number.isFinite(price)) {
    throw createError('Name and price are required', 400);
  }

  if (!category) {
    throw createError('Category is required', 400);
  }

  if (name.length > 160) {
    throw createError('Name must be 160 characters or less', 400);
  }

  if (category.length > 100) {
    throw createError('Category must be 100 characters or less', 400);
  }

  if (price < 0) {
    throw createError('Price must be zero or greater', 400);
  }

  return {
    category,
    name,
    price: Math.round(price * 100) / 100,
  };
}

async function listProducts(): Promise<Product[]> {
  return productModel.findAll();
}

async function createProduct(body: unknown): Promise<Product> {
  const payload = validateProductPayload(body);
  const productId = await productModel.create(payload);
  const product = await productModel.findById(productId);

  if (!product) {
    throw createError('Created product not found', 500);
  }

  return product;
}

async function updateProduct(idParam: unknown, body: unknown): Promise<Product> {
  const id = parseProductId(idParam);
  const existingProduct = await productModel.findById(id);

  if (!existingProduct) {
    throw createError('Product not found', 404);
  }

  const payload = validateProductPayload(body);
  const result = await productModel.update(id, payload);

  if (result.affectedRows === 0) {
    throw createError('Product not found', 404);
  }

  const product = await productModel.findById(id);

  if (!product) {
    throw createError('Updated product not found', 500);
  }

  return product;
}

async function deleteProduct(idParam: unknown): Promise<void> {
  const id = parseProductId(idParam);
  const result = await productModel.remove(id);

  if (result.affectedRows === 0) {
    throw createError('Product not found', 404);
  }
}

export { createProduct, deleteProduct, listProducts, updateProduct };
