import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const hoy = new Date();
  await prisma.limpiezaRotativa.updateMany({
    where: {
      semanaInicio: { lte: hoy },
      semanaFin: { gte: hoy }
    },
    data: { estado: 'programado' }
  });
  return NextResponse.json({ message: 'Reseteado' });
}
