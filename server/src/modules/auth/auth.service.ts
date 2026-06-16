import { User, hashPassword } from '../../models/User.js';
import { ApiError } from '../../utils/ApiError.js';
import { signAccessToken, signRefreshToken } from '../../utils/tokens.js';
import type { LoginInput, RegisterAdminInput } from './auth.validators.js';

function issueTokens(userId: string, role: 'admin' | 'staff') {
  return {
    accessToken: signAccessToken({ sub: userId, role }),
    refreshToken: signRefreshToken({ sub: userId, role }),
  };
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email.toLowerCase() });
  if (!user || !user.isActive) throw ApiError.unauthorized('Invalid credentials');

  const ok = await user.comparePassword(input.password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  user.lastLogin = new Date();
  await user.save();

  const tokens = issueTokens(user.id, user.role);
  return { user: user.toJSON(), ...tokens };
}

/** Bootstrap: only allowed when no users exist yet (creates first admin). */
export async function registerFirstAdmin(input: RegisterAdminInput) {
  const count = await User.countDocuments();
  if (count > 0) {
    throw ApiError.forbidden('Registration is closed. An admin already exists.');
  }
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash: await hashPassword(input.password),
    role: 'admin',
  });
  const tokens = issueTokens(user.id, user.role);
  return { user: user.toJSON(), ...tokens };
}

export async function refresh(userId: string, role: 'admin' | 'staff') {
  const user = await User.findById(userId);
  if (!user || !user.isActive) throw ApiError.unauthorized('User no longer active');
  return issueTokens(user.id, role);
}

export async function getMe(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user.toJSON();
}

export async function hasAnyUser() {
  return (await User.countDocuments()) > 0;
}
