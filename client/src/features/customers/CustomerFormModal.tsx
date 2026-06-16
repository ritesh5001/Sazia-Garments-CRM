import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/api/client';
import { createCustomer, updateCustomer, type CustomerPayload } from '@/api/customers';
import { toPaise, toRupees } from '@/lib/money';
import type { Customer } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

const empty = {
  name: '',
  phone: '',
  email: '',
  gstin: '',
  billingAddress: '',
  shippingAddress: '',
  openingBalanceRupees: '0',
  notes: '',
};

export function CustomerFormModal({ open, onClose, customer }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        gstin: customer.gstin ?? '',
        billingAddress: customer.billingAddress ?? '',
        shippingAddress: customer.shippingAddress ?? '',
        openingBalanceRupees: String(toRupees(customer.openingBalance)),
        notes: customer.notes ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [customer, open]);

  const set = (key: keyof typeof empty) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (payload: Partial<CustomerPayload>) =>
      customer ? updateCustomer(customer._id, payload) : createCustomer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      toast.success(customer ? 'Customer updated' : 'Customer created');
      onClose();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: form.name,
      phone: form.phone,
      email: form.email,
      gstin: form.gstin,
      billingAddress: form.billingAddress,
      shippingAddress: form.shippingAddress,
      openingBalance: toPaise(form.openingBalanceRupees),
      notes: form.notes,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={customer ? 'Edit Customer' : 'New Customer'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="customer-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="customer-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input id="name" label="Name *" value={form.name} onChange={set('name')} required />
        <Input id="phone" label="Phone" value={form.phone} onChange={set('phone')} />
        <Input id="email" type="email" label="Email" value={form.email} onChange={set('email')} />
        <Input id="gstin" label="GSTIN" value={form.gstin} onChange={set('gstin')} />
        <Input
          id="openingBalance"
          type="number"
          step="0.01"
          label="Opening Balance (₹, +receivable)"
          value={form.openingBalanceRupees}
          onChange={set('openingBalanceRupees')}
        />
        <div className="hidden sm:block" />
        <Textarea
          id="billingAddress"
          label="Billing Address"
          value={form.billingAddress}
          onChange={set('billingAddress')}
        />
        <Textarea
          id="shippingAddress"
          label="Shipping Address"
          value={form.shippingAddress}
          onChange={set('shippingAddress')}
        />
        <div className="sm:col-span-2">
          <Textarea id="notes" label="Notes" value={form.notes} onChange={set('notes')} />
        </div>
      </form>
    </Modal>
  );
}
