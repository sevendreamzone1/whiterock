import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { createUser, deleteUser, updateUser } from '../api/users';
import type { PublicUser, UserPayload } from '../api/types';

export interface SaveUserVariables {
  token: string;
  payload: UserPayload;
  userId?: number;
}

export interface DeleteUserVariables {
  token: string;
  user: PublicUser;
}

export function useSaveUserMutation(
  options?: UseMutationOptions<PublicUser, Error, SaveUserVariables>,
) {
  return useMutation({
    mutationFn: ({ payload, token, userId }) =>
      userId ? updateUser(token, userId, payload) : createUser(token, payload),
    ...options,
  });
}

export function useDeleteUserMutation(
  options?: UseMutationOptions<PublicUser, Error, DeleteUserVariables>,
) {
  return useMutation({
    mutationFn: async ({ token, user }) => {
      await deleteUser(token, user.id);
      return user;
    },
    ...options,
  });
}
