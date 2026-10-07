import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.mantenimiento.upsert({
      where: { tipo: 'tanque_agua' },
      update: {},
      create: {
        tipo: 'tanque_agua',
        fechaUltimo: new Date('2025-08-12T00:00:00Z'),
        frecuenciaMeses: 12
      }
    });

    await prisma.mantenimiento.upsert({
      where: { tipo: 'matafuegos' },
      update: {},
      create: {
        tipo: 'matafuegos',
        fechaUltimo: new Date('2025-10-01T00:00:00Z'),
        frecuenciaMeses: 12
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
