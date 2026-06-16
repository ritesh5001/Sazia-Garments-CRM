import { Vendor, type IVendorDocument } from '../../models/Vendor.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  paginate,
  searchFilter,
  type ListParams,
  type ListResult,
} from '../../utils/paginate.js';
import type { VendorInput, VendorUpdateInput } from './vendors.validators.js';

export async function listVendors(params: ListParams): Promise<ListResult<IVendorDocument>> {
  const filter = searchFilter<IVendorDocument>(params.search, ['name', 'phone', 'email', 'gstin']);
  return paginate(Vendor, params, filter);
}

export async function getVendor(id: string) {
  const vendor = await Vendor.findById(id);
  if (!vendor) throw ApiError.notFound('Vendor not found');
  return vendor;
}

export async function createVendor(input: VendorInput) {
  return Vendor.create(input);
}

export async function updateVendor(id: string, input: VendorUpdateInput) {
  const vendor = await Vendor.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!vendor) throw ApiError.notFound('Vendor not found');
  return vendor;
}

export async function deleteVendor(id: string) {
  const vendor = await Vendor.findByIdAndDelete(id);
  if (!vendor) throw ApiError.notFound('Vendor not found');
  return vendor;
}
