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
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: user.email },
      include: { unidad: true }
    });

    let unidad = usuario?.unidad;

    if (!unidad) {
      // Fallback a UF 3 para demostraciones si no coincide el email
      const fallbackUsuario = await prisma.usuario.findFirst({ where: { unidadId: 3 }, include: { unidad: true } });
      if (!fallbackUsuario || !fallbackUsuario.unidad) return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
      unidad = fallbackUsuario.unidad;
    }
    
    // Si unidad sigue siendo null (caso extremo), retornamos error
    if (!unidad) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    // Obtener la deuda total sumando expensas impagas reales
    const expensasPendientes = await prisma.expensa.findMany({
      where: { unidadId: unidad.id, estado: { not: 'pagado' } }
    });
    const saldoPendiente = expensasPendientes.reduce((sum, e) => sum + Number(e.totalPagar), 0);

    // Traer la última expensa emitida para mostrar el "Mes Actual"
    const ultimaExpensa = await prisma.expensa.findFirst({
      where: { unidadId: unidad.id },
      orderBy: [
        { periodoAnio: 'desc' },
        { periodoMes: 'desc' }
      ]
    });

    let expensaRes = null;
    if (ultimaExpensa) {
      expensaRes = {
        id: ultimaExpensa.id.toString(),
        unidad_id: ultimaExpensa.unidadId.toString(),
        periodo_mes: ultimaExpensa.periodoMes,
        periodo_anio: ultimaExpensa.periodoAnio,
        monto_ordinario: Number(ultimaExpensa.montoOrdinario),
        monto_extraordinario: Number(ultimaExpensa.montoExtraordinario),
        monto_cargos: Number(ultimaExpensa.montoCargos),
        recargo_mora: Number(ultimaExpensa.recargoMora),
        total_pagar: Number(ultimaExpensa.totalPagar),
        fecha_vencimiento: ultimaExpensa.fechaVencimiento.toISOString().split('T')[0],
        estado: ultimaExpensa.estado,
        comprobante_url: ultimaExpensa.comprobanteUrl,
      };
    }

    // Calcular tickets activos del vecino
    const ticketsActivos = await prisma.ticketReclamo.count({
      where: { unidadId: unidad.id, estado: { in: ['abierto', 'en_revision'] } }
    });

    // Calcular votaciones activas en todo el consorcio
    const votacionesActivas = await prisma.presupuestoVotacion.count({
      where: { estado: 'en_votacion' }
    });

    // Verificar si el vecino tiene turno de limpieza esta semana
    const hoy = new Date();
    const limpieza = await prisma.limpiezaRotativa.findFirst({
      where: {
        unidadIdAsignada: unidad.id,
        semanaInicio: { lte: hoy },
        semanaFin: { gte: hoy }
      }
    });

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
      expensa: expensaRes,
      metricas: {
        ticketsActivos,
        votacionesActivas
      },
      limpiezaTurno: limpieza ? {
        semana_inicio: limpieza.semanaInicio.toISOString().split('T')[0],
        semana_fin: limpieza.semanaFin.toISOString().split('T')[0],
      } : null
    });

  } catch (error) {
    console.error('Error fetching vecino dashboard:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
