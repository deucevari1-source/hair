import { NextResponse } from 'next/server';
import { CLIENT_COOKIE_NAME, clearCookieOptions } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CLIENT_COOKIE_NAME, '', clearCookieOptions());
  return response;
}
