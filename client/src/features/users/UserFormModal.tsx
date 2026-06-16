import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/api/client';
import { createUser, updateUser } from '@/api/users';
import type { User, UserRole } from '@/types';

const ROLE_OPTIONS = [
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
];

export function UserFormModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user?: User | null;
}) {
  const qc = useQueryClient();
  const isEdit = !!user;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('staff');

  useEffect(() => {
    if (open) {
      setName(user?.name ?? '');
      setEmail(user?.email ?? '');
      setRole(user?.role ?? 'staff');
      setPassword('');
    }
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? updateUser(user!._id, { name, role }) : createUser({ name, email, password, role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(isEdit ? 'User updated' : 'User created');
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'New User'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="user-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
        <Input id="u-name" label="Name *" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          id="u-email"
          type="email"
          label="Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isEdit}
        />
        {!isEdit && (
          <Input
            id="u-password"
            type="password"
            label="Password * (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}
        <Select
          id="u-role"
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          options={ROLE_OPTIONS}
        />
      </form>
    </Modal>
  );
}
