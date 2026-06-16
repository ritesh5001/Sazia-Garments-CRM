export type UserRole = 'admin' | 'staff';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  openingBalance: number; // paise
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  openingBalance: number; // paise
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductUnit = 'meter' | 'piece' | 'kg' | 'roll' | 'dozen' | 'set';

export interface Product {
  _id: string;
  name: string;
  sku?: string;
  category?: string;
  unit: ProductUnit;
  reorderLevel: number;
  costPrice: number; // paise per unit
  sellingPrice: number; // paise per unit
  currentStock: number;
  gstRate: number; // percent
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'inward' | 'outward' | 'adjustment';

export interface StockMovement {
  _id: string;
  product: string;
  type: MovementType;
  quantity: number; // signed delta applied
  rate: number; // paise per unit
  balanceAfter: number;
  note?: string;
  reference?: string;
  createdBy: string;
  createdAt: string;
}

export interface InventoryReport {
  totalProducts: number;
  totalUnits: number;
  inventoryValueAtCost: number;
  inventoryValueAtSelling: number;
  lowStockCount: number;
  lowStock: Product[];
}
