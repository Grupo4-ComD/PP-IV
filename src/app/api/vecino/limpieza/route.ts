import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    
    let miNumeroUf = 0;
    if (user && user.email) {
      const usuario = await prisma.usuario.findUnique({
        where: { email: user.email },
        include: { unidad: true }
      });
      if (usuario && usuario.unidad) {
        miNumeroUf = usuario.unidad.numeroUf;
      }
    }

    const hoy = new Date();
    const unidades = await prisma.unidad.findMany({ orderBy: { numeroUf: 'asc' } });

    // Auto-generación continua: asegurar que el cronograma cubra todo el año en curso y el próximo ciclo
    if (unidades.length > 0) {
      const turnosExistentes = await prisma.limpiezaRotativa.findMany({
        orderBy: { semanaInicio: 'asc' }
      });

      const currentYear = hoy.getFullYear();
      const fechaLimite = new Date(currentYear + 1, 0, 31); // Cubrir hasta fines de enero del año próximo

      if (turnosExistentes.length === 0 || new Date(turnosExistentes[turnosExistentes.length - 1].semanaFin) < fechaLimite) {
        let proximoInicio: Date;
        let ufIndex = 0;

        if (turnosExistentes.length > 0) {
          const ultimo = turnosExistentes[turnosExistentes.length - 1];
          proximoInicio = new Date(ultimo.semanaFin);
          proximoInicio.setDate(proximoInicio.getDate() + 1); // Lunes siguiente
          proximoInicio.setHours(0, 0, 0, 0);

          const idxUltimaUf = unidades.findIndex(u => u.id === ultimo.unidadIdAsignada);
          ufIndex = (idxUltimaUf + 1) % unidades.length;
        } else {
          // Si no hay turnos, arranca en el primer lunes del año actual
          proximoInicio = new Date(`${currentYear}-01-01T00:00:00Z`);
          while (proximoInicio.getDay() !== 1) {
            proximoInicio.setDate(proximoInicio.getDate() + 1);
          }
        }

        const nuevosTurnos = [];
        let cursor = new Date(proximoInicio);

        while (cursor < fechaLimite) {
          const fin = new Date(cursor);
          fin.setDate(fin.getDate() + 6);
          fin.setHours(23, 59, 59, 999);

          const uAsignada = unidades[ufIndex % unidades.length];
          nuevosTurnos.push({
            unidadIdAsignada: uAsignada.id,
            semanaInicio: new Date(cursor),
            semanaFin: new Date(fin),
            estado: 'programado'
          });

          ufIndex++;
          cursor.setDate(cursor.getDate() + 7);
        }

        if (nuevosTurnos.length > 0) {
          await prisma.limpiezaRotativa.createMany({ data: nuevosTurnos });
        }
      }
    }

    const allTurnos = await prisma.limpiezaRotativa.findMany({
      include: { unidadAsignada: true, unidadSustituta: true, unidadPermuta: true },
      orderBy: { semanaInicio: 'asc' }
    });

    const config = await prisma.configuracionConsorcio.findFirst({ where: { id: 1 } });
    const montoMulta = config?.montoMultaLimpieza ? Number(config.montoMultaLimpieza) : 24000;

    const turnosResult = allTurnos.map(t => {
      const tInicio = new Date(t.semanaInicio);
      const tFin = new Date(t.semanaFin);
      tInicio.setHours(0, 0, 0, 0);
      tFin.setHours(23, 59, 59, 999);
      
      let estadoCalculado = t.estado;
      if (tInicio <= hoy && tFin >= hoy) {
        // Semana actual en curso
        estadoCalculado = (t.estado === 'programado' || t.estado === 'proximo' || t.estado === 'cumplido') ? 'en_curso' : t.estado;
      } else if (tInicio > hoy) {
        if (tInicio.getTime() - hoy.getTime() <= 7 * 24 * 3600 * 1000) {
          // Próxima semana inmediata
          estadoCalculado = t.estado === 'programado' ? 'proximo' : t.estado;
        } else {
          estadoCalculado = 'programado';
        }
      } else if (tFin < hoy) {
        // Semanas pasadas: si no hubo reporte o fue creada con el bug de seed por defecto, respetar su estado real
        estadoCalculado = t.estado;
      }

      const startStr = tInicio.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      const endStr = tFin.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
      const numeroSemana = Math.ceil((tInicio.getTime() - new Date(tInicio.getFullYear(),0,1).getTime()) / 86400000 / 7);

      return {
        id: Number(t.id),
        semana_numero: numeroSemana,
        rango_fechas: `${startStr} al ${endStr}`,
        fecha_inicio: tInicio.toISOString().split('T')[0],
        fecha_fin: tFin.toISOString().split('T')[0],
        numero_uf: t.unidadAsignada.numeroUf,
        piso_depto: t.unidadAsignada.pisoDepto,
        residente: t.unidadAsignada.propietarioNombre,
        estado: estadoCalculado,
        unidad_sustituta_uf: t.unidadSustituta ? t.unidadSustituta.numeroUf : null,
        solicitud_permuta_uf: t.unidadPermuta ? t.unidadPermuta.numeroUf : null,
        estado_permuta: t.estadoPermuta
      };
    });
    return NextResponse.json({ turnos: turnosResult, miNumeroUf, montoMulta });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
