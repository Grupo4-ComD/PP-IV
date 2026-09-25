import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const hoy = new Date();
    const allTurnos = await prisma.limpiezaRotativa.findMany({
      include: { unidadAsignada: true, unidadSustituta: true },
      orderBy: { semanaInicio: 'asc' }
    });

    const turnosResult = allTurnos.map(t => {
      const tInicio = new Date(t.semanaInicio);
      const tFin = new Date(t.semanaFin);
      
      let estadoCalculado = 'programado';
      if (tInicio <= hoy && tFin >= hoy) estadoCalculado = 'en_curso';
      else if (tFin < hoy) estadoCalculado = t.estado;
      else if (tInicio > hoy && tInicio.getTime() - hoy.getTime() < 7*24*3600*1000) estadoCalculado = 'proximo';

      const startStr = tInicio.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      const endStr = tFin.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      const numeroSemana = Math.ceil((tInicio.getTime() - new Date(tInicio.getFullYear(),0,1).getTime()) / 86400000 / 7);

      return {
        id: Number(t.id),
        semana_numero: numeroSemana,
        rango_fechas: `${startStr} al ${endStr}`,
        numero_uf: t.unidadAsignada.numeroUf,
        piso_depto: t.unidadAsignada.pisoDepto,
        residente: t.unidadAsignada.propietarioNombre,
        estado: estadoCalculado,
        unidad_sustituta_uf: t.unidadSustituta ? t.unidadSustituta.numeroUf : null
      };
    });
    return NextResponse.json(turnosResult);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
