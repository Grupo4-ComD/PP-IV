import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const unidadId = searchParams.get('unidadId');

    if (!unidadId) {
      return NextResponse.json({ error: 'Falta unidadId' }, { status: 400 });
    }

    const unidad = await prisma.unidad.findUnique({
      where: { id: BigInt(unidadId) }
    });

    if (!unidad) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    // Para el estado de cuenta, usamos el mes actual (o mes 8 de 2026 como en mocks)
    const periodoMes = 8;
    const periodoAnio = 2026;

    // Calcular deuda histórica
    const pagosAntResult = await prisma.pagoVecino.aggregate({
      where: { 
        unidadId: unidad.id, 
        estado: 'aprobado', 
        OR: [{ periodoAnio: { lt: periodoAnio } }, { periodoAnio, periodoMes: { lt: periodoMes } }] 
      },
      _sum: { monto: true }
    });
    
    const cargosAntResult = await prisma.cargoParticular.aggregate({
      where: { 
        unidadId: unidad.id, 
        OR: [{ periodoAnio: { lt: periodoAnio } }, { periodoAnio, periodoMes: { lt: periodoMes } }] 
      },
      _sum: { monto: true }
    });

    const deudaAnt = Number(unidad.saldoAnteriorInicial) + Number(cargosAntResult._sum.monto || 0) - Number(pagosAntResult._sum.monto || 0);
    const pagosMes = await prisma.pagoVecino.findMany({
      where: { unidadId: unidad.id, periodoMes, periodoAnio, estado: 'aprobado' }
    });
    const totalPagosMes = pagosMes.reduce((acc, p) => acc + Number(p.monto), 0);
    const saldoPendiente = deudaAnt - totalPagosMes;

    // Simulamos la expensa del mes actual a pagar
    const gastosMes = await prisma.gasto.aggregate({
      where: { fechaGasto: { gte: new Date(2026, 7, 1), lte: new Date(2026, 7, 31) } },
      _sum: { monto: true }
    });
    
    // Prorrateo básico
    const totalGastos = Number(gastosMes._sum.monto || 0);
    const montoOrdinario = (totalGastos * 1.05) * (Number(unidad.coeficienteProrrateo) / 100); 

    const expensaMockDinamic = {
      id: 1,
      unidad_id: unidad.id.toString(),
      periodo_mes: periodoMes,
      periodo_anio: periodoAnio,
      monto_ordinario: montoOrdinario,
      recargo_mora: saldoPendiente > 0 ? (saldoPendiente * 0.05) : 0, // 5% punitorio mock
      total_pagar: saldoPendiente + montoOrdinario,
      fecha_vencimiento: "2026-09-15",
      estado: saldoPendiente > 0 ? "pendiente" : "pagado",
      comprobante_url: null,
    };

    return NextResponse.json({
      unidad: {
        id: unidad.id.toString(),
        numero_uf: unidad.numeroUf,
        piso_depto: unidad.pisoDepto,
        propietario_nombre: unidad.propietarioNombre,
        email: unidad.email,
        coeficiente_prorrateo: Number(unidad.coeficienteProrrateo),
        saldo_pendiente: saldoPendiente
      },
      expensa: expensaMockDinamic
    });

  } catch (error) {
    console.error('Error fetching vecino dashboard:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
