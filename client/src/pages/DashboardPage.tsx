import { useMemo, useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock3,
  Database,
  LoaderCircle,
  Pencil,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import type { PublicUser, UserPayload } from '../api/types';
import { useAuth } from '../lib/auth';
import { formatDate, getInitials } from '../lib/format';
import {
  useDeleteUserMutation,
  useSaveUserMutation,
} from '../mutations/users.mutations';
import { useHealthQuery } from '../query/health.queries';
import { queryKeys } from '../query/queryKeys';
import { useUsersQuery } from '../query/users.queries';

interface UserFormValues {
  firstName: string;
  email: string;
  password: string;
}

interface Notice {
  type: 'success' | 'error';
  text: string;
}

const emptyUserForm: UserFormValues = {
  firstName: '',
  email: '',
  password: '',
};

function getMutationMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function DashboardPage() {
  const { clearSession, session, syncSessionUser, token } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<PublicUser | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<UserFormValues>({
    defaultValues: emptyUserForm,
  });

  const usersQuery = useUsersQuery(token);
  const healthQuery = useHealthQuery();

  const saveUserMutation = useSaveUserMutation({
    onError: (error) => {
      setNotice({
        type: 'error',
        text: getMutationMessage(error, 'Unable to save user'),
      });
    },
    onSuccess: (savedUser) => {
      syncSessionUser(savedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.users(token) });
      setEditingUser(null);
      reset(emptyUserForm);
      setNotice({
        type: 'success',
        text: `${savedUser.first_name} saved.`,
      });
    },
  });

  const deleteUserMutation = useDeleteUserMutation({
    onError: (error) => {
      setNotice({
        type: 'error',
        text: getMutationMessage(error, 'Unable to delete user'),
      });
    },

    onSuccess: (deletedUser) => {
      if (editingUser?.id === deletedUser.id) {
        setEditingUser(null);
        reset(emptyUserForm);
      }

      if (session?.user.id === deletedUser.id) {
        clearSession();
        queryClient.removeQueries({ queryKey: ['users'] });
        navigate('/login', { replace: true });
        return;
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.users(token) });
      setNotice({
        type: 'success',
        text: `${deletedUser.first_name} deleted.`,
      });
    },
  });

  const users = usersQuery.data || [];
  const filteredCount = useMemo(
    () =>
      users.filter((user) => {
        const value = `${user.first_name} ${user.email}`.toLowerCase();
        return value.includes(globalFilter.toLowerCase());
      }).length,
    [globalFilter, users],
  );
  const newestUser = users[0];
  const healthConnected = Boolean(healthQuery.data?.database.connected);

  function resetUserForm(): void {
    setEditingUser(null);
    reset(emptyUserForm);
  }

  function startEdit(user: PublicUser): void {
    setEditingUser(user);
    setNotice(null);
    reset({
      firstName: user.first_name,
      email: user.email,
      password: '',
    });
  }

  function handleDelete(user: PublicUser): void {
    if (!token) {
      setNotice({ type: 'error', text: 'Sign in before changing users' });
      return;
    }

    if (window.confirm(`Delete ${user.first_name}?`)) {
      deleteUserMutation.mutate({ token, user });
    }
  }

  function onSubmit(values: UserFormValues): void {
    if (!token) {
      setNotice({ type: 'error', text: 'Sign in before changing users' });
      return;
    }

    const payload: UserPayload = {
      firstName: values.firstName.trim(),
      email: values.email.trim(),
    };
    const password = values.password.trim();

    if (!editingUser || password) {
      payload.password = password;
    }

    saveUserMutation.mutate({
      token,
      payload,
      userId: editingUser?.id,
    });
  }

  const columns = useMemo<ColumnDef<PublicUser>[]>(
    () => [
      {
        accessorKey: 'first_name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex min-w-44 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-black text-white">
              {getInitials(row.original.first_name)}
            </span>
            <strong className="min-w-0 overflow-wrap-anywhere text-sm font-black text-slate-900">
              {row.original.first_name}
            </strong>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-slate-600">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => (
          <span className="text-sm font-medium text-slate-600">
            {formatDate(getValue<string>())}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const user = row.original;
          const isDeleting =
            deleteUserMutation.isPending &&
            deleteUserMutation.variables?.user.id === user.id;

          return (
            <div className="flex justify-end gap-2">
              <button
                className="ghost-button"
                title="Edit user"
                type="button"
                onClick={() => startEdit(user)}
              >
                <Pencil aria-hidden="true" className="size-4" />
                Edit
              </button>
              <button
                className="danger-button"
                disabled={isDeleting}
                title="Delete user"
                type="button"
                onClick={() => handleDelete(user)}
              >
                {isDeleting ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                ) : (
                  <Trash2 aria-hidden="true" className="size-4" />
                )}
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [deleteUserMutation.isPending, deleteUserMutation.variables?.user.id],
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
            Users
          </p>
          <h1 className="text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">
            Dashboard
          </h1>
        </div>
        <button
          className="secondary-button"
          disabled={usersQuery.isFetching}
          title="Refresh users"
          type="button"
          onClick={() => usersQuery.refetch()}
        >
          <RefreshCcw
            aria-hidden="true"
            className={`size-4 ${usersQuery.isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-teal-100 text-teal-700">
              <Users aria-hidden="true" className="size-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-normal text-slate-400">
              Total
            </span>
          </div>
          <strong className="block text-3xl font-black text-slate-950">
            {users.length}
          </strong>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {filteredCount} shown
          </p>
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="grid size-10 place-items-center rounded-md bg-amber-100 text-amber-700">
              <Clock3 aria-hidden="true" className="size-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-normal text-slate-400">
              Latest
            </span>
          </div>
          <strong className="block truncate text-xl font-black text-slate-950">
            {newestUser?.first_name || 'No users'}
          </strong>
          <p className="mt-1 truncate text-sm font-semibold text-slate-500">
            {newestUser ? newestUser.email : 'Create the first record'}
          </p>
        </div>

        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span
              className={`grid size-10 place-items-center rounded-md ${
                healthConnected
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              <Database aria-hidden="true" className="size-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-normal text-slate-400">
              API
            </span>
          </div>
          <strong className="block text-xl font-black text-slate-950">
            {healthConnected ? 'Online' : 'Unavailable'}
          </strong>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Database: {healthQuery.data?.database.client || 'checking'}
          </p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="panel p-5" aria-labelledby="user-form-title">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
                Form
              </p>
              <h2
                className="text-xl font-black tracking-normal text-slate-950"
                id="user-form-title"
              >
                {editingUser ? 'Edit user' : 'Add user'}
              </h2>
            </div>
            {editingUser ? (
              <button
                className="ghost-button"
                title="Cancel edit"
                type="button"
                onClick={resetUserForm}
              >
                <X aria-hidden="true" className="size-4" />
                Cancel
              </button>
            ) : null}
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="form-label">
              <span>First name</span>
              <input
                autoComplete="given-name"
                className="form-input"
                type="text"
                {...register('firstName', {
                  required: 'First name is required',
                  setValueAs: (value) => value.trim(),
                })}
              />
              {errors.firstName ? (
                <span className="text-sm font-semibold text-rose-700">
                  {errors.firstName.message}
                </span>
              ) : null}
            </label>

            <label className="form-label">
              <span>Email</span>
              <input
                autoComplete="email"
                className="form-input"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  setValueAs: (value) => value.trim(),
                })}
              />
              {errors.email ? (
                <span className="text-sm font-semibold text-rose-700">
                  {errors.email.message}
                </span>
              ) : null}
            </label>

            <label className="form-label">
              <span>Password</span>
              <input
                autoComplete="new-password"
                className="form-input"
                placeholder={editingUser ? 'Leave blank to keep password' : ''}
                type="password"
                {...register('password', {
                  validate: (value) => {
                    if (!editingUser && !value.trim()) {
                      return 'Password is required';
                    }

                    if (value && value.trim().length < 6) {
                      return 'Password must be at least 6 characters';
                    }

                    return true;
                  },
                })}
              />
              {errors.password ? (
                <span className="text-sm font-semibold text-rose-700">
                  {errors.password.message}
                </span>
              ) : null}
            </label>

            <button
              className="primary-button"
              disabled={saveUserMutation.isPending}
              type="submit"
            >
              {saveUserMutation.isPending ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : editingUser ? (
                <Save aria-hidden="true" className="size-4" />
              ) : (
                <UserPlus aria-hidden="true" className="size-4" />
              )}
              {editingUser ? 'Save changes' : 'Add user'}
            </button>
          </form>
        </section>

        <section className="panel min-w-0 overflow-hidden" aria-labelledby="users-title">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
                Table
              </p>
              <h2
                className="text-xl font-black tracking-normal text-slate-950"
                id="users-title"
              >
                Users
              </h2>
            </div>

            <label className="relative w-full max-w-sm">
              <span className="sr-only">Search users</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="form-input pl-9"
                placeholder="Search users"
                type="search"
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
              />
            </label>
          </div>

          {notice ? (
            <div
              className={`mx-5 mt-5 rounded-md border px-3 py-2 text-sm font-semibold ${
                notice.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
              role="status"
            >
              {notice.text}
            </div>
          ) : null}

          {usersQuery.isError ? (
            <div className="m-5 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
              {getMutationMessage(usersQuery.error, 'Unable to load users')}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      const sorted = header.column.getIsSorted();

                      return (
                        <th
                          className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-black uppercase tracking-normal text-slate-500"
                          key={header.id}
                        >
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <button
                              className="inline-flex items-center gap-2 font-black"
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              {sorted === 'asc' ? (
                                <ArrowUp aria-hidden="true" className="size-3.5" />
                              ) : sorted === 'desc' ? (
                                <ArrowDown aria-hidden="true" className="size-3.5" />
                              ) : (
                                <ArrowUpDown
                                  aria-hidden="true"
                                  className="size-3.5 text-slate-300"
                                />
                              )}
                            </button>
                          ) : (
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {usersQuery.isLoading ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                      colSpan={columns.length}
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : null}

                {!usersQuery.isLoading &&
                table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-sm font-semibold text-slate-500"
                      colSpan={columns.length}
                    >
                      No users found.
                    </td>
                  </tr>
                ) : null}

                {table.getRowModel().rows.map((row) => (
                  <tr className="border-b border-slate-100 last:border-0" key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td className="px-4 py-3 align-middle" key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  );
}
