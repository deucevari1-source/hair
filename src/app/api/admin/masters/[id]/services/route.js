import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req, { params }) {
  const { id } = await params;
  if (!requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const masterServices = await prisma.masterService.findMany({
    where: { masterId: id },
    select: { serviceId: true, priceFrom: true, priceTo: true },
  });

  return NextResponse.json({
    serviceIds: masterServices.map((ms) => ms.serviceId),
    masterServices,
  });
}

export async function PUT(req, { params }) {
  const { id } = await params;
  if (!requireAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // services: [{ serviceId, priceFrom?, priceTo? }]
  const { services } = await req.json();

  await prisma.masterService.deleteMany({ where: { masterId: id } });

  if (services && services.length > 0) {
    await prisma.masterService.createMany({
      data: services.map(({ serviceId, priceFrom, priceTo }) => ({
        masterId: id,
        serviceId,
        priceFrom: priceFrom != null ? Math.round(priceFrom * 100) : null,
        priceTo:   priceTo   != null ? Math.round(priceTo   * 100) : null,
      })),
    });
  }

  return NextResponse.json({ ok: true });
}
