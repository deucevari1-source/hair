import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function PUT(request, { params }) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const { name, question, options } = body;
  const tpl = await prisma.promptTemplate.update({
    where: { id },
    data: { name, question, options },
  });
  return NextResponse.json({ template: tpl });
}

export async function DELETE(request, { params }) {
  const admin = requireAuth(request);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await prisma.promptTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
