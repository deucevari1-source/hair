import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { makeExpiry } from '@/lib/prompts';

// GET /api/admin/prompts?status=PENDING|ANSWERED|EXPIRED|all&limit=50
export async function GET(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'ANSWERED';
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

  const where = { source: 'ADMIN' };
  if (status !== 'all') where.status = status;
  const prompts = await prisma.clientPrompt.findMany({
    where,
    include: { client: { select: { id: true, name: true, phone: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: limit,
  });
  return NextResponse.json({ prompts });
}

// POST /api/admin/prompts
// body: { question, options, segment: 'ALL'|'MASTER'|'SINGLE', clientId?, masterId?, saveAsTemplate?, templateName? }
export async function POST(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { question, options, segment, clientId, masterId, saveAsTemplate, templateName } = body;

  if (!question?.trim()) return NextResponse.json({ error: 'question required' }, { status: 400 });
  if (!Array.isArray(options) || options.length === 0) {
    return NextResponse.json({ error: 'options required' }, { status: 400 });
  }
  const seenLabels = new Set();
  for (const opt of options) {
    if (!opt.label?.trim()) return NextResponse.json({ error: 'every option needs a label' }, { status: 400 });
    if (seenLabels.has(opt.label.trim())) {
      return NextResponse.json({ error: `Duplicate option label: "${opt.label}"` }, { status: 400 });
    }
    seenLabels.add(opt.label.trim());
    if (!opt.action) opt.action = 'ACK';
    if (opt.action === 'BOOK' && (!opt.payload?.masterId || !opt.payload?.serviceId)) {
      return NextResponse.json(
        { error: `Option "${opt.label}" with action BOOK requires masterId and serviceId in payload` },
        { status: 400 }
      );
    }
  }

  let clientIds = [];
  if (segment === 'SINGLE') {
    if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    clientIds = [clientId];
  } else if (segment === 'MASTER') {
    if (!masterId) return NextResponse.json({ error: 'masterId required' }, { status: 400 });
    const rows = await prisma.appointment.findMany({
      where: { masterId, clientId: { not: null } },
      select: { clientId: true },
      distinct: ['clientId'],
    });
    clientIds = rows.map((r) => r.clientId).filter(Boolean);
  } else if (segment === 'ALL') {
    const rows = await prisma.client.findMany({ select: { id: true } });
    clientIds = rows.map((r) => r.id);
  } else {
    return NextResponse.json({ error: 'invalid segment' }, { status: 400 });
  }

  if (clientIds.length === 0) {
    return NextResponse.json({ error: 'no clients in segment', count: 0 }, { status: 400 });
  }

  let templateId = null;
  if (saveAsTemplate && templateName?.trim()) {
    const tpl = await prisma.promptTemplate.create({
      data: { name: templateName.trim(), question, options },
    });
    templateId = tpl.id;
  }

  const expiresAt = makeExpiry();
  await prisma.clientPrompt.createMany({
    data: clientIds.map((cid) => ({
      clientId: cid,
      question,
      options,
      source: 'ADMIN',
      templateId,
      expiresAt,
    })),
  });

  return NextResponse.json({ ok: true, count: clientIds.length, templateId });
}
