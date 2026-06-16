// Money is stored as integer paise across the app to avoid float errors.

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

/** Format integer paise as ₹ string, e.g. 123450 -> "₹1,234.50". */
export function formatINR(paise: number): string {
  return inr.format((paise ?? 0) / 100);
}

/** Convert a rupee input (number or string) to integer paise. */
export function toPaise(rupees: number | string): number {
  const n = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** Convert integer paise to a rupee number for form inputs. */
export function toRupees(paise: number): number {
  return (paise ?? 0) / 100;
}

export function formatDate(value?: string | Date): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
