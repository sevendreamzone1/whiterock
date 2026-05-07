import { useMutation, type UseMutationOptions } from '@tanstack/react-query';

import { login, register } from '../api/auth';
import type { AuthPayload, LoginResponse, PublicUser } from '../api/types';

export function useLoginMutation(
  options?: UseMutationOptions<LoginResponse, Error, AuthPayload>,
) {
  return useMutation({
    mutationFn: login,
    ...options,
  });
}

export function useRegisterMutation(
  options?: UseMutationOptions<PublicUser, Error, AuthPayload>,
) {
  return useMutation({
    mutationFn: register,
    ...options,
  });
}
