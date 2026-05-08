import { useMemo, useState } from 'react';
import {
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';

import type { Product } from '../api/types';
import { formatCurrency } from '../lib/format';
import { useProductsQuery } from '../query/products.queries';

interface CartItem {
  product: Product;
  quantity: number;
}

function getCartTotal(items: CartItem[]): number {
  return items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
}

export function ShopPage() {
  const productsQuery = useProductsQuery();
  const products = productsQuery.data || [];
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = `${product.name} ${product.category}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        const matchesCategory =
          categoryFilter === 'All' || product.category === categoryFilter;

        return matchesSearch && matchesCategory;
      }),
    [categoryFilter, products, search],
  );
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = getCartTotal(cartItems);

  function addToCart(product: Product): void {
    setCartItems((current) => {
      const existingItem = current.find((item) => item.product.id === product.id);

      if (existingItem) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { product, quantity: 1 }];
    });
    setNotice(null);
  }

  function updateQuantity(productId: number, change: number): void {
    setCartItems((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + change }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeFromCart(productId: number): void {
    setCartItems((current) =>
      current.filter((item) => item.product.id !== productId),
    );
  }

  function buyProducts(): void {
    if (cartItems.length === 0) {
      setNotice('Add products to the cart before buying.');
      return;
    }

    setNotice(`Order placed for ${formatCurrency(cartTotal)}.`);
    setCartItems([]);
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
            Shop
          </p>
          <h1 className="text-3xl font-black leading-tight tracking-normal text-slate-950 sm:text-4xl">
            Product store
          </h1>
        </div>
        <div className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 shadow-sm">
          <ShoppingCart aria-hidden="true" className="size-4 text-rose-600" />
          <span className="text-sm font-black text-slate-800">
            {cartCount} in cart
          </span>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-3">
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

            <select
              className="form-input w-full max-w-56"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="All">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {productsQuery.isError ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
              Unable to load products.
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <article
                className="panel overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md"
                key={product.id}
              >
                <div className="grid gap-4 p-4">
                  <div className="min-h-24">
                    <span className="mb-2 inline-flex rounded-full bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">
                      {product.category}
                    </span>
                    <h2 className="line-clamp-2 text-base font-black leading-snug text-slate-950">
                      {product.name}
                    </h2>
                    <p className="mt-2 text-xl font-black text-rose-600">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <button
                    className="primary-button w-full"
                    type="button"
                    onClick={() => addToCart(product)}
                  >
                    <ShoppingCart aria-hidden="true" className="size-4" />
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="panel h-fit p-5" aria-labelledby="cart-title">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-normal text-teal-700">
                Checkout
              </p>
              <h2
                className="text-xl font-black tracking-normal text-slate-950"
                id="cart-title"
              >
                Cart
              </h2>
            </div>
            <span className="grid size-10 place-items-center rounded-md bg-rose-100 text-rose-700">
              <ShoppingCart aria-hidden="true" className="size-5" />
            </span>
          </div>

          {notice ? (
            <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              {notice}
            </div>
          ) : null}

          {cartItems.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm font-semibold text-slate-500">
              Cart is empty.
            </p>
          ) : (
            <div className="grid gap-3">
              {cartItems.map((item) => (
                <div
                  className="grid gap-3 rounded-md border border-slate-200 p-3"
                  key={item.product.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-sm font-black text-slate-900">
                        {item.product.name}
                      </h3>
                      <p className="mt-1 text-sm font-bold text-rose-600">
                        {formatCurrency(item.product.price)}
                      </p>
                    </div>
                    <button
                      className="ghost-button min-h-8 px-2"
                      title="Remove from cart"
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-md border border-slate-200">
                      <button
                        className="grid size-9 place-items-center text-slate-700"
                        title="Decrease quantity"
                        type="button"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus aria-hidden="true" className="size-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-black">
                        {item.quantity}
                      </span>
                      <button
                        className="grid size-9 place-items-center text-slate-700"
                        title="Increase quantity"
                        type="button"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                    <strong className="text-sm font-black text-slate-900">
                      {formatCurrency(item.product.price * item.quantity)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="my-5 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-sm font-black text-slate-500">Total</span>
            <strong className="text-2xl font-black text-slate-950">
              {formatCurrency(cartTotal)}
            </strong>
          </div>

          <button className="primary-button w-full" type="button" onClick={buyProducts}>
            <ShoppingCart aria-hidden="true" className="size-4" />
            Buy now
          </button>
        </aside>
      </div>
    </section>
  );
}
