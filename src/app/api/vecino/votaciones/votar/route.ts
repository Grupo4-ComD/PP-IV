import { NextResponse } from 'next/server';
import { PrismaClient, EstadoPresupuesto } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { presupuestoId, unidadId } = await request.json();

    if (!presupuestoId || !unidadId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    const totalUfs = (await prisma.unidad.count()) || 9;
    const config = await prisma.configuracionConsorcio.findFirst({ where: { id: 1 } });
    const umbralPorcentaje = config?.umbralConsensoPorcentaje ? Number(config.umbralConsensoPorcentaje) : 33.33;
    const votosRequeridos = Math.max(1, Math.ceil(totalUfs * (umbralPorcentaje / 100)));

    const existente = await prisma.votoVecino.findUnique({
      where: {
        uq_presupuesto_unidad: {
          presupuestoId: BigInt(presupuestoId),
          unidadId: BigInt(unidadId)
        }
      }
    });

    let nuevoVotosFavor = 0;

    if (existente) {
      await prisma.votoVecino.delete({ where: { id: existente.id } });
      const presActual = await prisma.presupuestoVotacion.findUnique({ where: { id: BigInt(presupuestoId) } });
      nuevoVotosFavor = Math.max(0, (presActual?.votosFavor || 1) - 1);
    } else {
      await prisma.votoVecino.create({
        data: {
          presupuestoId: BigInt(presupuestoId),
          unidadId: BigInt(unidadId)
        }
      });
      const presActual = await prisma.presupuestoVotacion.findUnique({ where: { id: BigInt(presupuestoId) } });
      nuevoVotosFavor = (presActual?.votosFavor || 0) + 1;
    }

    const quorumAlcanzado = nuevoVotosFavor >= votosRequeridos;
    const nuevoEstado = quorumAlcanzado ? EstadoPresupuesto.aprobado : EstadoPresupuesto.en_votacion;

    await prisma.presupuestoVotacion.update({
      where: { id: BigInt(presupuestoId) },
      data: {
        votosFavor: nuevoVotosFavor,
        quorumAlcanzado,
        estado: nuevoEstado
      }
    });

    return NextResponse.json({
      success: true,
      votosFavor: nuevoVotosFavor,
      quorumAlcanzado,
      estado: nuevoEstado,
      votosRequeridos,
      umbralPorcentaje
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
