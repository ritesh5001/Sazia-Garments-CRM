import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { verifyRefreshToken } from '../../utils/tokens.js';
import * as authService from './auth.service.js';

const REFRESH_COOKIE = 'sazia_refresh';

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
}

export async function registerFirstAdmin(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await authService.registerFirstAdmin(req.body);
  setRefreshCookie(res, refreshToken);
  res.status(201).json({ user, accessToken });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized('No refresh token');
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid refresh token');
  }
  const { accessToken, refreshToken } = await authService.refresh(payload.sub, payload.role);
  setRefreshCookie(res, refreshToken);
  res.json({ accessToken });
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ message: 'Logged out' });
}

export async function me(req: Request, res: Response) {
  const user = await authService.getMe(req.user!.id);
  res.json({ user });
}

export async function setupStatus(_req: Request, res: Response) {
  const hasUser = await authService.hasAnyUser();
  res.json({ needsSetup: !hasUser });
}
