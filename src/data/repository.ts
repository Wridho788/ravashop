import {ShopError} from '../domain/errors';
import {computeTotals, lineTotal} from '../domain/totals';
import {
  Address,
  AddressInput,
  CartLine,
  CatalogQuery,
  Category,
  Order,
  OrderDetail,
  OrderItem,
  Product,
} from '../domain/types';
import {requireValidAddress, validateAddress, validateQuantity} from '../domain/validation';
import {DriverError, Row, SqlDriver, SqlValue, Statement} from './driver';
import {SEED_VERSION} from './fixtures';
import {MIGRATIONS, SCHEMA_VERSION, seedStatements} from './schema';

/** Target of a one-shot storage fault (E2E build only). */
export type FaultTarget = 'checkout' | 'write';
export type FaultSource = {consume(target: FaultTarget): boolean};

export type RepositoryOptions = {
  faults?: FaultSource;
  now?: () => Date;
  createId?: (prefix: string) => string;
};

/**
 * Injected into a batch to simulate a storage failure mid-transaction. It changes one
 * row while expecting zero, so SQLite rolls back every statement before it.
 */
const FAULT_STATEMENT: Statement = {
  sql: `UPDATE metadata SET value = value WHERE key = 'schemaVersion'`,
  expectChanges: 0,
};

const SORT_SQL = {
  recommended: 'p.sortOrder ASC',
  'price-asc': 'p.priceRupiah ASC, p.sortOrder ASC',
  'price-desc': 'p.priceRupiah DESC, p.sortOrder ASC',
} as const;

const PRODUCT_COLUMNS = `p.id, p.categoryId, c.name AS categoryName, p.name, p.description, p.assetKey,
  p.priceRupiah, p.stock`;
const PRODUCT_FROM = 'products p JOIN categories c ON c.id = p.categoryId';

const ORDER_COLUMNS = `o.*, (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE orderId = o.id) AS itemCount`;

const str = (value: SqlValue) => (value === null ? '' : String(value));
const num = (value: SqlValue) => Number(value);

const toProduct = (row: Row): Product => ({
  id: str(row.id),
  categoryId: str(row.categoryId),
  categoryName: str(row.categoryName),
  name: str(row.name),
  description: str(row.description),
  assetKey: str(row.assetKey),
  priceRupiah: num(row.priceRupiah),
  stock: num(row.stock),
});

const toAddress = (row: Row): Address => ({
  id: str(row.id),
  recipient: str(row.recipient),
  phone: str(row.phone),
  addressText: str(row.addressText),
  createdAt: str(row.createdAt),
  updatedAt: str(row.updatedAt),
});

const toOrder = (row: Row): Order => ({
  id: str(row.id),
  number: num(row.number),
  operationId: str(row.operationId),
  status: row.status === 'cancelled' ? 'cancelled' : 'confirmed',
  createdAt: str(row.createdAt),
  cancelledAt: row.cancelledAt === null ? null : str(row.cancelledAt),
  addressSnapshot: {
    recipient: str(row.addressRecipient),
    phone: str(row.addressPhone),
    addressText: str(row.addressText),
  },
  subtotalRupiah: num(row.subtotalRupiah),
  shippingRupiah: num(row.shippingRupiah),
  totalRupiah: num(row.totalRupiah),
  itemCount: num(row.itemCount),
});

const toOrderItem = (row: Row): OrderItem => ({
  productId: str(row.productId),
  assetKey: str(row.assetKey),
  nameSnapshot: str(row.nameSnapshot),
  unitPriceRupiah: num(row.unitPriceRupiah),
  quantity: num(row.quantity),
  lineTotalRupiah: num(row.lineTotalRupiah),
});

const defaultId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const noFaults: FaultSource = {consume: () => false};

export function createRepository(driver: SqlDriver, options: RepositoryOptions = {}) {
  const faults = options.faults ?? noFaults;
  const now = () => (options.now ?? (() => new Date()))().toISOString();
  const createId = options.createId ?? defaultId;

  const query = async (sql: string, params: SqlValue[] = []) => {
    try {
      return (await driver.execute(sql, params)).rows;
    } catch {
      throw new ShopError('storage', 'Data tidak dapat dibaca. Silakan coba lagi.');
    }
  };

  /**
   * Runs a write batch. When a fault is armed for `target`, the fault statement is placed at
   * `faultAt` (default: last) so earlier writes really execute and are then rolled back.
   * Returns the DriverError for the caller to interpret; fault failures become storage errors.
   */
  const write = async (
    statements: Statement[],
    target: FaultTarget,
    failureMessage: string,
    faultAt = statements.length,
  ): Promise<DriverError | null> => {
    const batch = [...statements];
    const faultIndex = faults.consume(target) ? faultAt : -1;
    if (faultIndex >= 0) {
      batch.splice(faultIndex, 0, FAULT_STATEMENT);
    }
    try {
      await driver.executeBatch(batch);
      return null;
    } catch (error) {
      if (!(error instanceof DriverError) || error.index === faultIndex || error.code === 'SQL') {
        throw new ShopError('storage', failureMessage);
      }
      return error;
    }
  };

  /** Like `write`, but any failure is reported as a storage error. */
  const writeAll = async (statements: Statement[], target: FaultTarget, failureMessage: string) => {
    if (await write(statements, target, failureMessage)) {
      throw new ShopError('storage', failureMessage);
    }
  };

  const productById = async (productId: string) => {
    const rows = await query(`SELECT ${PRODUCT_COLUMNS} FROM ${PRODUCT_FROM} WHERE p.id = ?`, [productId]);
    if (!rows[0]) {
      throw new ShopError('not_found', 'Produk tidak ditemukan.');
    }
    return toProduct(rows[0]);
  };

  const cartQuantity = async (productId: string) => {
    const rows = await query('SELECT quantity FROM cart_items WHERE productId = ?', [productId]);
    return rows[0] ? num(rows[0].quantity) : 0;
  };

  const orderByOperation = async (operationId: string) => {
    const rows = await query('SELECT id FROM orders WHERE operationId = ?', [operationId]);
    return rows[0] ? getOrder(str(rows[0].id)) : null;
  };

  async function init(): Promise<void> {
    try {
      const versionRows = (await driver.execute('PRAGMA user_version')).rows;
      const version = num(versionRows[0]?.user_version ?? 0);
      if (!Number.isInteger(version) || version > SCHEMA_VERSION) {
        throw new ShopError(
          'migration',
          'Data di perangkat ini dibuat oleh versi RavaShop yang lebih baru. Perbarui aplikasi untuk membukanya.',
        );
      }
      for (let next = version + 1; next <= SCHEMA_VERSION; next++) {
        await driver.executeBatch(MIGRATIONS[next]);
      }
      await driver.execute('PRAGMA foreign_keys = ON');
      const seedRows = (await driver.execute(`SELECT value FROM metadata WHERE key = 'seedVersion'`)).rows;
      const seed = seedRows[0] ? str(seedRows[0].value) : null;
      if (seed === null) {
        await driver.executeBatch(seedStatements());
      } else if (seed !== SEED_VERSION) {
        throw new ShopError('migration', `Versi data contoh "${seed}" tidak dikenali.`);
      }
    } catch (error) {
      if (error instanceof ShopError) {
        throw error;
      }
      throw new ShopError('migration', 'Data RavaShop belum dapat dibuka. Data tidak dihapus.');
    }
  }

  async function getSeedVersion(): Promise<string> {
    const rows = await query(`SELECT value FROM metadata WHERE key = 'seedVersion'`);
    return rows[0] ? str(rows[0].value) : '';
  }

  // Catalog -----------------------------------------------------------------

  async function listCategories(): Promise<Category[]> {
    const rows = await query('SELECT id, name FROM categories ORDER BY sortOrder');
    return rows.map(row => ({id: str(row.id), name: str(row.name)}));
  }

  async function listProducts(catalog: CatalogQuery = {}): Promise<Product[]> {
    const order = SORT_SQL[catalog.sort ?? 'recommended'];
    const rows = catalog.categoryId
      ? await query(
          `SELECT ${PRODUCT_COLUMNS} FROM ${PRODUCT_FROM} WHERE p.categoryId = ? ORDER BY ${order}`,
          [catalog.categoryId],
        )
      : await query(`SELECT ${PRODUCT_COLUMNS} FROM ${PRODUCT_FROM} ORDER BY ${order}`);
    const search = (catalog.search ?? '').trim().toLowerCase();
    return rows.map(toProduct).filter(product => !search || product.name.toLowerCase().includes(search));
  }

  const getProduct = productById;

  // Wishlist ----------------------------------------------------------------

  async function listWishlist(): Promise<Product[]> {
    const rows = await query(
      `SELECT ${PRODUCT_COLUMNS} FROM wishlist w JOIN ${PRODUCT_FROM} AND p.id = w.productId
       ORDER BY w.createdAt DESC, p.sortOrder`,
    );
    return rows.map(toProduct);
  }

  async function wishlistIds(): Promise<Set<string>> {
    const rows = await query('SELECT productId FROM wishlist');
    return new Set(rows.map(row => str(row.productId)));
  }

  async function addToWishlist(productId: string): Promise<void> {
    await productById(productId);
    await writeAll(
      [
        {
          sql: 'INSERT OR IGNORE INTO wishlist (productId, createdAt) VALUES (?, ?)',
          params: [productId, now()],
        },
      ],
      'write',
      'Wishlist gagal disimpan. Data tidak berubah.',
    );
  }

  async function removeFromWishlist(productId: string): Promise<void> {
    await writeAll(
      [{sql: 'DELETE FROM wishlist WHERE productId = ?', params: [productId]}],
      'write',
      'Wishlist gagal disimpan. Data tidak berubah.',
    );
  }

  // Cart --------------------------------------------------------------------

  async function getCart(): Promise<CartLine[]> {
    const rows = await query(
      `SELECT ${PRODUCT_COLUMNS}, ci.quantity AS cartQuantity
       FROM cart_items ci JOIN ${PRODUCT_FROM} AND p.id = ci.productId
       ORDER BY ci.addedAt, p.sortOrder`,
    );
    return rows.map(row => ({product: toProduct(row), quantity: num(row.cartQuantity)}));
  }

  async function cartCount(): Promise<number> {
    const rows = await query('SELECT COALESCE(SUM(quantity), 0) AS count FROM cart_items');
    return num(rows[0]?.count ?? 0);
  }

  /** Writes a new cart quantity, guarded so a changed stock or line aborts the transaction. */
  async function writeCartQuantity(productId: string, current: number, next: number) {
    const statement: Statement =
      current === 0
        ? {
            sql: `INSERT INTO cart_items (productId, quantity, addedAt)
                  SELECT id, ?, ? FROM products WHERE id = ? AND stock >= ?`,
            params: [next, now(), productId, next],
            expectChanges: 1,
          }
        : {
            sql: `UPDATE cart_items SET quantity = ?
                  WHERE productId = ? AND quantity = ? AND (SELECT stock FROM products WHERE id = ?) >= ?`,
            params: [next, productId, current, productId, next],
            expectChanges: 1,
          };
    const failure = await write([statement], 'write', 'Keranjang gagal disimpan. Data tidak berubah.');
    if (failure) {
      throw new ShopError('stock', 'Stok atau keranjang berubah. Silakan coba lagi.');
    }
  }

  async function addToCart(productId: string, quantity = 1): Promise<void> {
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      throw new ShopError('validation', 'Jumlah harus bilangan bulat minimal 1.');
    }
    const product = await productById(productId);
    const current = await cartQuantity(productId);
    if (product.stock > 0 && current + quantity > product.stock) {
      throw new ShopError(
        'stock',
        `Stok tidak cukup. Keranjang sudah berisi ${current} dari ${product.stock}.`,
      );
    }
    validateQuantity(current + quantity, product.stock);
    await writeCartQuantity(productId, current, current + quantity);
  }

  async function setCartQuantity(productId: string, quantity: number): Promise<void> {
    const product = await productById(productId);
    const current = await cartQuantity(productId);
    if (current === 0) {
      throw new ShopError('not_found', 'Produk tidak ada di keranjang.');
    }
    validateQuantity(quantity, product.stock);
    if (quantity !== current) {
      await writeCartQuantity(productId, current, quantity);
    }
  }

  async function removeFromCart(productId: string): Promise<void> {
    await writeAll(
      [{sql: 'DELETE FROM cart_items WHERE productId = ?', params: [productId]}],
      'write',
      'Keranjang gagal disimpan. Data tidak berubah.',
    );
  }

  // Addresses ---------------------------------------------------------------

  async function listAddresses(): Promise<Address[]> {
    const rows = await query('SELECT * FROM addresses ORDER BY updatedAt DESC, createdAt DESC, id DESC');
    return rows.map(toAddress);
  }

  async function getAddress(id: string): Promise<Address> {
    const rows = await query('SELECT * FROM addresses WHERE id = ?', [id]);
    if (!rows[0]) {
      throw new ShopError('not_found', 'Alamat tidak ditemukan.');
    }
    return toAddress(rows[0]);
  }

  async function saveAddress(input: AddressInput, id?: string): Promise<Address> {
    const value = requireValidAddress(input);
    const timestamp = now();
    const addressId = id ?? createId('addr');
    const statement: Statement = id
      ? {
          sql: 'UPDATE addresses SET recipient = ?, phone = ?, addressText = ?, updatedAt = ? WHERE id = ?',
          params: [value.recipient, value.phone, value.addressText, timestamp, id],
          expectChanges: 1,
        }
      : {
          sql: `INSERT INTO addresses (id, recipient, phone, addressText, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?)`,
          params: [addressId, value.recipient, value.phone, value.addressText, timestamp, timestamp],
          expectChanges: 1,
        };
    const failure = await write([statement], 'write', 'Alamat gagal disimpan. Data tidak berubah.');
    if (failure) {
      throw new ShopError('not_found', 'Alamat tidak ditemukan.');
    }
    return getAddress(addressId);
  }

  async function deleteAddress(id: string): Promise<void> {
    const failure = await write(
      [{sql: 'DELETE FROM addresses WHERE id = ?', params: [id], expectChanges: 1}],
      'write',
      'Alamat gagal dihapus. Data tidak berubah.',
    );
    if (failure) {
      throw new ShopError('not_found', 'Alamat tidak ditemukan.');
    }
  }

  // Checkout & orders ---------------------------------------------------------

  async function checkout(operationId: string, addressId: string | null): Promise<OrderDetail> {
    if (!operationId) {
      throw new ShopError('validation', 'Operasi checkout tidak valid.');
    }
    const existing = await orderByOperation(operationId);
    if (existing) {
      return existing;
    }
    const lines = await getCart();
    if (lines.length === 0) {
      throw new ShopError('validation', 'Keranjang masih kosong.');
    }
    if (!addressId) {
      throw new ShopError('validation', 'Pilih alamat pengiriman terlebih dahulu.');
    }
    const addressRows = await query('SELECT * FROM addresses WHERE id = ?', [addressId]);
    if (!addressRows[0]) {
      throw new ShopError('validation', 'Alamat tidak lagi tersedia. Pilih alamat lain.');
    }
    const address = toAddress(addressRows[0]);
    if (Object.keys(validateAddress(address)).length > 0) {
      throw new ShopError('validation', 'Alamat tidak lengkap. Ubah alamat terlebih dahulu.');
    }
    for (const line of lines) {
      if (line.quantity > line.product.stock) {
        throw new ShopError(
          'stock',
          line.product.stock === 0
            ? `${line.product.name} sudah habis. Hapus dari keranjang untuk melanjutkan.`
            : `Stok ${line.product.name} tinggal ${line.product.stock}. Ubah jumlah di keranjang.`,
        );
      }
      validateQuantity(line.quantity, line.product.stock);
    }
    const priced = lines.map(line => ({unitPriceRupiah: line.product.priceRupiah, quantity: line.quantity}));
    const totals = computeTotals(priced);
    const numberRows = await query('SELECT COALESCE(MAX(number), 0) + 1 AS next FROM orders');
    const orderId = createId('order');
    const createdAt = now();

    const statements: Statement[] = [
      {
        sql: `INSERT INTO orders (id, number, operationId, status, createdAt, cancelledAt, addressRecipient,
                addressPhone, addressText, subtotalRupiah, shippingRupiah, totalRupiah)
              VALUES (?, ?, ?, 'confirmed', ?, NULL, ?, ?, ?, ?, ?, ?)`,
        params: [
          orderId,
          num(numberRows[0].next),
          operationId,
          createdAt,
          address.recipient,
          address.phone,
          address.addressText,
          totals.subtotalRupiah,
          totals.shippingRupiah,
          totals.totalRupiah,
        ],
        expectChanges: 1,
      },
      ...lines.map(line => ({
        sql: `INSERT INTO order_items (orderId, productId, nameSnapshot, assetKey, unitPriceRupiah, quantity,
                lineTotalRupiah)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        params: [
          orderId,
          line.product.id,
          line.product.name,
          line.product.assetKey,
          line.product.priceRupiah,
          line.quantity,
          lineTotal({unitPriceRupiah: line.product.priceRupiah, quantity: line.quantity}),
        ],
        expectChanges: 1,
      })),
      ...lines.map(line => ({
        sql: 'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ? AND priceRupiah = ?',
        params: [line.quantity, line.product.id, line.quantity, line.product.priceRupiah],
        expectChanges: 1,
      })),
    ];
    // A storage fault lands here: order, items, and stock are already written in the transaction.
    const faultAt = statements.length;
    statements.push(
      ...lines.map(line => ({
        sql: 'DELETE FROM cart_items WHERE productId = ? AND quantity = ?',
        params: [line.product.id, line.quantity],
        expectChanges: 1,
      })),
      {sql: 'DELETE FROM cart_items', expectChanges: 0},
    );

    const failure = await write(
      statements,
      'checkout',
      'Pesanan gagal dibuat. Keranjang dan stok tidak berubah. Silakan coba lagi.',
      faultAt,
    );
    if (failure) {
      const replay = await orderByOperation(operationId);
      if (replay) {
        return replay;
      }
      if (failure.code === 'EXPECT') {
        throw new ShopError('stock', 'Stok atau keranjang berubah. Periksa keranjang lalu coba lagi.');
      }
      throw new ShopError(
        'storage',
        'Pesanan gagal dibuat. Keranjang dan stok tidak berubah. Silakan coba lagi.',
      );
    }
    return getOrder(orderId);
  }

  async function listOrders(): Promise<Order[]> {
    const rows = await query(`SELECT ${ORDER_COLUMNS} FROM orders o ORDER BY o.number DESC`);
    return rows.map(toOrder);
  }

  async function getOrder(orderId: string): Promise<OrderDetail> {
    const rows = await query(`SELECT ${ORDER_COLUMNS} FROM orders o WHERE o.id = ?`, [orderId]);
    if (!rows[0]) {
      throw new ShopError('not_found', 'Pesanan tidak ditemukan.');
    }
    const items = await query('SELECT * FROM order_items WHERE orderId = ? ORDER BY rowid', [orderId]);
    return {...toOrder(rows[0]), items: items.map(toOrderItem)};
  }

  /** Cancels a confirmed order and returns its stock exactly once. Repeating is a no-op. */
  async function cancelOrder(orderId: string): Promise<OrderDetail> {
    const order = await getOrder(orderId);
    if (order.status === 'cancelled') {
      return order;
    }
    const failure = await write(
      [
        {
          sql: `UPDATE orders SET status = 'cancelled', cancelledAt = ? WHERE id = ? AND status = 'confirmed'`,
          params: [now(), orderId],
          expectChanges: 1,
        },
        ...order.items.map(item => ({
          sql: 'UPDATE products SET stock = stock + ? WHERE id = ?',
          params: [item.quantity, item.productId],
          expectChanges: 1,
        })),
      ],
      'write',
      'Pesanan gagal dibatalkan. Status dan stok tidak berubah.',
    );
    if (failure && failure.index !== 0) {
      throw new ShopError('storage', 'Pesanan gagal dibatalkan. Status dan stok tidak berubah.');
    }
    return getOrder(orderId);
  }

  // Reset -------------------------------------------------------------------

  async function resetDemo(): Promise<void> {
    await writeAll(
      [
        {sql: 'DELETE FROM order_items'},
        {sql: 'DELETE FROM orders'},
        {sql: 'DELETE FROM cart_items'},
        {sql: 'DELETE FROM wishlist'},
        {sql: 'DELETE FROM addresses'},
        {sql: 'DELETE FROM products'},
        {sql: 'DELETE FROM categories'},
        {sql: `DELETE FROM metadata WHERE key = 'seedVersion'`},
        ...seedStatements(),
      ],
      'write',
      'Reset gagal. Data tidak berubah.',
    );
  }

  return {
    init,
    getSeedVersion,
    listCategories,
    listProducts,
    getProduct,
    listWishlist,
    wishlistIds,
    addToWishlist,
    removeFromWishlist,
    getCart,
    cartCount,
    addToCart,
    setCartQuantity,
    removeFromCart,
    listAddresses,
    getAddress,
    saveAddress,
    deleteAddress,
    checkout,
    listOrders,
    getOrder,
    cancelOrder,
    resetDemo,
  };
}

export type Repository = ReturnType<typeof createRepository>;
