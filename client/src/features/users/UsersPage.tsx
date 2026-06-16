import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, KeyRound, Trash2, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserFormModal } from './UserFormModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { listUsers, updateUser, deleteUser } from '@/api/users';
import { apiErrorMessage } from '@/api/client';
import { formatDate } from '@/lib/money';
import { useAuth } from '@/features/auth/AuthContext';
import type { User } from '@/types';

export function UsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page }],
    queryFn: () => listUsers({ page, limit: 20, sort: 'name' }),
  });

  const toggleActive = useMutation({
    mutationFn: (u: User) => updateUser(u._id, { isActive: !u.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
      setDeleting(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const columns: Column<User>[] = [
    { header: 'Name', cell: (u) => <span className="font-medium text-slate-800">{u.name}</span> },
    { header: 'Email', cell: (u) => u.email },
    { header: 'Role', cell: (u) => <Badge tone={u.role === 'admin' ? 'blue' : 'gray'}>{u.role}</Badge> },
    {
      header: 'Status',
      cell: (u) => <Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>,
    },
    { header: 'Last Login', cell: (u) => formatDate(u.lastLogin) },
    {
      header: '',
      className: 'text-right w-px whitespace-nowrap',
      cell: (u) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" title="Edit" onClick={() => { setEditing(u); setFormOpen(true); }}>
            <Pencil size={15} />
          </Button>
          <Button variant="ghost" size="sm" title="Reset password" onClick={() => setResetting(u)}>
            <KeyRound size={15} />
          </Button>
          {u._id !== me?._id && (
            <>
              <Button
                variant="ghost"
                size="sm"
                title={u.isActive ? 'Disable' : 'Enable'}
                onClick={() => toggleActive.mutate(u)}
              >
                <Power size={15} className={u.isActive ? 'text-amber-500' : 'text-emerald-500'} />
              </Button>
              <Button variant="ghost" size="sm" title="Delete" onClick={() => setDeleting(u)}>
                <Trash2 size={15} className="text-rose-500" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="User Management"
        subtitle="Manage admin and staff accounts and their access."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus size={16} /> New User
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={data?.data ?? []}
        rowKey={(u) => u._id}
        loading={isLoading}
        emptyMessage="No users."
      />

      {data && data.total > 0 && (
        <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
      )}

      <UserFormModal open={formOpen} onClose={() => setFormOpen(false)} user={editing} />
      {resetting && (
        <ResetPasswordModal open={!!resetting} onClose={() => setResetting(null)} user={resetting} />
      )}
      <ConfirmDialog
        open={!!deleting}
        message={`Delete user "${deleting?.name}"? This cannot be undone.`}
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
