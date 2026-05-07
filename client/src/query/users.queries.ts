import { useQuery } from '@tanstack/react-query';

import { listUsers } from '../api/users';
import { queryKeys } from './queryKeys';

export function useUsersQuery(token?: string) {
  return useQuery({
    queryKey: queryKeys.users(token),
    queryFn: () => listUsers(token || ''),
    enabled: Boolean(token),
  });
}
