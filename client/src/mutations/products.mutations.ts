import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { createProduct, deleteProduct, updateProduct } from '../api/products';
import type { Product, ProductPayload } from '../api/types';

export interface SaveProductVariables {
  token: string;
  payload: ProductPayload;
  productId?: number;
}

export interface DeleteProductVariables {
  token: string;
  product: Product;
}

export function useSaveProductMutation(
  options?: UseMutationOptions<Product, Error, SaveProductVariables>,
) {
  return useMutation({
    mutationFn: ({ payload, productId, token }) =>
      productId
        ? updateProduct(token, productId, payload)
        : createProduct(token, payload),
    ...options,
  });
}

export function useDeleteProductMutation(
  options?: UseMutationOptions<Product, Error, DeleteProductVariables>,
) {
  return useMutation({
    mutationFn: async ({ product, token }) => {
      await deleteProduct(token, product.id);
      return product;
    },
    ...options,
  });
}
