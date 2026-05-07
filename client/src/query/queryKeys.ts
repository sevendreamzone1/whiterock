export const queryKeys = {
  health: ['health'] as const,
  users: (token?: string) => ['users', token] as const,
};
