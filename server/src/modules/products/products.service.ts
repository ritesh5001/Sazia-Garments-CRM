import { Types } from 'mongoose';
import { Product, type IProductDocument } from '../../models/Product.js';
import { StockMovement } from '../../models/StockMovement.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  paginate,
  searchFilter,
  type ListParams,
  type ListResult,
} from '../../utils/paginate.js';
import type { MovementInput, ProductInput, ProductUpdateInput } from './products.validators.js';

export async function listProducts(params: ListParams): Promise<ListResult<IProductDocument>> {
  const filter = searchFilter<IProductDocument>(params.search, ['name', 'sku', 'category']);
  return paginate(Product, params, filter);
}

export async function getProduct(id: string) {
  const product = await Product.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

export async function createProduct(input: ProductInput, userId: string) {
  const { openingStock, ...rest } = input;
  const product = await Product.create({ ...rest, currentStock: 0 });

  if (openingStock && openingStock > 0) {
    await applyMovement(
      product.id,
      { type: 'inward', quantity: openingStock, rate: rest.costPrice, note: 'Opening stock' },
      userId
    );
    return getProduct(product.id);
  }
  return product;
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  const product = await Product.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!product) throw ApiError.notFound('Product not found');
  return product;
}

export async function deleteProduct(id: string) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw ApiError.notFound('Product not found');
  await StockMovement.deleteMany({ product: id });
  return product;
}

/**
 * Apply a stock movement and adjust currentStock atomically (guards against
 * negative stock). Returns the created movement.
 */
export async function applyMovement(productId: string, input: MovementInput, userId: string) {
  const magnitude = Math.abs(input.quantity);
  const delta =
    input.type === 'inward'
      ? magnitude
      : input.type === 'outward'
        ? -magnitude
        : input.quantity; // adjustment: use signed value as-is

  const filter: Record<string, unknown> = { _id: productId };
  if (delta < 0) filter.currentStock = { $gte: -delta };

  const product = await Product.findOneAndUpdate(
    filter,
    { $inc: { currentStock: delta } },
    { new: true }
  );

  if (!product) {
    const exists = await Product.exists({ _id: productId });
    if (!exists) throw ApiError.notFound('Product not found');
    throw ApiError.badRequest('Insufficient stock for this movement');
  }

  const movement = await StockMovement.create({
    product: new Types.ObjectId(productId),
    type: input.type,
    quantity: delta,
    rate: input.rate ?? 0,
    balanceAfter: product.currentStock,
    note: input.note,
    reference: input.reference,
    createdBy: new Types.ObjectId(userId),
  });

  return movement;
}

export async function listMovements(productId: string, params: ListParams) {
  await getProduct(productId);
  return paginate(StockMovement, { ...params, sort: '-createdAt' }, { product: productId });
}

export async function inventoryReport() {
  const products = await Product.find({ isActive: true }).select('-__v').lean();

  let totalValue = 0;
  let totalCost = 0;
  const lowStock: typeof products = [];

  for (const p of products) {
    totalValue += p.currentStock * p.sellingPrice;
    totalCost += p.currentStock * p.costPrice;
    if (p.currentStock <= p.reorderLevel) lowStock.push(p);
  }

  return {
    totalProducts: products.length,
    totalUnits: products.reduce((s, p) => s + p.currentStock, 0),
    inventoryValueAtCost: totalCost,
    inventoryValueAtSelling: totalValue,
    lowStockCount: lowStock.length,
    lowStock,
  };
}
