import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function POST(request: Request) {
  try {
    const { loteExpensas } = await request.json();
    for (const exp of loteExpensas) {
      await prisma.expensa.upsert({
        where: { uq_unidad_periodo: { unidadId: BigInt(exp.unidad_id), periodoMes: exp.periodo_mes, periodoAnio: exp.periodo_anio } },
        update: { montoOrdinario: exp.monto_ordinario, montoExtraordinario: exp.monto_extraordinario, montoCargos: exp.monto_cargos, recargoMora: exp.recargo_mora, totalPagar: exp.total_pagar, fechaVencimiento: new Date(exp.fecha_vencimiento), estado: exp.estado },
        create: { unidadId: BigInt(exp.unidad_id), periodoMes: exp.periodo_mes, periodoAnio: exp.periodo_anio, montoOrdinario: exp.monto_ordinario, montoExtraordinario: exp.monto_extraordinario, montoCargos: exp.monto_cargos, recargoMora: exp.recargo_mora, totalPagar: exp.total_pagar, fechaVencimiento: new Date(exp.fecha_vencimiento), estado: exp.estado }
      });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Emitir error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
