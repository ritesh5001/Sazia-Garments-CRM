import { User, hashPassword } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { parseListParams, searchFilter } from '../../utils/paginate.js';
import type { Request } from 'express';
import type { CreateUserInput, UpdateUserInput } from './users.validators.js';

export async function listUsers(req: Request) {
  const { page, limit, search, sort } = parseListParams(req);
  const filter = searchFilter(search, ['name', 'email']);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    User.find(filter).select('-passwordHash -__v').sort(sort).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return { data, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function createUser(input: CreateUserInput) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw ApiError.conflict('A user with this email already exists');

  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: input.role,
  });
  return user.toJSON();
}

export async function updateUser(id: string, input: UpdateUserInput, actingUserId: string) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  // Guard: don't let an admin demote/deactivate the last active admin.
  const wouldRemoveAdmin =
    user.role === 'admin' &&
    ((input.role && input.role !== 'admin') || input.isActive === false);
  if (wouldRemoveAdmin) {
    const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
    if (activeAdmins <= 1) throw ApiError.badRequest('At least one active admin is required');
  }
  if (id === actingUserId && input.isActive === false) {
    throw ApiError.badRequest('You cannot deactivate your own account');
  }

  if (input.name !== undefined) user.name = input.name;
  if (input.role !== undefined) user.role = input.role;
  if (input.isActive !== undefined) user.isActive = input.isActive;
  await user.save();
  return user.toJSON();
}

export async function resetPassword(id: string, password: string) {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  user.passwordHash = await hashPassword(password);
  await user.save();
  return { message: 'Password reset' };
}

export async function deleteUser(id: string, actingUserId: string) {
  if (id === actingUserId) throw ApiError.badRequest('You cannot delete your own account');
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');

  if (user.role === 'admin') {
    const activeAdmins = await User.countDocuments({ role: 'admin', isActive: true });
    if (activeAdmins <= 1) throw ApiError.badRequest('At least one active admin is required');
  }
  await user.deleteOne();
  return { message: 'User deleted' };
}
