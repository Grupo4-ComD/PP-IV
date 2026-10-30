import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 1. Autenticación y Autorización
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userRole = user.user_metadata?.rol || 'vecino';
    const isAdmin = userRole === 'admin' || (user.email && user.email.includes('admin'));
    
    if (!isAdmin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

    // 2. Obtener parámetros
    const { periodoMes, periodoAnio, fechaVencimiento, porcentajeFondoReserva = 5.0, forceOverride = false } = await request.json();

    // 2.1 Verificar si el período fue cerrado/bloqueado por seguridad contable (RF-08)
    const periodoExistente = await prisma.periodoFinalizado.findUnique({
      where: {
        uq_periodo_cierre: {
          periodoMes: Number(periodoMes),
          periodoAnio: Number(periodoAnio),
        },
      },
    });

    if (periodoExistente && periodoExistente.estado === 'cerrado_bloqueado') {
      return NextResponse.json(
        {
          error:
            'Este período mensual se encuentra cerrado y bloqueado por seguridad contable (RF-08). No se pueden emitir ni modificar expensas de un ciclo finalizado.',
        },
        { status: 423 }
      );
    }

    // 2.2 Advertencia de sobreescritura si ya se habían generado expensas
    if (!forceOverride) {
      const existingExpensa = await prisma.expensa.findFirst({
        where: {
          periodoMes: Number(periodoMes),
          periodoAnio: Number(periodoAnio),
        },
      });

      if (existingExpensa) {
        return NextResponse.json(
          { error: 'Período ya emitido. Se requiere confirmación para sobrescribir.', requiresOverride: true },
          { status: 409 }
        );
      }
    }

    // 3. Consultar datos de la Base de Datos
    const unidades = await prisma.unidad.findMany();
    
    // Gastos del período indicado
    const startDate = new Date(periodoAnio, periodoMes - 1, 1);
    const endDate = new Date(periodoAnio, periodoMes, 0, 23, 59, 59);
    
    const gastos = await prisma.gasto.findMany({
      where: {
        fechaGasto: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Cargos del período según periodoMes y periodoAnio
    const cargos = await prisma.cargoParticular.findMany({
      where: {
        periodoMes: Number(periodoMes),
        periodoAnio: Number(periodoAnio),
      },
    });

    // 4. Cálculos del Motor de Prorrateo
    // Solo se prorratean gastos reales con monto positivo.
    // Solo ajustes de caja contables (_SD o AJUSTE) se excluyen del prorrateo.
    // Los fondos de reserva y cuotas especiales se liquidan como extraordinarias.
    const gastosProrrateables = gastos.filter(g => {
      const con = (g.concepto || '').toUpperCase();
      const esAjusteCaja = con.includes('AJUSTE') || con.includes('_SD');
      return !esAjusteCaja && Number(g.monto) > 0;
    });

    const totalGastosOrdinarios = gastosProrrateables
      .filter((g) => {
        const con = (g.concepto || '').toUpperCase();
        return g.categoria === "ordinario" && !con.includes('FONDO') && !con.includes('RESERVA');
      })
      .reduce((acc, g) => acc + Number(g.monto), 0);

    const totalGastosExtraordinarios = gastosProrrateables
      .filter((g) => {
        const con = (g.concepto || '').toUpperCase();
        return g.categoria === "extraordinario" || g.categoria === "fondo_comun" || con.includes('FONDO') || con.includes('RESERVA');
      })
      .reduce((acc, g) => acc + Number(g.monto), 0);

    const montoFondoReserva = Math.round(totalGastosOrdinarios * (Number(porcentajeFondoReserva) / 100));

    // Cargos de Fondo de Reserva (se liquidan como extraordinarias)
    const cargosFondoReserva = cargos.filter(c => {
      const con = (c.concepto || '').toUpperCase();
      return con.includes('FONDO') || con.includes('RESERVA');
    });
    const totalCargosFondoReserva = cargosFondoReserva.reduce((acc, c) => acc + Number(c.monto), 0);

    // Cuotas extraordinarias adicionales (que no sean de fondo de reserva)
    const cuotasExtra = cargos.filter(c => {
      const con = (c.concepto || '').toUpperCase();
      return con.includes('CUOTA') && !con.includes('FONDO') && !con.includes('RESERVA');
    });
    const totalCuotasExtra = cuotasExtra.reduce((acc, c) => acc + Number(c.monto), 0);

    // Cargos particulares individuales (multas, etc.)
    const cargosIndividuales = cargos.filter(c => {
      const con = (c.concepto || '').toUpperCase();
      return !con.includes('CUOTA') && !con.includes('FONDO') && !con.includes('RESERVA');
    });

    const totalProrratearOrdinario = totalGastosOrdinarios + montoFondoReserva;

    // 5. Crear o actualizar el registro oficial de PeriodoFinalizado (RF-08)
    const periodoFinalizado = await prisma.periodoFinalizado.upsert({
      where: {
        uq_periodo_cierre: {
          periodoMes: Number(periodoMes),
          periodoAnio: Number(periodoAnio),
        },
      },
      update: {
        totalOrdinarias: totalGastosOrdinarios,
        totalExtraordinarias: totalGastosExtraordinarios + totalCargosFondoReserva + totalCuotasExtra,
        totalFondoReserva: montoFondoReserva + totalCargosFondoReserva,
      },
      create: {
        periodoMes: Number(periodoMes),
        periodoAnio: Number(periodoAnio),
        totalOrdinarias: totalGastosOrdinarios,
        totalExtraordinarias: totalGastosExtraordinarios + totalCargosFondoReserva + totalCuotasExtra,
        totalFondoReserva: montoFondoReserva + totalCargosFondoReserva,
        estado: 'abierto',
      },
    });

    // 6. Generar lote de expensas con cálculo automático de mora previa (7%)
    const mesAnterior = Number(periodoMes) === 1 ? 12 : Number(periodoMes) - 1;
    const anioAnterior = Number(periodoMes) === 1 ? Number(periodoAnio) - 1 : Number(periodoAnio);

    for (const u of unidades) {
      const cargoFondoUf = cargosFondoReserva
        .filter((c: any) => c.unidadId === u.id)
        .reduce((acc: number, c: any) => acc + Number(c.monto), 0);

      const cuotaExtraUf = cuotasExtra
        .filter((c: any) => c.unidadId === u.id)
        .reduce((acc: number, c: any) => acc + Number(c.monto), 0);

      const cargoIndivUf = cargosIndividuales
        .filter((c: any) => c.unidadId === u.id)
        .reduce((acc: number, c: any) => acc + Number(c.monto), 0);

      const montoUfOrd = Math.round(totalProrratearOrdinario * (Number(u.coeficienteProrrateo) / 100));
      const montoUfExt = Math.round(totalGastosExtraordinarios * (Number(u.coeficienteProrrateo) / 100)) + cargoFondoUf + cuotaExtraUf;
      const montoUfCargos = cargoIndivUf;

      // Regla de Negocio: Recargo por mora del 7% sobre saldos deudores vencidos de períodos anteriores
      // subtotal_deuda = deuda_anterior_acumulada - pagos_realizados
      const pagosHistoricos = await prisma.pagoVecino.aggregate({
        where: {
          unidadId: u.id,
          estado: 'aprobado',
          OR: [
            { periodoAnio: { lt: Number(periodoAnio) } },
            { periodoAnio: Number(periodoAnio), periodoMes: { lte: Number(periodoMes) } },
          ],
        },
        _sum: { monto: true },
      });
      const deudaPrevia = Number(u.saldoAnteriorInicial || 0);
      const pagosAprobados = Number(pagosHistoricos._sum.monto || 0);
      const subtotalDeuda = deudaPrevia - pagosAprobados;

      let moraUf = 0;
      if (subtotalDeuda > 0.01) {
        moraUf = Math.round(subtotalDeuda * 0.07);
      }

      const montoUfTotal = Math.max(0, montoUfOrd + montoUfExt + montoUfCargos + moraUf);

      await prisma.expensa.upsert({
        where: {
          uq_unidad_periodo: {
            unidadId: u.id,
            periodoMes: Number(periodoMes),
            periodoAnio: Number(periodoAnio),
          },
        },
        update: {
          periodoFinalizadoId: periodoFinalizado.id,
          montoOrdinario: montoUfOrd,
          montoExtraordinario: montoUfExt,
          montoCargos: montoUfCargos,
          recargoMora: moraUf,
          totalPagar: montoUfTotal,
          fechaVencimiento: new Date(fechaVencimiento),
        },
        create: {
          unidadId: u.id,
          periodoFinalizadoId: periodoFinalizado.id,
          periodoMes: Number(periodoMes),
          periodoAnio: Number(periodoAnio),
          montoOrdinario: montoUfOrd,
          montoExtraordinario: montoUfExt,
          montoCargos: montoUfCargos,
          recargoMora: moraUf,
          totalPagar: montoUfTotal,
          fechaVencimiento: new Date(fechaVencimiento),
          estado: 'pendiente',
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Liquidación emitida correctamente.' });
  } catch (error) {
    console.error("Emitir error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
