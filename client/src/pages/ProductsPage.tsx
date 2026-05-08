import { useMemo, useState } from 'react';
import {
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import type { Product, ProductPayload } from '../api/types';
import { useAuth } from '../lib/auth';
import { formatCurrency } from '../lib/format';
import {
  useDeleteProductMutation,
  useSaveProductMutation,
} from '../mutations/products.mutations';
import { queryKeys } from '../query/queryKeys';
import { useProductsQuery } from '../query/products.queries';

interface ProductFormValues {
  category: string;
  name: string;
  price: string;
}

interface Notice {
  type: 'success' | 'error';
  text: string;
}

const emptyProductForm: ProductFormValues = {
  category: 'General',
  name: '',
  price: '',
};

function getMutationMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function ProductsPage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [search, setSearch] = useState('');
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ProductFormValues>({
    defaultValues: emptyProductForm,
  });

  const productsQuery = useProductsQuery();
  const products = productsQuery.data || [];
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const value = `${product.name} ${product.category}`.toLowerCase();
        return value.includes(search.trim().toLowerCase());
      }),
    [products, search],
  );

  const saveProductMutation = useSaveProductMutation({
    onError: (error) => {
      setNotice({
        type: 'error',
        text: getMutationMessage(error, 'Unable to save product'),
      });
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      reset(emptyProductForm);
      setEditingProduct(null);
      setNotice({
        type: 'success',
        text: `${product.name} saved.`,
      });
    },
  });

  const deleteProductMutation = useDeleteProductMutation({
    onError: (error) => {
      setNotice({
        type: 'error',
        text: getMutationMessage(error, 'Unable to delete product'),
      });
    },
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });

      if (editingProduct?.id === product.id) {
        reset(emptyProductForm);
        setEditingProduct(null);
      }

      setNotice({
        type: 'success',
        text: `${product.name} deleted.`,
      });
    },
  });

  function resetProductForm(): void {
    reset(emptyProductForm);
    setEditingProduct(null);
    setNotice(null);
  }

  function startEdit(product: Product): void {
    setEditingProduct(product);
    setNotice(null);
    reset({
      category: product.category,
      name: product.name,
      price: String(product.price),
    });
  }

  function onSubmit(values: ProductFormValues): void {
    if (!token) {
      setNotice({ type: 'error', text: 'Sign in before changing products' });
      return;
    }

    const payload: ProductPayload = {
      category: values.category.trim(),
      name: values.name.trim(),
      price: Number(values.price),
    };

    saveProductMutation.mutate({
      payload,
      productId: editingProduct?.id,
      token,
    });
  }

  function handleDelete(product: Product): void {
    if (!token) {
      setNotice({ type: 'error', text: 'Sign in before changing products' });
      return;
    }

    if (window.confirm(`Delete ${product.name}?`)) {
      deleteProductMutation.mutate({ product, token });
    }
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
            Inventory
          </p>
          <h1 className="text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">
            Manage products
          </h1>
        </div>
        <div className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 shadow-sm">
          <ShoppingBag aria-hidden="true" className="size-4 text-teal-700" />
          <span className="text-sm font-black text-slate-800">
            {products.length} items
          </span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="panel p-5" aria-labelledby="product-form-title">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
                Editor
              </p>
              <h2
                className="text-xl font-black tracking-normal text-slate-950"
                id="product-form-title"
              >
                {editingProduct ? 'Update item' : 'Add item'}
              </h2>
            </div>
            {editingProduct ? (
              <button
                className="ghost-button"
                title="Cancel edit"
                type="button"
                onClick={resetProductForm}
              >
                <X aria-hidden="true" className="size-4" />
                Cancel
              </button>
            ) : (
              <span className="grid size-10 place-items-center rounded-md bg-amber-100 text-amber-700">
                <Package aria-hidden="true" className="size-5" />
              </span>
            )}
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="form-label">
              <span>Product name</span>
              <input
                className="form-input"
                placeholder="Wireless headphones"
                type="text"
                {...register('name', {
                  required: 'Product name is required',
                  setValueAs: (value) => value.trim(),
                })}
              />
              {errors.name ? (
                <span className="text-sm font-semibold text-rose-700">
                  {errors.name.message}
                </span>
              ) : null}
            </label>

            <label className="form-label">
              <span>Category</span>
              <input
                className="form-input"
                list="product-categories"
                placeholder="Electronics"
                type="text"
                {...register('category', {
                  required: 'Category is required',
                  setValueAs: (value) => value.trim(),
                })}
              />
              <datalist id="product-categories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              {errors.category ? (
                <span className="text-sm font-semibold text-rose-700">
                  {errors.category.message}
                </span>
              ) : null}
            </label>

            <label className="form-label">
              <span>Rate</span>
              <input
                className="form-input"
                min="0"
                placeholder="49.99"
                step="0.01"
                type="number"
                {...register('price', {
                  required: 'Rate is required',
                  validate: (value) => {
                    const price = Number(value);

                    if (!Number.isFinite(price)) {
                      return 'Rate must be a number';
                    }

                    if (price < 0) {
                      return 'Rate must be zero or greater';
                    }

                    return true;
                  },
                })}
              />
              {errors.price ? (
                <span className="text-sm font-semibold text-rose-700">
                  {errors.price.message}
                </span>
              ) : null}
            </label>

            <button
              className="primary-button"
              disabled={saveProductMutation.isPending}
              type="submit"
            >
              {saveProductMutation.isPending ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : editingProduct ? (
                <Save aria-hidden="true" className="size-4" />
              ) : (
                <Plus aria-hidden="true" className="size-4" />
              )}
              {editingProduct ? 'Save changes' : 'Add product'}
            </button>
          </form>
        </section>

        <section className="min-w-0" aria-labelledby="products-title">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
                Catalog
              </p>
              <h2
                className="text-xl font-black tracking-normal text-slate-950"
                id="products-title"
              >
                Product list
              </h2>
            </div>

            <label className="relative w-full max-w-sm">
              <span className="sr-only">Search products</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
              />
              <input
                className="form-input pl-9"
                placeholder="Search products"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          {notice ? (
            <div
              className={`mb-4 rounded-md border px-3 py-2 text-sm font-semibold ${
                notice.type === 'error'
                  ? 'border-rose-200 bg-rose-50 text-rose-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
              role="status"
            >
              {notice.text}
            </div>
          ) : null}

          {productsQuery.isError ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
              {getMutationMessage(productsQuery.error, 'Unable to load products')}
            </div>
          ) : null}

          {productsQuery.isLoading ? (
            <div className="panel grid min-h-56 place-items-center p-8 text-sm font-semibold text-slate-500">
              Loading products...
            </div>
          ) : null}

          {!productsQuery.isLoading && filteredProducts.length === 0 ? (
            <div className="panel grid min-h-56 place-items-center p-8 text-center">
              <div>
                <Package
                  aria-hidden="true"
                  className="mx-auto mb-3 size-10 text-slate-300"
                />
                <p className="text-sm font-semibold text-slate-500">
                  No products found.
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => {
              const isDeleting =
                deleteProductMutation.isPending &&
                deleteProductMutation.variables?.product.id === product.id;

              return (
                <article
                  className="panel overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
                  key={product.id}
                >
                  <div className="grid gap-4 p-4">
                    <div className="min-h-20">
                      <span className="mb-2 inline-flex rounded-full bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">
                        {product.category}
                      </span>
                      <h3 className="line-clamp-2 text-base font-black leading-snug text-slate-950">
                        {product.name}
                      </h3>
                      <p className="mt-2 text-xl font-black text-rose-600">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className="ghost-button w-full"
                        title="Edit product"
                        type="button"
                        onClick={() => startEdit(product)}
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                        Edit
                      </button>
                      <button
                        className="danger-button w-full"
                        disabled={isDeleting}
                        title="Delete product"
                        type="button"
                        onClick={() => handleDelete(product)}
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
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
