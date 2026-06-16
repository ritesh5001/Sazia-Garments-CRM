import api from './client';

export interface ReportResult<TRow, TSummary> {
  rows: TRow[];
  summary: TSummary;
}

export interface DocReportRow {
  reference: string;
  date: string;
  party: string;
  subtotal: number;
  gst: number;
  total: number;
  paid: number;
  balance: number;
  status: string;
}
export interface DocReportSummary {
  count: number;
  subtotal: number;
  gst: number;
  total: number;
  paid: number;
  balance: number;
}

export interface PaymentReportRow {
  reference: string;
  date: string;
  direction: 'incoming' | 'outgoing';
  party: string;
  mode: string;
  note: string;
  amount: number;
}
export interface PaymentReportSummary {
  count: number;
  incoming: number;
  outgoing: number;
}

export interface InventoryReportRow {
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  costPrice: number;
  sellingPrice: number;
  valueAtCost: number;
  valueAtSelling: number;
  lowStock: boolean;
}
export interface InventoryReportSummary {
  count: number;
  totalUnits: number;
  valueAtCost: number;
  valueAtSelling: number;
  lowStockCount: number;
}

export interface CustomerReportRow {
  name: string;
  phone: string;
  orders: number;
  sales: number;
  received: number;
  outstanding: number;
}
export interface VendorReportRow {
  name: string;
  phone: string;
  bills: number;
  purchases: number;
  paid: number;
  outstanding: number;
}

export interface ProfitLoss {
  salesNet: number;
  purchasesNet: number;
  grossProfit: number;
  grossMargin: number;
  gstCollected: number;
  gstPaid: number;
  netGstPayable: number;
  invoiceCount: number;
  purchaseCount: number;
}

export interface DateFilter {
  from?: string;
  to?: string;
  customer?: string;
  vendor?: string;
  direction?: string;
  mode?: string;
}

async function get<T>(path: string, params?: DateFilter): Promise<T> {
  const { data } = await api.get<{ data: T }>(`/reports/${path}`, { params });
  return data.data;
}

export const reportsApi = {
  sales: (p?: DateFilter) => get<ReportResult<DocReportRow, DocReportSummary>>('sales', p),
  purchases: (p?: DateFilter) => get<ReportResult<DocReportRow, DocReportSummary>>('purchases', p),
  payments: (p?: DateFilter) => get<ReportResult<PaymentReportRow, PaymentReportSummary>>('payments', p),
  inventory: () => get<ReportResult<InventoryReportRow, InventoryReportSummary>>('inventory'),
  customers: () => get<ReportResult<CustomerReportRow, { count: number; sales: number; received: number; outstanding: number }>>('customers'),
  vendors: () => get<ReportResult<VendorReportRow, { count: number; purchases: number; paid: number; outstanding: number }>>('vendors'),
  profitLoss: (p?: DateFilter) => get<ProfitLoss>('profit-loss', p),
};
