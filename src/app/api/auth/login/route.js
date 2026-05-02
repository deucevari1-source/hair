import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken, ADMIN_COOKIE_NAME, adminCookieOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Введите email и пароль' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    const valid = await comparePassword(password, admin.password);
    if (!valid) {
      return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
    }

    const token = signToken({ id: admin.id, email: admin.email });

    const response = NextResponse.json({
      admin: { id: admin.id, name: admin.name, email: admin.email },
    });

    response.cookies.set(ADMIN_COOKIE_NAME, token, adminCookieOptions());

    return response;
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
