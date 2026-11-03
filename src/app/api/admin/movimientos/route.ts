import { NextResponse } from 'next/server';
import { PrismaClient, EstadoPago, EstadoExpensa } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({ error: 'ID de movimiento requerido' }, { status: 400 });
    }

    if (idParam.startsWith('g-')) {
      const gastoId = idParam.replace('g-', '');
      const gastoExistente = await prisma.gasto.findUnique({
        where: { id: BigInt(gastoId) },
      });

      if (!gastoExistente) {
        return NextResponse.json({ error: 'Gasto o ajuste no encontrado' }, { status: 404 });
      }

      await prisma.gasto.delete({
        where: { id: BigInt(gastoId) },
      });

      return NextResponse.json({
        success: true,
        tipo: 'GASTO',
        message: 'Gasto o ajuste eliminado. El saldo en caja fue recalculado exitosamente.',
      });
    } else if (idParam.startsWith('p-')) {
      const pagoId = idParam.replace('p-', '');
      const pago = await prisma.pagoVecino.findUnique({
        where: { id: BigInt(pagoId) },
      });

      if (!pago) {
        return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
      }

      // 1. Eliminar el registro del cobro
      await prisma.pagoVecino.delete({
        where: { id: BigInt(pagoId) },
      });

      // 2. Comprobar si la unidad conserva otros pagos aprobados para ese período
      const otrosPagos = await prisma.pagoVecino.count({
        where: {
          unidadId: pago.unidadId,
          periodoMes: pago.periodoMes,
          periodoAnio: pago.periodoAnio,
          estado: EstadoPago.aprobado,
        },
      });

      // 3. Si no le quedan pagos aprobados en ese mes, revertir la expensa a 'pendiente'
      if (otrosPagos === 0) {
        await prisma.expensa.updateMany({
          where: {
            unidadId: pago.unidadId,
            periodoMes: pago.periodoMes,
            periodoAnio: pago.periodoAnio,
            estado: EstadoExpensa.pagado,
          },
          data: {
            estado: EstadoExpensa.pendiente,
            fechaPago: null,
          },
        });
      }

      return NextResponse.json({
        success: true,
        tipo: 'PAGO',
        message: 'Cobro eliminado. El saldo en caja y el estado de la expensa fueron actualizados.',
      });
    } else {
      return NextResponse.json(
        { error: 'Prefijo de movimiento inválido (debe comenzar con g- o p-)' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error al eliminar movimiento:', error);
    return NextResponse.json({ error: 'Error interno al eliminar el movimiento' }, { status: 500 });
  }
}

