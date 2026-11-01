import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { limpiezaId, accion } = body; // accion: "aprobar" o "rechazar"

    if (!limpiezaId) return NextResponse.json({ error: 'ID de limpieza requerido' }, { status: 400 });

    const turno = await prisma.limpiezaRotativa.findUnique({
      where: { id: BigInt(limpiezaId) }
    });

    if (!turno) return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });

    const config = await prisma.configuracionConsorcio.findFirst({ where: { id: 1 } });
    const montoMulta = config?.montoMultaLimpieza ? Number(config.montoMultaLimpieza) : 24000;

    const esDenuncia = Boolean(turno.unidadIdSustituta);
    const now = new Date();

    if (esDenuncia) {
      // Caso 1: Es una DENUNCIA de vecino con suplente
      if (accion === 'aprobar') {
        // La administradora valida la denuncia:
        // Se aplica la multa a la infractora y se bonifica a la sustituta
        await prisma.multa.create({
          data: {
            unidadIdInfractora: turno.unidadIdAsignada,
            acreditadoAUnidadId: turno.unidadIdSustituta,
            monto: montoMulta,
            motivo: 'Incumplimiento de turno de limpieza rotativa (Homologado por Admin)',
          }
        });

        // +montoMulta a la UF infractora
        await prisma.cargoParticular.create({
          data: {
            unidadId: turno.unidadIdAsignada,
            concepto: 'Multa por incumplimiento limpieza rotativa',
            monto: montoMulta,
            periodoMes: now.getMonth() + 1,
            periodoAnio: now.getFullYear(),
          }
        });

        // -montoMulta de compensación a la UF sustituta
        if (turno.unidadIdSustituta) {
          await prisma.cargoParticular.create({
            data: {
              unidadId: turno.unidadIdSustituta,
              concepto: 'Bonificación por suplencia de limpieza',
              monto: -montoMulta,
              periodoMes: now.getMonth() + 1,
              periodoAnio: now.getFullYear(),
            }
          });
        }

        await prisma.limpiezaRotativa.update({
          where: { id: BigInt(limpiezaId) },
          data: { estado: 'multado' }
        });

        return NextResponse.json({ success: true, estado: 'multado' });
      } else {
        // La administradora DESESTIMA la denuncia
        await prisma.limpiezaRotativa.update({
          where: { id: BigInt(limpiezaId) },
          data: {
            estado: 'programado',
            unidadIdSustituta: null,
            observaciones: 'Denuncia desestimada por la Administración.'
          }
        });
        return NextResponse.json({ success: true, estado: 'programado' });
      }
    } else {
      // Caso 2: Es un reporte regular de turno (el propio vecino reportó o venció)
      if (accion === 'aprobar') {
        await prisma.limpiezaRotativa.update({
          where: { id: BigInt(limpiezaId) },
          data: { estado: 'cumplido' }
        });
        return NextResponse.json({ success: true, estado: 'cumplido' });
      } else {
        await prisma.multa.create({
          data: {
            unidadIdInfractora: turno.unidadIdAsignada,
            monto: montoMulta,
            motivo: 'Incumplimiento de turno de limpieza rotativa (Rechazado por Admin)',
          }
        });

        await prisma.cargoParticular.create({
          data: {
            unidadId: turno.unidadIdAsignada,
            concepto: 'Multa por incumplimiento limpieza rotativa',
            monto: montoMulta,
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
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
