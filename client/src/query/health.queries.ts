import { useQuery } from '@tanstack/react-query';

import { getHealth } from '../api/health';
import { queryKeys } from './queryKeys';

export function useHealthQuery() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    refetchInterval: 30_000,
    retry: 1,
  });
}
