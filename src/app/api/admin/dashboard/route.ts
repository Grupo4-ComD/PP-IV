import { NextResponse } from 'next/server';
import { PrismaClient, EstadoTicket } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const unidades = await prisma.unidad.findMany({
      orderBy: { numeroUf: 'asc' },
    });

    // Tomamos el mes y año actual dinámicamente
    const hoy = new Date();
    const periodoMes = hoy.getMonth() + 1;
    const periodoAnio = hoy.getFullYear();

    const pagos = await prisma.pagoVecino.findMany({
      where: { periodoMes, periodoAnio, estado: 'aprobado' }
    });
    
    const recaudacionMes = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

    const tickets = await prisma.ticketReclamo.count({
      where: { estado: { in: ['abierto', 'en_revision'] } }
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
      const enMora = deudaUnidad > 0;

      if (enMora) {
        ufsMora++;
      } else {
        ufsAlDia++;
      }

      return {
        id: u.id.toString(),
        numero_uf: u.numeroUf,
        piso_depto: u.pisoDepto,
        propietario_nombre: u.propietarioNombre,
        email: u.email,
        porcentual_m2: Number(u.coeficienteProrrateo),
        estado_expensa: enMora ? "pendiente" : "pagado",
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
      ...gastosData.map(g => ({
        id: `g-${g.id}`,
        periodo: `${(new Date(g.fechaGasto).getMonth() + 1).toString().padStart(2, '0')}/${new Date(g.fechaGasto).getFullYear()}`,
        detalle: g.concepto,
        monto: Number(g.monto),
        tipo: 'GASTO',
        fecha: g.fechaGasto.getTime()
      })),
      ...pagosData.map(p => ({
        id: `p-${p.id}`,
        periodo: `${p.periodoMes.toString().padStart(2, '0')}/${p.periodoAnio}`,
        detalle: `Cobro (U. ${p.unidad.pisoDepto})`,
        monto: Number(p.monto),
        tipo: 'PAGO',
        fecha: p.fechaPago.getTime()
      }))
    ].sort((a, b) => b.fecha - a.fecha).slice(0, 15);

    const totalPagos = await prisma.pagoVecino.aggregate({ where: { estado: 'aprobado' }, _sum: { monto: true } });
    const totalGastos = await prisma.gasto.aggregate({ _sum: { monto: true } });
    
    // Saldo real de Caja Bancaria (Total cobrado histórico - Total gastado histórico)
    const saldoCaja = Number(totalPagos._sum.monto || 0) - Number(totalGastos._sum.monto || 0);

    return NextResponse.json({
      saldoCaja,
      movimientos,
      recaudacionMes,
      ufsAlDia,
      ufsMora,
      totalMoraPendiente,
      ticketsActivos: tickets,
      unidades: unidadesConEstado
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Error fetching dashboard metrics' }, { status: 500 });
  }
}
