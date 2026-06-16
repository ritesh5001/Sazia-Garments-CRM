export interface RawLineItem {
  product?: string;
  description: string;
  quantity: number;
  rate: number; // paise per unit
  gstRate: number; // percent
}

export interface ComputedLineItem extends RawLineItem {
  taxableValue: number;
  gstAmount: number;
  lineTotal: number;
}

export interface DocumentTotals {
  lineItems: ComputedLineItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
}

/** Compute per-line and document totals from raw line items. All money in paise. */
export function computeTotals(items: RawLineItem[]): DocumentTotals {
  const lineItems = items.map((item) => {
    const taxableValue = Math.round(item.quantity * item.rate);
    const gstAmount = Math.round((taxableValue * item.gstRate) / 100);
    return {
      ...item,
      taxableValue,
      gstAmount,
      lineTotal: taxableValue + gstAmount,
    };
  });

  const subtotal = lineItems.reduce((s, l) => s + l.taxableValue, 0);
  const gstAmount = lineItems.reduce((s, l) => s + l.gstAmount, 0);
  return { lineItems, subtotal, gstAmount, total: subtotal + gstAmount };
}

/** Derive payment status from total and amount paid. */
export function paymentStatus(total: number, amountPaid: number): 'pending' | 'partial' | 'paid' {
  if (amountPaid <= 0) return 'pending';
  if (amountPaid >= total) return 'paid';
  return 'partial';
}
