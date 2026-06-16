import { Customer, type ICustomerDocument } from '../../models/Customer.js';
import { ApiError } from '../../utils/ApiError.js';
import {
  paginate,
  searchFilter,
  type ListParams,
  type ListResult,
} from '../../utils/paginate.js';
import type { CustomerInput, CustomerUpdateInput } from './customers.validators.js';

export async function listCustomers(params: ListParams): Promise<ListResult<ICustomerDocument>> {
  const filter = searchFilter<ICustomerDocument>(params.search, ['name', 'phone', 'email', 'gstin']);
  return paginate(Customer, params, filter);
}

export async function getCustomer(id: string) {
  const customer = await Customer.findById(id);
  if (!customer) throw ApiError.notFound('Customer not found');
  return customer;
}

export async function createCustomer(input: CustomerInput) {
  return Customer.create(input);
}

export async function updateCustomer(id: string, input: CustomerUpdateInput) {
  const customer = await Customer.findByIdAndUpdate(id, input, { new: true, runValidators: true });
  if (!customer) throw ApiError.notFound('Customer not found');
  return customer;
}

export async function deleteCustomer(id: string) {
  const customer = await Customer.findByIdAndDelete(id);
  if (!customer) throw ApiError.notFound('Customer not found');
  return customer;
}
