import { NextResponse } from 'next/server';
import { PrismaClient, EstadoTicket } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const unidades = await prisma.unidad.findMany({
      orderBy: { numeroUf: 'asc' },
    });

    // Usaremos el mes 8/2026 ya que los Mocks que insertamos son de ese mes
    const periodoMes = 8;
    const periodoAnio = 2026;

    const pagos = await prisma.pagoVecino.findMany({
      where: { periodoMes, periodoAnio, estado: 'aprobado' }
    });
    
    const recaudacionMes = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

    const tickets = await prisma.ticketReclamo.count({
      where: { estado: EstadoTicket.abierto }
    });

    let ufsAlDia = 0;
    let ufsMora = 0;
    let totalMoraPendiente = 0;

    const unidadesConEstado = await Promise.all(unidades.map(async (u) => {
      // Deuda histórica de la unidad
      const pagosAntResult = await prisma.pagoVecino.aggregate({
        where: { 
          unidadId: u.id, 
          estado: 'aprobado', 
          OR: [{ periodoAnio: { lt: periodoAnio } }, { periodoAnio, periodoMes: { lt: periodoMes } }] 
        },
        _sum: { monto: true }
      });
      const cargosAntResult = await prisma.cargoParticular.aggregate({
        where: { 
          unidadId: u.id, 
          OR: [{ periodoAnio: { lt: periodoAnio } }, { periodoAnio, periodoMes: { lt: periodoMes } }] 
        },
        _sum: { monto: true }
      });

      const deudaAnt = Number(u.saldoAnteriorInicial) + Number(cargosAntResult._sum.monto || 0) - Number(pagosAntResult._sum.monto || 0);
      const pagosUnidad = pagos.filter(p => p.unidadId === u.id).reduce((sum, p) => sum + Number(p.monto), 0);
      
      const saldoPendiente = deudaAnt - pagosUnidad;
      const enMora = saldoPendiente > 0;

      if (enMora) {
        ufsMora++;
        totalMoraPendiente += saldoPendiente;
      } else {
        ufsAlDia++;
      }

      return {
        id: u.id.toString(), // BigInt a string para poder enviarlo por JSON
        numero_uf: u.numeroUf,
        piso_depto: u.pisoDepto,
        propietario_nombre: u.propietarioNombre,
        email: u.email,
        porcentual_m2: Number(u.coeficienteProrrateo),
        estado_expensa: enMora ? "pendiente" : "pagado",
        saldo_pendiente: saldoPendiente > 0 ? saldoPendiente : 0
      };
    }));

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
    
    // Saldo base imaginario + Ingresos - Egresos
    const saldoCaja = 1200000 + Number(totalPagos._sum.monto || 0) - Number(totalGastos._sum.monto || 0);

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
