import {Statement} from './driver';
import {CATEGORIES, PRODUCTS, SEED_VERSION} from './fixtures';

export const SCHEMA_VERSION = 1;

/** Migrations indexed by target version. Each runs inside one transaction. */
export const MIGRATIONS: Record<number, Statement[]> = {
  1: [
    {sql: 'CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL)'},
    {
      sql: `CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sortOrder INTEGER NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE products (
        id TEXT PRIMARY KEY,
        categoryId TEXT NOT NULL REFERENCES categories(id),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        assetKey TEXT NOT NULL,
        priceRupiah INTEGER NOT NULL CHECK (priceRupiah > 0),
        stock INTEGER NOT NULL CHECK (stock >= 0),
        sortOrder INTEGER NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE wishlist (
        productId TEXT PRIMARY KEY REFERENCES products(id),
        createdAt TEXT NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE cart_items (
        productId TEXT PRIMARY KEY REFERENCES products(id),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        addedAt TEXT NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE addresses (
        id TEXT PRIMARY KEY,
        recipient TEXT NOT NULL,
        phone TEXT NOT NULL,
        addressText TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )`,
    },
    {
      sql: `CREATE TABLE orders (
        id TEXT PRIMARY KEY,
        number INTEGER NOT NULL UNIQUE,
        operationId TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled')),
        createdAt TEXT NOT NULL,
        cancelledAt TEXT,
        addressRecipient TEXT NOT NULL,
        addressPhone TEXT NOT NULL,
        addressText TEXT NOT NULL,
        subtotalRupiah INTEGER NOT NULL CHECK (subtotalRupiah >= 0),
        shippingRupiah INTEGER NOT NULL CHECK (shippingRupiah >= 0),
        totalRupiah INTEGER NOT NULL CHECK (totalRupiah = subtotalRupiah + shippingRupiah)
      )`,
    },
    {
      sql: `CREATE TABLE order_items (
        orderId TEXT NOT NULL REFERENCES orders(id),
        productId TEXT NOT NULL REFERENCES products(id),
        nameSnapshot TEXT NOT NULL,
        assetKey TEXT NOT NULL,
        unitPriceRupiah INTEGER NOT NULL CHECK (unitPriceRupiah > 0),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        lineTotalRupiah INTEGER NOT NULL CHECK (lineTotalRupiah = unitPriceRupiah * quantity),
        PRIMARY KEY (orderId, productId)
      )`,
    },
    {sql: `INSERT INTO metadata (key, value) VALUES ('schemaVersion', '1')`},
    {sql: 'PRAGMA user_version = 1'},
  ],
};

/** Statements that write fixture `shop-v1` into empty catalog tables. */
export function seedStatements(): Statement[] {
  return [
    ...CATEGORIES.map((category, index) => ({
      sql: 'INSERT INTO categories (id, name, sortOrder) VALUES (?, ?, ?)',
      params: [category.id, category.name, index],
    })),
    ...PRODUCTS.map((product, index) => ({
      sql: `INSERT INTO products (id, categoryId, name, description, assetKey, priceRupiah, stock, sortOrder)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        product.id,
        product.categoryId,
        product.name,
        product.description,
        product.id,
        product.priceRupiah,
        product.stock,
        index,
      ],
    })),
    {
      sql: `INSERT INTO metadata (key, value) VALUES ('seedVersion', ?)`,
      params: [SEED_VERSION],
    },
  ];
}
