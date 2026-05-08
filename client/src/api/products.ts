import { apiRequest } from './http';
import type { Product, ProductPayload } from './types';

export function listProducts(): Promise<Product[]> {
  return apiRequest<Product[]>('/api/products');
}

export function createProduct(
  token: string,
  payload: ProductPayload,
): Promise<Product> {
  return apiRequest<Product>('/api/products', {
    method: 'POST',
    token,
    body: payload,
  });
}

export function updateProduct(
  token: string,
  productId: number,
  payload: ProductPayload,
): Promise<Product> {
  return apiRequest<Product>(`/api/products/${productId}`, {
    method: 'PUT',
    token,
    body: payload,
  });
}

export function deleteProduct(token: string, productId: number): Promise<null> {
  return apiRequest<null>(`/api/products/${productId}`, {
    method: 'DELETE',
    token,
  });
}
