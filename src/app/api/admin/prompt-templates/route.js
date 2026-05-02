import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const templates = await prisma.promptTemplate.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ templates });
}

export async function POST(request) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { name, question, options } = body;
  if (!name?.trim() || !question?.trim() || !Array.isArray(options) || options.length === 0) {
    return NextResponse.json({ error: 'name, question and options required' }, { status: 400 });
  }
  const seenLabels = new Set();
  for (const o of options) {
    if (!o.label?.trim()) return NextResponse.json({ error: 'every option needs a label' }, { status: 400 });
    if (seenLabels.has(o.label.trim())) {
      return NextResponse.json({ error: `Duplicate option label: "${o.label}"` }, { status: 400 });
    }
    seenLabels.add(o.label.trim());
    if (!o.action) o.action = 'ACK';
    if (o.action === 'BOOK' && (!o.payload?.masterId || !o.payload?.serviceId)) {
      return NextResponse.json(
        { error: `Option "${o.label}" with action BOOK requires masterId and serviceId` },
        { status: 400 }
      );
    }
  }
  const tpl = await prisma.promptTemplate.create({
    data: { name: name.trim(), question, options },
  });
  return NextResponse.json({ template: tpl });
}
