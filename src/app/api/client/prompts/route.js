import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { CLIENT_COOKIE_NAME, verifyClientToken } from '@/lib/auth';
import { getClientPrompts } from '@/lib/prompts';

export async function GET() {
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ prompts: [] });
  const payload = verifyClientToken(token);
  if (!payload) return NextResponse.json({ prompts: [] });

  const prompts = await getClientPrompts(prisma, payload.clientId);
  return NextResponse.json({ prompts });
}
