import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/api/client';
import { createVendor, updateVendor, type VendorPayload } from '@/api/vendors';
import { toPaise, toRupees } from '@/lib/money';
import type { Vendor } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  vendor?: Vendor | null;
}

const empty = {
  name: '',
  phone: '',
  email: '',
  gstin: '',
  address: '',
  openingBalanceRupees: '0',
  notes: '',
};

export function VendorFormModal({ open, onClose, vendor }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name,
        phone: vendor.phone ?? '',
        email: vendor.email ?? '',
        gstin: vendor.gstin ?? '',
        address: vendor.address ?? '',
        openingBalanceRupees: String(toRupees(vendor.openingBalance)),
        notes: vendor.notes ?? '',
      });
    } else {
      setForm(empty);
    }
  }, [vendor, open]);

  const set = (key: keyof typeof empty) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (payload: Partial<VendorPayload>) =>
      vendor ? updateVendor(vendor._id, payload) : createVendor(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendors'] });
      toast.success(vendor ? 'Vendor updated' : 'Vendor created');
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
      address: form.address,
      openingBalance: toPaise(form.openingBalanceRupees),
      notes: form.notes,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={vendor ? 'Edit Vendor' : 'New Vendor'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button form="vendor-form" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="vendor-form" onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input id="v-name" label="Name *" value={form.name} onChange={set('name')} required />
        <Input id="v-phone" label="Phone" value={form.phone} onChange={set('phone')} />
        <Input id="v-email" type="email" label="Email" value={form.email} onChange={set('email')} />
        <Input id="v-gstin" label="GSTIN" value={form.gstin} onChange={set('gstin')} />
        <Input
          id="v-openingBalance"
          type="number"
          step="0.01"
          label="Opening Balance (₹, +payable)"
          value={form.openingBalanceRupees}
          onChange={set('openingBalanceRupees')}
        />
        <div className="hidden sm:block" />
        <div className="sm:col-span-2">
          <Textarea id="v-address" label="Address" value={form.address} onChange={set('address')} />
        </div>
        <div className="sm:col-span-2">
          <Textarea id="v-notes" label="Notes" value={form.notes} onChange={set('notes')} />
        </div>
      </form>
    </Modal>
  );
}
