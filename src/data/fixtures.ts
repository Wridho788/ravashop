import {Category} from '../domain/types';

export const SEED_VERSION = 'shop-v1';

export type ProductSeed = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  priceRupiah: number;
  stock: number;
};

export const CATEGORIES: Category[] = [
  {id: 'cat-bag', name: 'Tas'},
  {id: 'cat-drink', name: 'Botol & Tumbler'},
  {id: 'cat-shoes', name: 'Sepatu'},
  {id: 'cat-audio', name: 'Audio'},
  {id: 'cat-accessory', name: 'Aksesori'},
];

/** Fixture `shop-v1` (docs/TRD.md). The first three products are the E2E reference items. */
export const PRODUCTS: ProductSeed[] = [
  {
    id: 'product-bag',
    categoryId: 'cat-bag',
    name: 'Tas Ransel Kanvas',
    description:
      'Ransel kanvas tebal dengan kompartemen laptop 14 inci, saku depan beritsleting, dan tali bahu empuk untuk dipakai harian.',
    priceRupiah: 250000,
    stock: 3,
  },
  {
    id: 'product-bottle',
    categoryId: 'cat-drink',
    name: 'Botol Minum Baja 750 ml',
    description:
      'Botol baja tahan karat berdinding ganda yang menjaga minuman tetap dingin hingga 24 jam. Tutup ulir anti bocor.',
    priceRupiah: 100000,
    stock: 5,
  },
  {
    id: 'product-sold-out',
    categoryId: 'cat-accessory',
    name: 'Topi Bucket Edisi Terbatas',
    description: 'Topi bucket katun dengan pinggiran lebar. Edisi terbatas yang saat ini sedang habis.',
    priceRupiah: 175000,
    stock: 0,
  },
  {
    id: 'product-tote',
    categoryId: 'cat-bag',
    name: 'Tote Bag Serbaguna',
    description: 'Tote bag kanvas ringan dengan saku dalam. Cukup untuk belanja mingguan atau membawa buku.',
    priceRupiah: 180000,
    stock: 8,
  },
  {
    id: 'product-sneakers',
    categoryId: 'cat-shoes',
    name: 'Sepatu Lari Ringan',
    description: 'Sepatu lari dengan upper rajut yang bernapas dan sol busa responsif untuk lari harian.',
    priceRupiah: 650000,
    stock: 4,
  },
  {
    id: 'product-sandal',
    categoryId: 'cat-shoes',
    name: 'Sandal Kasual Busa',
    description: 'Sandal busa empuk dengan dua tali, ringan dan cepat kering.',
    priceRupiah: 120000,
    stock: 10,
  },
  {
    id: 'product-headphone',
    categoryId: 'cat-audio',
    name: 'Headphone Nirkabel',
    description: 'Headphone over-ear nirkabel dengan bantalan lembut dan baterai hingga 30 jam pemakaian.',
    priceRupiah: 850000,
    stock: 2,
  },
  {
    id: 'product-earbuds',
    categoryId: 'cat-audio',
    name: 'Earbuds Mini',
    description: 'Earbuds ringkas dengan casing pengisi daya saku dan mode transparansi.',
    priceRupiah: 320000,
    stock: 6,
  },
  {
    id: 'product-tumbler',
    categoryId: 'cat-drink',
    name: 'Tumbler Kopi 450 ml',
    description: 'Tumbler dengan tutup geser untuk kopi atau teh hangat di perjalanan.',
    priceRupiah: 135000,
    stock: 7,
  },
  {
    id: 'product-watch',
    categoryId: 'cat-accessory',
    name: 'Jam Tangan Minimalis',
    description: 'Jam tangan analog dengan wajah bersih dan tali kulit sintetis berwarna gelap.',
    priceRupiah: 450000,
    stock: 3,
  },
];
