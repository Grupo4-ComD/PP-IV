import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { limpiezaId, accion } = body; // accion puede ser "aprobar" o "rechazar"

    if (!limpiezaId) return NextResponse.json({ error: 'ID de limpieza requerido' }, { status: 400 });

    const turno = await prisma.limpiezaRotativa.findUnique({
      where: { id: BigInt(limpiezaId) }
    });

    if (!turno) return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });

    if (accion === 'aprobar') {
      await prisma.limpiezaRotativa.update({
        where: { id: BigInt(limpiezaId) },
        data: { estado: 'cumplido' }
      });
      return NextResponse.json({ success: true, estado: 'cumplido' });
    } else {
      const now = new Date();
      // 1. Crear registro de Multa
      await prisma.multa.create({
        data: {
          unidadIdInfractora: turno.unidadIdAsignada,
          monto: 24000,
          motivo: 'Incumplimiento de turno de limpieza rotativa (Rechazado por Admin)',
        }
      });

      // 2. Insertar CargoParticular a la UF infractora (+)
      await prisma.cargoParticular.create({
        data: {
          unidadId: turno.unidadIdAsignada,
          concepto: 'Multa por incumplimiento limpieza rotativa',
          monto: 24000,
          periodoMes: now.getMonth() + 1,
          periodoAnio: now.getFullYear(),
        }
      });

      await prisma.limpiezaRotativa.update({
        where: { id: BigInt(limpiezaId) },
        data: { estado: 'multado' }
      });

      return NextResponse.json({ success: true, estado: 'multado' });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
