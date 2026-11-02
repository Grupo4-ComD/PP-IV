import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() { return cookieStore.getAll(); }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userRole = user.user_metadata?.rol || 'vecino';
    const isAdmin = userRole === 'admin' || (user.email && user.email.includes('admin'));

    if (!isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de Administrador.' }, { status: 403 });
    }

    const unidades = await prisma.unidad.findMany({
      orderBy: { numeroUf: 'asc' },
    });

    // Tomamos el mes y año actual dinámicamente
    const hoy = new Date();
    const periodoMes = hoy.getMonth() + 1;
    const periodoAnio = hoy.getFullYear();

    const fechaInicioMes = new Date(periodoAnio, periodoMes - 1, 1);
    const fechaFinMes = new Date(periodoAnio, periodoMes, 0, 23, 59, 59);

    const pagos = await prisma.pagoVecino.findMany({
      where: {
        estado: 'aprobado',
        OR: [
          { periodoMes, periodoAnio },
          { fechaPago: { gte: fechaInicioMes, lte: fechaFinMes } }
        ]
      }
    });
    
    const recaudacionMes = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

    const tickets = await prisma.ticketReclamo.count({
      where: { estado: { notIn: ['resuelto', 'cerrado'] } }
    });

    // Calcular mora y estados desde la tabla real de Expensas
    const expensasPendientes = await prisma.expensa.findMany({
      where: { estado: { not: 'pagado' } }
    });

    let ufsAlDia = 0;
    let ufsMora = 0;
    const totalMoraPendiente = expensasPendientes.reduce((sum, e) => sum + Number(e.totalPagar), 0);

    const unidadesConEstado = unidades.map((u) => {
      // Filtrar las expensas impagas de esta unidad
      const deudaUnidadList = expensasPendientes.filter(e => e.unidadId === u.id);
      const deudaUnidad = deudaUnidadList.reduce((sum, e) => sum + Number(e.totalPagar), 0);
      const hoy = new Date();
      const expensasEnMora = deudaUnidadList.filter(
        (e) => Number(e.recargoMora) > 0 || (e.fechaVencimiento && new Date(e.fechaVencimiento) < hoy)
      );
      const enMora = expensasEnMora.length > 0;
      const tieneDeuda = deudaUnidad > 0;

      if (enMora) {
        ufsMora++;
      } else if (!tieneDeuda) {
        ufsAlDia++;
      }

      return {
        id: u.id.toString(),
        numero_uf: u.numeroUf,
        piso_depto: u.pisoDepto,
        propietario_nombre: u.propietarioNombre,
        email: u.email,
        porcentual_m2: Number(u.coeficienteProrrateo),
        estado_expensa: tieneDeuda ? (enMora ? "mora" : "pendiente") : "pagado",
        saldo_pendiente: deudaUnidad
      };
    });

    // --- CÁLCULO DE SALDO DE CAJA Y MOVIMIENTOS ---
    const gastosData = await prisma.gasto.findMany({
      orderBy: { fechaGasto: 'desc' },
      take: 20
    });
    
    const pagosData = await prisma.pagoVecino.findMany({
      where: { estado: 'aprobado' },
      include: { unidad: true },
      orderBy: { fechaPago: 'desc' },
      take: 20
    });

    const movimientos = [
      ...gastosData.map(g => {
        const con = (g.concepto || '').toUpperCase();
        const esAjuste = con.includes('AJUSTE');
        const esIngreso = Number(g.monto) < 0;
        const conceptoLimpio = g.concepto.replace(/\s*_sd\b/gi, '').trim();

        let tipo: 'GASTO' | 'INGRESO' | 'EGRESO' = 'GASTO';
        if (esAjuste) {
          tipo = esIngreso ? 'INGRESO' : 'EGRESO';
        } else if (esIngreso) {
          tipo = 'INGRESO';
        }

        return {
          id: `g-${g.id}`,
          periodo: `${(new Date(g.fechaGasto).getMonth() + 1).toString().padStart(2, '0')}/${new Date(g.fechaGasto).getFullYear()}`,
          detalle: conceptoLimpio,
          monto: Math.abs(Number(g.monto)),
          tipo,
          fecha: g.fechaGasto.getTime()
        };
      }),
      ...pagosData.map(p => ({
        id: `p-${p.id}`,
        periodo: `${p.periodoMes.toString().padStart(2, '0')}/${p.periodoAnio}`,
        detalle: `Cobro (U. ${p.unidad.pisoDepto})`,
        monto: Number(p.monto),
        tipo: 'PAGO' as const,
        fecha: p.fechaPago.getTime()
      }))
    ].sort((a, b) => b.fecha - a.fecha).slice(0, 15);

    const totalPagos = await prisma.pagoVecino.aggregate({ where: { estado: 'aprobado' }, _sum: { monto: true } });
    const todosLosGastos = await prisma.gasto.findMany();

    let egresosCaja = 0;
    let ingresosAjusteCaja = 0;

    for (const g of todosLosGastos) {
      const con = (g.concepto || '').toUpperCase();
      const monto = Number(g.monto);
      const esAjuste = con.includes('AJUSTE');

      if (esAjuste) {
        if (monto < 0) {
          ingresosAjusteCaja += Math.abs(monto);
        } else {
          egresosCaja += monto;
        }
      } else if (!con.includes('_SD')) {
        egresosCaja += monto;
      }
    }

    // Saldo real de Caja Bancaria (Total cobrado histórico + Ajustes ingreso - Total egresos reales)
    const saldoCaja = Number(totalPagos._sum.monto || 0) + ingresosAjusteCaja - egresosCaja;

    const limpiezasEnVerificacion = await prisma.limpiezaRotativa.findMany({
      where: { estado: 'en_verificacion' },
      include: { unidadAsignada: true, unidadSustituta: true }
    });

    const limpiezasVencidas = await prisma.limpiezaRotativa.findMany({
      where: { 
        estado: 'programado',
        semanaFin: { lt: new Date() }
      },
      include: { unidadAsignada: true }
    });

    const config = await prisma.configuracionConsorcio.findFirst({ where: { id: 1 } });
    const montoMulta = config?.montoMultaLimpieza ? Number(config.montoMultaLimpieza) : 24000;

    return NextResponse.json({
      saldoCaja,
      movimientos,
      recaudacionMes,
      ufsAlDia,
      ufsMora,
      totalMoraPendiente,
      ticketsActivos: tickets,
      unidades: unidadesConEstado,
      montoMulta,
      limpiezasEnVerificacion: limpiezasEnVerificacion.map(l => ({
        id: l.id.toString(),
        numero_uf: l.unidadAsignada.numeroUf,
        piso_depto: l.unidadAsignada.pisoDepto,
        residente: l.unidadAsignada.propietarioNombre,
        semana_inicio: l.semanaInicio.toISOString().split('T')[0],
        tipo: l.unidadIdSustituta ? 'denuncia' : 'verificacion',
        denunciante_uf: l.unidadSustituta?.numeroUf || null,
        denunciante_nombre: l.unidadSustituta?.propietarioNombre || null,
      })),
      limpiezasVencidas: limpiezasVencidas.map(l => ({
        id: l.id.toString(),
        numero_uf: l.unidadAsignada.numeroUf,
        piso_depto: l.unidadAsignada.pisoDepto,
        residente: l.unidadAsignada.propietarioNombre,
        semana_inicio: l.semanaInicio.toISOString().split('T')[0],
        tipo: 'vencida'
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Error fetching dashboard metrics' }, { status: 500 });
  }
}
