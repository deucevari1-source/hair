import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { CLIENT_COOKIE_NAME, verifyClientToken } from '@/lib/auth';
import { sendTelegramNotification, formatPromptResponseNotification } from '@/lib/telegram';

export async function POST(request, { params }) {
  const { id } = await params;
  const store = await cookies();
  const token = store.get(CLIENT_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyClientToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { optionLabel } = body;
  if (!optionLabel) return NextResponse.json({ error: 'optionLabel required' }, { status: 400 });

  const prompt = await prisma.clientPrompt.findUnique({
    where: { id },
    include: { client: true },
  });
  if (!prompt || prompt.clientId !== payload.clientId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (prompt.status !== 'PENDING') {
    return NextResponse.json({ error: 'Already answered or expired' }, { status: 409 });
  }

  const options = Array.isArray(prompt.options) ? prompt.options : [];
  const chosen = options.find((o) => o.label === optionLabel);
  if (!chosen) return NextResponse.json({ error: 'Invalid option' }, { status: 400 });

  const updated = await prisma.clientPrompt.update({
    where: { id },
    data: {
      status: 'ANSWERED',
      response: optionLabel,
      responsePayload: chosen.payload || null,
      answeredAt: new Date(),
    },
  });

  // Notify admin
  try {
    const message = formatPromptResponseNotification(updated, prompt.client);
    await sendTelegramNotification(message);
  } catch (e) {
    console.error('Telegram prompt notification failed:', e);
  }

  return NextResponse.json({
    prompt: updated,
    action: chosen.action || 'NONE',
    payload: chosen.payload || null,
  });
}
