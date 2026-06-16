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

export type InvoiceStatus = 'pending' | 'partial' | 'paid';

export interface InvoiceLineItem {
  product?: string | { _id: string; name: string; sku?: string; unit?: string };
  description: string;
  quantity: number;
  rate: number; // paise per unit
  gstRate: number; // percent
  taxableValue: number;
  gstAmount: number;
  lineTotal: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  customer: string | Pick<Customer, '_id' | 'name' | 'phone' | 'gstin'>;
  date: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Purchases share the line-item and status shape with invoices.
export type PurchaseStatus = InvoiceStatus;
export type PurchaseLineItem = InvoiceLineItem;

export interface Purchase {
  _id: string;
  purchaseNumber: string;
  vendor: string | Pick<Vendor, '_id' | 'name' | 'phone' | 'gstin'>;
  vendorInvoiceNumber?: string;
  date: string;
  lineItems: PurchaseLineItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  amountPaid: number;
  status: PurchaseStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
