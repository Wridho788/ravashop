/**
 * @jest-environment node
 *
 * Integration tests against real SQLite (node:sqlite) with the same driver contract as the
 * Android native module.
 */
import {mkdtempSync, rmSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';
import {FaultSource, FaultTarget, createRepository} from '../src/data/repository';
import {createNodeDriver} from './helpers/nodeDriver';

const ADDRESS = {
  recipient: 'Pengguna Demo',
  phone: '081234567890',
  addressText: 'Jalan Contoh 10, Kota Demo',
};

function armedFaults() {
  const armed = new Set<FaultTarget>();
  const source: FaultSource = {consume: target => armed.delete(target)};
  return {source, arm: (target: FaultTarget) => armed.add(target)};
}

async function setup() {
  const driver = createNodeDriver();
  const faults = armedFaults();
  let clock = Date.parse('2026-10-05T08:00:00.000Z');
  let ids = 0;
  const repo = createRepository(driver, {
    faults: faults.source,
    now: () => new Date((clock += 1000)),
    createId: prefix => `${prefix}-${++ids}`,
  });
  await repo.init();
  return {driver, repo, faults};
}

type Repo = Awaited<ReturnType<typeof setup>>['repo'];

const stockOf = async (repo: Repo, id: string) => (await repo.getProduct(id)).stock;

async function prepareReferenceCheckout(repo: Repo) {
  await repo.addToCart('product-bag');
  await repo.addToCart('product-bag');
  await repo.addToCart('product-bottle');
  return repo.saveAddress(ADDRESS);
}

describe('init and seed', () => {
  it('seeds shop-v1 once with the reference products', async () => {
    const {repo} = await setup();
    expect(await repo.getSeedVersion()).toBe('shop-v1');
    const products = await repo.listProducts();
    expect(products).toHaveLength(10);
    expect(products.slice(0, 3).map(p => [p.id, p.priceRupiah, p.stock])).toEqual([
      ['product-bag', 250000, 3],
      ['product-bottle', 100000, 5],
      ['product-sold-out', 175000, 0],
    ]);
    expect(await repo.getCart()).toEqual([]);
    expect(await repo.listWishlist()).toEqual([]);
    expect(await repo.listAddresses()).toEqual([]);
    expect(await repo.listOrders()).toEqual([]);
  });

  it('keeps data when the database file is reopened', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ravashop-'));
    const file = join(dir, 'shop.db');
    try {
      const first = createNodeDriver(file);
      const repo = createRepository(first);
      await repo.init();
      await prepareReferenceCheckout(repo);
      await repo.addToWishlist('product-bag');
      const address = (await repo.listAddresses())[0];
      const order = await repo.checkout('op-persist', address.id);
      await repo.addToCart('product-tote');
      first.close();

      const second = createNodeDriver(file);
      const reopened = createRepository(second);
      await reopened.init();
      expect(await stockOf(reopened, 'product-bag')).toBe(1);
      expect((await reopened.listOrders()).map(o => o.id)).toEqual([order.id]);
      expect((await reopened.listWishlist()).map(p => p.id)).toEqual(['product-bag']);
      expect((await reopened.getCart()).map(l => [l.product.id, l.quantity])).toEqual([['product-tote', 1]]);
      expect(await reopened.listAddresses()).toHaveLength(1);
      second.close();
    } finally {
      rmSync(dir, {recursive: true, force: true});
    }
  });

  it('refuses a database from a newer schema without touching it', async () => {
    const {driver} = await setup();
    await driver.execute('PRAGMA user_version = 99');
    const repo = createRepository(driver);
    await expect(repo.init()).rejects.toMatchObject({kind: 'migration'});
    expect((await driver.execute('SELECT COUNT(*) AS n FROM products')).rows[0].n).toBe(10);
  });

  it('refuses an unknown seed version instead of reseeding', async () => {
    const {driver} = await setup();
    await driver.execute(`UPDATE metadata SET value = 'shop-v9' WHERE key = 'seedVersion'`);
    await expect(createRepository(driver).init()).rejects.toMatchObject({kind: 'migration'});
  });
});

describe('catalog', () => {
  it('searches by name case-insensitively', async () => {
    const {repo} = await setup();
    expect((await repo.listProducts({search: 'RANSEL'})).map(p => p.id)).toEqual(['product-bag']);
    expect(await repo.listProducts({search: 'tidak ada produk ini'})).toEqual([]);
  });

  it('filters by category and sorts by price', async () => {
    const {repo} = await setup();
    const bags = await repo.listProducts({categoryId: 'cat-bag', sort: 'price-asc'});
    expect(bags.map(p => p.id)).toEqual(['product-tote', 'product-bag']);
    const desc = await repo.listProducts({sort: 'price-desc'});
    expect(desc[0].id).toBe('product-headphone');
    expect(desc[desc.length - 1].id).toBe('product-bottle');
    expect((await repo.listCategories()).map(c => c.name)).toEqual([
      'Tas',
      'Botol & Tumbler',
      'Sepatu',
      'Audio',
      'Aksesori',
    ]);
  });
});

describe('wishlist', () => {
  it('adds without duplicates and removes', async () => {
    const {repo} = await setup();
    await repo.addToWishlist('product-bag');
    await repo.addToWishlist('product-bag');
    await repo.addToWishlist('product-sold-out');
    expect((await repo.listWishlist()).map(p => p.id).sort()).toEqual(['product-bag', 'product-sold-out']);
    await repo.removeFromWishlist('product-bag');
    expect((await repo.listWishlist()).map(p => p.id)).toEqual(['product-sold-out']);
  });
});

describe('cart', () => {
  it('merges the same product into one line and updates quantity', async () => {
    const {repo} = await setup();
    await repo.addToCart('product-bag');
    await repo.addToCart('product-bag');
    expect((await repo.getCart()).map(l => [l.product.id, l.quantity])).toEqual([['product-bag', 2]]);
    await repo.setCartQuantity('product-bag', 3);
    expect((await repo.getCart())[0].quantity).toBe(3);
    expect(await repo.cartCount()).toBe(3);
    await repo.removeFromCart('product-bag');
    expect(await repo.getCart()).toEqual([]);
  });

  it('rejects zero, fractions, above stock, and sold-out products without changing data', async () => {
    const {repo} = await setup();
    await repo.addToCart('product-bag', 2);
    await expect(repo.setCartQuantity('product-bag', 4)).rejects.toMatchObject({kind: 'stock'});
    await expect(repo.setCartQuantity('product-bag', 0)).rejects.toMatchObject({kind: 'validation'});
    await expect(repo.setCartQuantity('product-bag', 1.5)).rejects.toMatchObject({kind: 'validation'});
    await expect(repo.addToCart('product-bag', 2)).rejects.toMatchObject({kind: 'stock'});
    await expect(repo.addToCart('product-sold-out')).rejects.toMatchObject({kind: 'stock'});
    await expect(repo.addToCart('product-bag', 0)).rejects.toMatchObject({kind: 'validation'});
    expect((await repo.getCart()).map(l => [l.product.id, l.quantity])).toEqual([['product-bag', 2]]);
  });

  it('enforces quantity > 0 at the database level too', async () => {
    const {driver} = await setup();
    await expect(
      driver.execute(`INSERT INTO cart_items (productId, quantity, addedAt) VALUES ('product-bag', 0, 'x')`),
    ).rejects.toMatchObject({code: 'CONSTRAINT'});
  });
});

describe('addresses', () => {
  it('supports create, read, update, delete with validation', async () => {
    const {repo} = await setup();
    await expect(repo.saveAddress({recipient: '', phone: '', addressText: ''})).rejects.toMatchObject({
      kind: 'validation',
      fieldErrors: {
        recipient: expect.any(String),
        phone: expect.any(String),
        addressText: expect.any(String),
      },
    });
    const created = await repo.saveAddress({...ADDRESS, recipient: '  Pengguna Demo  '});
    expect(created.recipient).toBe('Pengguna Demo');
    const updated = await repo.saveAddress(
      {...ADDRESS, addressText: 'Jalan Contoh 20, Kota Demo'},
      created.id,
    );
    expect((await repo.getAddress(created.id)).addressText).toBe('Jalan Contoh 20, Kota Demo');
    expect(updated.id).toBe(created.id);
    await repo.deleteAddress(created.id);
    expect(await repo.listAddresses()).toEqual([]);
    await expect(repo.deleteAddress(created.id)).rejects.toMatchObject({kind: 'not_found'});
  });

  it('lists the most recently saved address first', async () => {
    const {repo} = await setup();
    const a = await repo.saveAddress(ADDRESS);
    const b = await repo.saveAddress({...ADDRESS, recipient: 'Penerima Kedua'});
    expect((await repo.listAddresses()).map(x => x.id)).toEqual([b.id, a.id]);
    await repo.saveAddress(ADDRESS, a.id);
    expect((await repo.listAddresses()).map(x => x.id)).toEqual([a.id, b.id]);
  });
});

describe('checkout', () => {
  it('creates exactly one order with the reference totals, reduces stock, and empties the cart', async () => {
    const {repo} = await setup();
    const address = await prepareReferenceCheckout(repo);
    const order = await repo.checkout('op-1', address.id);
    expect(order).toMatchObject({
      number: 1,
      status: 'confirmed',
      subtotalRupiah: 600000,
      shippingRupiah: 15000,
      totalRupiah: 615000,
      itemCount: 3,
      addressSnapshot: ADDRESS,
    });
    expect(order.items.map(i => [i.productId, i.unitPriceRupiah, i.quantity, i.lineTotalRupiah])).toEqual([
      ['product-bag', 250000, 2, 500000],
      ['product-bottle', 100000, 1, 100000],
    ]);
    expect(await stockOf(repo, 'product-bag')).toBe(1);
    expect(await stockOf(repo, 'product-bottle')).toBe(4);
    expect(await repo.getCart()).toEqual([]);
    expect(await repo.listOrders()).toHaveLength(1);
  });

  it('rejects an empty cart and a missing or deleted address without changes', async () => {
    const {repo} = await setup();
    const address = await repo.saveAddress(ADDRESS);
    await expect(repo.checkout('op-empty', address.id)).rejects.toMatchObject({kind: 'validation'});
    await repo.addToCart('product-bag');
    await expect(repo.checkout('op-none', null)).rejects.toMatchObject({kind: 'validation'});
    await repo.deleteAddress(address.id);
    await expect(repo.checkout('op-deleted', address.id)).rejects.toMatchObject({kind: 'validation'});
    expect(await repo.listOrders()).toEqual([]);
    expect(await stockOf(repo, 'product-bag')).toBe(3);
    expect(await repo.cartCount()).toBe(1);
  });

  it('is idempotent for the same operation ID, sequentially and concurrently', async () => {
    const {repo} = await setup();
    const address = await prepareReferenceCheckout(repo);
    const [a, b] = await Promise.all([
      repo.checkout('op-dup', address.id),
      repo.checkout('op-dup', address.id),
    ]);
    const c = await repo.checkout('op-dup', address.id);
    expect(new Set([a.id, b.id, c.id]).size).toBe(1);
    expect(await repo.listOrders()).toHaveLength(1);
    expect(await stockOf(repo, 'product-bag')).toBe(1);
    expect(await stockOf(repo, 'product-bottle')).toBe(4);
  });

  it('rolls back everything when storage fails mid-transaction, then a retry succeeds once', async () => {
    const {repo, faults} = await setup();
    const address = await prepareReferenceCheckout(repo);
    faults.arm('checkout');
    await expect(repo.checkout('op-fault', address.id)).rejects.toMatchObject({kind: 'storage'});
    expect(await repo.listOrders()).toEqual([]);
    expect(await stockOf(repo, 'product-bag')).toBe(3);
    expect(await stockOf(repo, 'product-bottle')).toBe(5);
    expect((await repo.getCart()).map(l => [l.product.id, l.quantity])).toEqual([
      ['product-bag', 2],
      ['product-bottle', 1],
    ]);

    const order = await repo.checkout('op-fault', address.id);
    expect(order.totalRupiah).toBe(615000);
    expect(await repo.listOrders()).toHaveLength(1);
    expect(await stockOf(repo, 'product-bag')).toBe(1);
  });

  it.each([0, 1, 3, 4, 6])('rolls back when the driver fails at statement %i', async index => {
    const {repo, driver} = await setup();
    const address = await prepareReferenceCheckout(repo);
    driver.failNextBatch(index);
    await expect(repo.checkout('op-io', address.id)).rejects.toMatchObject({kind: 'storage'});
    expect(await repo.listOrders()).toEqual([]);
    expect(await stockOf(repo, 'product-bag')).toBe(3);
    expect(await repo.cartCount()).toBe(3);
  });

  it('rejects a cart line that exceeds the current stock', async () => {
    const {repo, driver} = await setup();
    const address = await prepareReferenceCheckout(repo);
    await driver.execute(`UPDATE products SET stock = 1 WHERE id = 'product-bag'`);
    await expect(repo.checkout('op-stock', address.id)).rejects.toMatchObject({kind: 'stock'});
    expect(await repo.listOrders()).toEqual([]);
    expect(await repo.cartCount()).toBe(3);
  });

  it('keeps the order snapshot when the address and products change later', async () => {
    const {repo, driver} = await setup();
    const address = await prepareReferenceCheckout(repo);
    const order = await repo.checkout('op-snap', address.id);
    await repo.saveAddress({...ADDRESS, recipient: 'Nama Baru'}, address.id);
    await repo.deleteAddress(address.id);
    await driver.execute(`UPDATE products SET priceRupiah = 999000 WHERE id = 'product-bag'`);
    const again = await repo.getOrder(order.id);
    expect(again.addressSnapshot).toEqual(ADDRESS);
    expect(again.items[0].unitPriceRupiah).toBe(250000);
    expect(again.totalRupiah).toBe(615000);
  });
});

describe('orders', () => {
  it('cancels once and returns stock exactly once', async () => {
    const {repo} = await setup();
    const address = await prepareReferenceCheckout(repo);
    const order = await repo.checkout('op-cancel', address.id);
    const cancelled = await repo.cancelOrder(order.id);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancelledAt).not.toBeNull();
    await repo.cancelOrder(order.id);
    await Promise.all([repo.cancelOrder(order.id), repo.cancelOrder(order.id)]);
    expect(await stockOf(repo, 'product-bag')).toBe(3);
    expect(await stockOf(repo, 'product-bottle')).toBe(5);
    expect(await repo.listOrders()).toHaveLength(1);
  });

  it('returns stock once even when two cancels race', async () => {
    const {repo} = await setup();
    const address = await prepareReferenceCheckout(repo);
    const order = await repo.checkout('op-race', address.id);
    await Promise.all([repo.cancelOrder(order.id), repo.cancelOrder(order.id)]);
    expect(await stockOf(repo, 'product-bag')).toBe(3);
  });

  it('enforces the confirmed/cancelled status set in the schema', async () => {
    const {driver} = await setup();
    await expect(
      driver.execute(`INSERT INTO orders (id, number, operationId, status, createdAt, addressRecipient, addressPhone,
        addressText, subtotalRupiah, shippingRupiah, totalRupiah)
        VALUES ('x', 1, 'op', 'shipped', 'now', 'a', 'b', 'c', 1, 0, 1)`),
    ).rejects.toMatchObject({code: 'CONSTRAINT'});
  });
});

describe('storage faults and reset', () => {
  it('leaves address and cart data unchanged when a write fails', async () => {
    const {repo, faults} = await setup();
    const address = await repo.saveAddress(ADDRESS);
    await repo.addToCart('product-bag');
    faults.arm('write');
    await expect(repo.saveAddress({...ADDRESS, recipient: 'Gagal Simpan'}, address.id)).rejects.toMatchObject(
      {
        kind: 'storage',
      },
    );
    faults.arm('write');
    await expect(repo.addToCart('product-bag')).rejects.toMatchObject({kind: 'storage'});
    faults.arm('write');
    await expect(repo.saveAddress({...ADDRESS, recipient: 'Alamat Baru'})).rejects.toMatchObject({
      kind: 'storage',
    });
    expect((await repo.listAddresses()).map(a => a.recipient)).toEqual(['Pengguna Demo']);
    expect(await repo.cartCount()).toBe(1);
  });

  it('restores the fixture exactly once on reset', async () => {
    const {repo} = await setup();
    const address = await prepareReferenceCheckout(repo);
    await repo.checkout('op-reset', address.id);
    await repo.addToWishlist('product-watch');
    await repo.addToCart('product-tote');
    await repo.resetDemo();
    await repo.resetDemo();
    expect(await repo.listProducts()).toHaveLength(10);
    expect(await stockOf(repo, 'product-bag')).toBe(3);
    expect(await repo.listOrders()).toEqual([]);
    expect(await repo.getCart()).toEqual([]);
    expect(await repo.listWishlist()).toEqual([]);
    expect(await repo.listAddresses()).toEqual([]);
    expect(await repo.getSeedVersion()).toBe('shop-v1');
  });
});
