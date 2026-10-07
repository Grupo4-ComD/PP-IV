import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { turnoId, ufDestino, accion } = await request.json();

    if (!turnoId) return NextResponse.json({ error: 'Falta turnoId' }, { status: 400 });

    if (accion === 'solicitar') {
      if (!ufDestino) return NextResponse.json({ error: 'Falta ufDestino' }, { status: 400 });
      
      const unidadDestino = await prisma.unidad.findUnique({ where: { numeroUf: Number(ufDestino) } });
      if (!unidadDestino) return NextResponse.json({ error: 'Unidad destino no encontrada' }, { status: 404 });

      await prisma.limpiezaRotativa.update({
        where: { id: BigInt(turnoId) },
        data: {
          solicitudPermutaAUnidadId: unidadDestino.id,
          estadoPermuta: 'pendiente'
        }
      });
      return NextResponse.json({ success: true, message: 'Solicitud enviada' });
    }

    if (accion === 'aceptar' || accion === 'rechazar') {
      const turnoDestino = await prisma.limpiezaRotativa.findUnique({
        where: { id: BigInt(turnoId) },
        include: { unidadAsignada: true }
      });
      if (!turnoDestino || turnoDestino.estadoPermuta !== 'pendiente') {
        return NextResponse.json({ error: 'Solicitud no válida' }, { status: 400 });
      }

      if (accion === 'rechazar') {
        await prisma.limpiezaRotativa.update({
          where: { id: BigInt(turnoId) },
          data: {
            solicitudPermutaAUnidadId: null,
            estadoPermuta: 'ninguna'
          }
        });
        return NextResponse.json({ success: true, message: 'Solicitud rechazada' });
      }

      // Si acepta, intercambiamos a los responsables:
      // El turnoDestino (el que pidió la permuta inicialmente, o sea el origen) cambia a la UF que acepta.
      // Pero, ¿cuál turno entregará la UF que acepta? Su PRÓXIMO turno programado.
      const miProximoTurno = await prisma.limpiezaRotativa.findFirst({
        where: {
          unidadIdAsignada: turnoDestino.solicitudPermutaAUnidadId!,
          estado: 'programado',
          semanaInicio: { gt: new Date() } // Turnos futuros
        },
        orderBy: { semanaInicio: 'asc' }
      });

      if (!miProximoTurno) {
        return NextResponse.json({ error: 'No tienes turnos futuros para intercambiar' }, { status: 400 });
      }

      // Hacemos el SWAP de unidadIdAsignada
      await prisma.$transaction([
        prisma.limpiezaRotativa.update({
          where: { id: turnoDestino.id },
          data: {
            unidadIdAsignada: miProximoTurno.unidadIdAsignada, // Ahora lo hago yo
            solicitudPermutaAUnidadId: null,
            estadoPermuta: 'ninguna'
          }
        }),
        prisma.limpiezaRotativa.update({
          where: { id: miProximoTurno.id },
          data: {
            unidadIdAsignada: turnoDestino.unidadIdAsignada // Ahora lo hace el otro en mi fecha
          }
        })
      ]);

      return NextResponse.json({ success: true, message: 'Permuta aceptada y turnos intercambiados' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('Error permuta:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
