import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { listLogs, type ActivityLog } from '@/api/logs';

const ENTITY_OPTIONS = [
  { value: '', label: 'All modules' },
  { value: 'customers', label: 'Customers' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'products', label: 'Products' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'purchases', label: 'Purchases' },
  { value: 'payments', label: 'Payments' },
  { value: 'orders', label: 'Orders' },
  { value: 'users', label: 'Users' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
];

const actionTone: Record<string, 'green' | 'amber' | 'red'> = {
  create: 'green',
  update: 'amber',
  delete: 'red',
};

export function ActivityLogsPage() {
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['logs', { entityType, action, page }],
    queryFn: () => listLogs({ entityType: entityType || undefined, action: action || undefined, page, limit: 30 }),
  });

  const columns: Column<ActivityLog>[] = [
    {
      header: 'When',
      cell: (l) => new Date(l.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
    },
    { header: 'User', cell: (l) => l.user?.name ?? '—' },
    { header: 'Action', cell: (l) => <Badge tone={actionTone[l.action]}>{l.action}</Badge> },
    { header: 'Module', cell: (l) => <span className="capitalize">{l.entityType}</span> },
    {
      header: 'Target',
      cell: (l) => <span className="font-mono text-xs text-slate-500">{l.entityId ?? '—'}</span>,
    },
    { header: 'Endpoint', cell: (l) => <span className="font-mono text-xs text-slate-400">{l.method} {l.path}</span> },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Activity Logs" subtitle="Audit trail of changes across the system." />

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-44">
          <Select
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            options={ENTITY_OPTIONS}
          />
        </div>
        <div className="w-44">
          <Select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            options={ACTION_OPTIONS}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(l) => l._id}
        loading={isLoading}
        emptyMessage="No activity recorded yet."
      />

      {data && data.total > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
      )}
    </div>
  );
}
