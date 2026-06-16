export type ReportKey =
  | 'sales'
  | 'purchases'
  | 'payments'
  | 'inventory'
  | 'customers'
  | 'vendors'
  | 'profit-loss';

export interface ReportColumn {
  key: string;
  label: string;
  money?: boolean; // value stored in paise
  align?: 'right';
}

export const REPORT_TABS: { key: ReportKey; label: string; hasDateFilter: boolean }[] = [
  { key: 'sales', label: 'Sales', hasDateFilter: true },
  { key: 'purchases', label: 'Purchases', hasDateFilter: true },
  { key: 'payments', label: 'Payments', hasDateFilter: true },
  { key: 'inventory', label: 'Inventory', hasDateFilter: false },
  { key: 'customers', label: 'Customers', hasDateFilter: false },
  { key: 'vendors', label: 'Vendors', hasDateFilter: false },
  { key: 'profit-loss', label: 'Profit & Loss', hasDateFilter: true },
];

const docColumns: ReportColumn[] = [
  { key: 'reference', label: 'Reference' },
  { key: 'date', label: 'Date' },
  { key: 'party', label: 'Party' },
  { key: 'subtotal', label: 'Subtotal', money: true, align: 'right' },
  { key: 'gst', label: 'GST', money: true, align: 'right' },
  { key: 'total', label: 'Total', money: true, align: 'right' },
  { key: 'paid', label: 'Paid', money: true, align: 'right' },
  { key: 'balance', label: 'Balance', money: true, align: 'right' },
  { key: 'status', label: 'Status' },
];

export const REPORT_COLUMNS: Record<Exclude<ReportKey, 'profit-loss'>, ReportColumn[]> = {
  sales: docColumns,
  purchases: docColumns,
  payments: [
    { key: 'reference', label: 'Reference' },
    { key: 'date', label: 'Date' },
    { key: 'direction', label: 'Direction' },
    { key: 'party', label: 'Party' },
    { key: 'mode', label: 'Mode' },
    { key: 'note', label: 'Note' },
    { key: 'amount', label: 'Amount', money: true, align: 'right' },
  ],
  inventory: [
    { key: 'name', label: 'Product' },
    { key: 'sku', label: 'SKU' },
    { key: 'unit', label: 'Unit' },
    { key: 'currentStock', label: 'Stock', align: 'right' },
    { key: 'costPrice', label: 'Cost', money: true, align: 'right' },
    { key: 'sellingPrice', label: 'Selling', money: true, align: 'right' },
    { key: 'valueAtCost', label: 'Value (cost)', money: true, align: 'right' },
  ],
  customers: [
    { key: 'name', label: 'Customer' },
    { key: 'phone', label: 'Phone' },
    { key: 'orders', label: 'Invoices', align: 'right' },
    { key: 'sales', label: 'Sales', money: true, align: 'right' },
    { key: 'received', label: 'Received', money: true, align: 'right' },
    { key: 'outstanding', label: 'Outstanding', money: true, align: 'right' },
  ],
  vendors: [
    { key: 'name', label: 'Vendor' },
    { key: 'phone', label: 'Phone' },
    { key: 'bills', label: 'Purchases', align: 'right' },
    { key: 'purchases', label: 'Total', money: true, align: 'right' },
    { key: 'paid', label: 'Paid', money: true, align: 'right' },
    { key: 'outstanding', label: 'Outstanding', money: true, align: 'right' },
  ],
};
