import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { QueryResultRow } from 'pg';

import {
  databaseClient,
  executePostgres,
  queryMySql,
  queryPostgres,
} from '../config/db';

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  created_at: Date;
}

interface ProductRow extends Omit<Product, 'price'>, RowDataPacket {
  price: number | string;
}

interface PostgresProductRow
  extends Omit<Product, 'price'>,
    QueryResultRow {
  price: number | string;
}

interface InsertProductRow extends QueryResultRow {
  id: number;
}

interface CreateProductParams {
  category: string;
  name: string;
  price: number;
}

interface UpdateProductParams extends CreateProductParams {}

interface MutationResult {
  affectedRows: number;
}

const productColumns = 'id, name, category, price, created_at';

function normalizeProduct<T extends ProductRow | PostgresProductRow>(
  product: T,
): Product {
  return {
    ...product,
    price: Number(product.price),
  };
}

async function findAll(): Promise<Product[]> {
  const products =
    databaseClient === 'postgres'
      ? await queryPostgres<PostgresProductRow>(
          `SELECT ${productColumns} FROM products ORDER BY id DESC`,
        )
      : await queryMySql<ProductRow[]>(
          `SELECT ${productColumns} FROM products ORDER BY id DESC`,
        );

  return products.map(normalizeProduct);
}

async function findById(id: number): Promise<Product | undefined> {
  const rows =
    databaseClient === 'postgres'
      ? await queryPostgres<PostgresProductRow>(
          `SELECT ${productColumns} FROM products WHERE id = $1`,
          [id],
        )
      : await queryMySql<ProductRow[]>(
          `SELECT ${productColumns} FROM products WHERE id = ?`,
          [id],
        );

  return rows[0] ? normalizeProduct(rows[0]) : undefined;
}

async function create({
  category,
  name,
  price,
}: CreateProductParams): Promise<number> {
  if (databaseClient === 'postgres') {
    const rows = await queryPostgres<InsertProductRow>(
      'INSERT INTO products (name, category, price) VALUES ($1, $2, $3) RETURNING id',
      [name, category, price],
    );

    return rows[0].id;
  }

  const result = await queryMySql<ResultSetHeader>(
    'INSERT INTO products (name, category, price) VALUES (?, ?, ?)',
    [name, category, price],
  );

  return result.insertId;
}

async function update(
  id: number,
  { category, name, price }: UpdateProductParams,
): Promise<MutationResult> {
  if (databaseClient === 'postgres') {
    return executePostgres(
      'UPDATE products SET name = $1, category = $2, price = $3 WHERE id = $4',
      [name, category, price, id],
    );
  }

  const result = await queryMySql<ResultSetHeader>(
    'UPDATE products SET name = ?, category = ?, price = ? WHERE id = ?',
    [name, category, price, id],
  );

  return { affectedRows: result.affectedRows };
}

async function remove(id: number): Promise<MutationResult> {
  if (databaseClient === 'postgres') {
    return executePostgres('DELETE FROM products WHERE id = $1', [id]);
  }

  const result = await queryMySql<ResultSetHeader>(
    'DELETE FROM products WHERE id = ?',
    [id],
  );

  return { affectedRows: result.affectedRows };
}

export { create, findAll, findById, remove, update };
