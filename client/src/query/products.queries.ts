import { useQuery } from '@tanstack/react-query';

import { listProducts } from '../api/products';
import { queryKeys } from './queryKeys';

export function useProductsQuery() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: listProducts,
  });
}
