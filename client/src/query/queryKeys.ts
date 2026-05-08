export const queryKeys = {
  health: ['health'] as const,
  products: ['products'] as const,
  users: (token?: string) => ['users', token] as const,
};
