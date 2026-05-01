import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { CLIENT_COOKIE_NAME, verifyClientToken } from '@/lib/auth';

export async function GET() {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ client: null });
  const payload = verifyClientToken(token);
  if (!payload) return NextResponse.json({ client: null });
  return NextResponse.json({
    client: {
      id: payload.clientId,
      name: payload.name,
      phone: payload.phone,
    },
  });
}
