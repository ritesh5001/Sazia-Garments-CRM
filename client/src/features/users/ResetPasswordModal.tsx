import { useEffect, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/api/client';
import { resetUserPassword } from '@/api/users';
import type { User } from '@/types';

export function ResetPasswordModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
}) {
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) setPassword('');
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => resetUserPassword(user._id, password),
    onSuccess: () => {
      toast.success('Password reset');
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
      title={`Reset password — ${user.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="reset-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Reset Password'}
          </Button>
        </>
      }
    >
      <form id="reset-form" onSubmit={handleSubmit}>
        <Input
          type="password"
          label="New Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
}
