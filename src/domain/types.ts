export type Category = {id: string; name: string};

export type Product = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  assetKey: string;
  priceRupiah: number;
  stock: number;
};

export type ProductSort = 'recommended' | 'price-asc' | 'price-desc';

export type CatalogQuery = {
  search?: string;
  categoryId?: string | null;
  sort?: ProductSort;
};

export type CartLine = {product: Product; quantity: number};

export type AddressInput = {recipient: string; phone: string; addressText: string};

export type Address = AddressInput & {id: string; createdAt: string; updatedAt: string};

export type OrderStatus = 'confirmed' | 'cancelled';

export type OrderItem = {
  productId: string;
  assetKey: string;
  nameSnapshot: string;
  unitPriceRupiah: number;
  quantity: number;
  lineTotalRupiah: number;
};

export type Order = {
  id: string;
  number: number;
  operationId: string;
  status: OrderStatus;
  createdAt: string;
  cancelledAt: string | null;
  addressSnapshot: AddressInput;
  subtotalRupiah: number;
  shippingRupiah: number;
  totalRupiah: number;
  itemCount: number;
};

export type OrderDetail = Order & {items: OrderItem[]};

export type Totals = {subtotalRupiah: number; shippingRupiah: number; totalRupiah: number};
