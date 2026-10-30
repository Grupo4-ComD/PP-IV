import { PrismaClient, CategoriaGasto } from '@prisma/client';

const prisma = new PrismaClient();

export interface LiquidacionParams {
  periodoMes: number;
  periodoAnio: number;
}

export async function generarLiquidacionConsolidada({ periodoMes, periodoAnio }: LiquidacionParams) {
  // 1. Obtener todas las unidades
  const unidades = await prisma.unidad.findMany({
    orderBy: { numeroUf: 'asc' },
  });

  const fechaInicio = new Date(periodoAnio, periodoMes - 1, 1);
  const fechaFin = new Date(periodoAnio, periodoMes, 0, 23, 59, 59);

  // 2. Obtener gastos del período actual
  const gastosMes = await prisma.gasto.findMany({
    where: { 
      fechaGasto: {
        gte: fechaInicio,
        lte: fechaFin
      }
    },
  });

  // 3. Separar gastos del mes por tipo de prorrateo
  // Los fondos de reserva se prorratean como ordinarias a todas las UFs
  let totalOrdinarias = 0;
  let totalExtraordinarias = 0;

  gastosMes.forEach(gasto => {
    const con = (gasto.concepto || '').toUpperCase();
    const esAjusteCaja = con.includes('AJUSTE') || con.includes('_SD');
    if (!esAjusteCaja && Number(gasto.monto) > 0) {
      if (gasto.categoria === CategoriaGasto.ordinario || gasto.categoria === CategoriaGasto.fondo_comun || con.includes('FONDO') || con.includes('RESERVA')) {
        totalOrdinarias += Number(gasto.monto);
      } else if (gasto.categoria === CategoriaGasto.extraordinario) {
        totalExtraordinarias += Number(gasto.monto);
      }
    }
  });

  // 4. Obtener cargos particulares del mes
  const cargosMes = await prisma.cargoParticular.findMany({
    where: { periodoMes, periodoAnio },
  });

  // Total de cargos de Fondo de Reserva (se prorratean como ordinarias)
  const totalFondoReservaCargos = cargosMes
    .filter(c => {
      const con = (c.concepto || '').toUpperCase();
      return con.includes('FONDO') || con.includes('RESERVA');
    })
    .reduce((s, c) => s + Number(c.monto), 0);

  // Total de cuotas extraordinarias (excluyendo fondos de reserva)
  const totalCuotasExtraCargos = cargosMes
    .filter(c => {
      const con = (c.concepto || '').toUpperCase();
      return con.includes('CUOTA') && !con.includes('FONDO') && !con.includes('RESERVA');
    })
    .reduce((s, c) => s + Number(c.monto), 0);

  // 5. Obtener pagos del mes
  const pagosMes = await prisma.pagoVecino.findMany({
    where: { periodoMes, periodoAnio, estado: 'aprobado' },
  });

  // 6. Obtener movimientos históricos para Deuda Anterior y Saldo de Caja Acumulado
  const pagosPreviosTotal = await prisma.pagoVecino.aggregate({
    where: {
      estado: 'aprobado',
      OR: [
        { periodoAnio: { lt: periodoAnio } },
        { periodoAnio: periodoAnio, periodoMes: { lt: periodoMes } }
      ]
    },
    _sum: { monto: true }
  });

  const gastosPrevios = await prisma.gasto.findMany({
    where: {
      fechaGasto: { lt: fechaInicio }
    }
  });

  let egresosPreviosCaja = 0;
  let totalGastosPreviosProrrateables = 0;

  gastosPrevios.forEach(g => {
    const con = (g.concepto || '').toUpperCase();
    const esAjusteCaja = con.includes('AJUSTE') || con.includes('_SD');
    if (!esAjusteCaja && Number(g.monto) > 0) {
      totalGastosPreviosProrrateables += Number(g.monto);
    }
    if (g.categoria !== CategoriaGasto.comision_pasarela) {
      egresosPreviosCaja += Number(g.monto);
    }
  });

  // --- CÁLCULO DE DISTRIBUCIÓN POR UNIDAD ---
  const distribucion = await Promise.all(unidades.map(async (unidad) => {
    const porcentual = Number(unidad.coeficienteProrrateo);
    
    // a) Deuda Histórica acumulada
    const pagosAnt = await prisma.pagoVecino.aggregate({
      where: {
        unidadId: unidad.id,
        estado: 'aprobado',
        OR: [
          { periodoAnio: { lt: periodoAnio } },
          { periodoAnio: periodoAnio, periodoMes: { lt: periodoMes } }
        ]
      },
      _sum: { monto: true }
    });

    const cargosAnt = await prisma.cargoParticular.aggregate({
      where: {
        unidadId: unidad.id,
        OR: [
          { periodoAnio: { lt: periodoAnio } },
          { periodoAnio: periodoAnio, periodoMes: { lt: periodoMes } }
        ]
      },
      _sum: { monto: true }
    });
    
    const dPrevG = (totalGastosPreviosProrrateables * porcentual) / 100;
    const calcDeudaAnt = Number(unidad.saldoAnteriorInicial) + dPrevG + Number(cargosAnt._sum.monto || 0) - Number(pagosAnt._sum.monto || 0);
    const deudaAnt = Math.max(0, calcDeudaAnt);

    // b) Pagos del mes actual para esta unidad
    const pagosUnidad = pagosMes.filter(p => p.unidadId === unidad.id).reduce((sum, p) => sum + Number(p.monto), 0);

    // c) Subtotal
    const subtotal = deudaAnt - pagosUnidad;

    // d) Prorrateos
    const cargosEspeciales = cargosMes.filter(c => c.unidadId === unidad.id);

    // Fondo de Reserva cargado se suma a Ordinarias de la unidad
    const fondoReservaUnidad = cargosEspeciales
      .filter(c => {
        const con = (c.concepto || '').toUpperCase();
        return con.includes('FONDO') || con.includes('RESERVA');
      })
      .reduce((s, c) => s + Number(c.monto), 0);

    const cuotasExtraUnidad = cargosEspeciales
      .filter(c => {
        const con = (c.concepto || '').toUpperCase();
        return con.includes('CUOTA') && !con.includes('FONDO') && !con.includes('RESERVA');
      })
      .reduce((s, c) => s + Number(c.monto), 0);

    const otrosCargosUnidad = cargosEspeciales
      .filter(c => {
        const con = (c.concepto || '').toUpperCase();
        return !con.includes('CUOTA') && !con.includes('FONDO') && !con.includes('RESERVA');
      })
      .reduce((s, c) => s + Number(c.monto), 0);

    const ordinariasUnidad = ((totalOrdinarias * porcentual) / 100) + fondoReservaUnidad;
    const extraordinariasUnidad = ((totalExtraordinarias * porcentual) / 100) + cuotasExtraUnidad;
    const total = Math.max(0, subtotal + ordinariasUnidad + extraordinariasUnidad + otrosCargosUnidad);

    return {
      uf: unidad.numeroUf,
      pisoDepto: unidad.pisoDepto,
      propietario: unidad.propietarioNombre,
      porcentual: porcentual,
      deudaAnt: deudaAnt,
      pagos: -pagosUnidad,
      subtotal: subtotal,
      ordinarias: ordinariasUnidad,
      extraordinarias: extraordinariasUnidad,
      cargos: otrosCargosUnidad,
      total: total
    };
  }));

  // --- CÁLCULO ESTADO DE CAJA ---
  let saldoCajaActual = Number(pagosPreviosTotal._sum.monto || 0) - egresosPreviosCaja;
   
  const estadoCaja: any[] = []; 

  if (saldoCajaActual !== 0) {
    estadoCaja.push({
      tipo: "saldo_anterior",
      detalle: "SALDO ANTERIOR ACUMULADO",
      ingresos: null,
      ordinarias: null,
      extraordinaria: null,
      saldo: saldoCajaActual,
      nota: null
    });
  }

  pagosMes.forEach(pago => {
    const u = unidades.find(u => u.id === pago.unidadId);
    saldoCajaActual += Number(pago.monto);
    estadoCaja.push({
      tipo: "ingreso",
      detalle: `Cobro Unidad ${u?.numeroUf} - ${u?.pisoDepto}`,
      ingresos: Number(pago.monto),
      ordinarias: null,
      extraordinaria: null,
      saldo: saldoCajaActual,
      nota: null
    });
  });

  gastosMes.forEach(gasto => {
    const con = (gasto.concepto || '').toUpperCase();
    const esAjusteCaja = con.includes('AJUSTE') || con.includes('_SD');
    const seProrratea = !esAjusteCaja && Number(gasto.monto) > 0;

    if (gasto.categoria !== CategoriaGasto.comision_pasarela) {
      saldoCajaActual -= Number(gasto.monto);
    }
    
    const conceptoLimpio = gasto.concepto.replace(/_sd|_SD/gi, '').trim();

    const esOrd = gasto.categoria === CategoriaGasto.ordinario || gasto.categoria === CategoriaGasto.fondo_comun || con.includes('FONDO') || con.includes('RESERVA');
    const esExt = gasto.categoria === CategoriaGasto.extraordinario && !con.includes('FONDO') && !con.includes('RESERVA');

    estadoCaja.push({
      tipo: gasto.categoria === CategoriaGasto.comision_pasarela ? "fondo" : (Number(gasto.monto) < 0 ? "ingreso" : "egreso"),
      detalle: conceptoLimpio + (!seProrratea && Number(gasto.monto) > 0 ? ` ($ ${Number(gasto.monto).toLocaleString('es-AR')}) [AJUSTE CONTABLE]` : ''),
      ingresos: Number(gasto.monto) < 0 ? Math.abs(Number(gasto.monto)) : null,
      ordinarias: (esOrd && seProrratea) ? Number(gasto.monto) : null,
      extraordinaria: (esExt && seProrratea) ? Number(gasto.monto) : null,
      saldo: gasto.categoria !== CategoriaGasto.comision_pasarela ? saldoCajaActual : null,
      nota: null
    });
  });

  if (totalFondoReservaCargos > 0) {
    estadoCaja.push({
      tipo: "fondo",
      detalle: "Fondo de Reserva (Prorrateo Ordinario)",
      ingresos: null,
      ordinarias: totalFondoReservaCargos,
      extraordinaria: null,
      saldo: saldoCajaActual,
      nota: "Fondo de reserva prorrateado según coeficiente a todas las UFs como gastos ordinarios",
    });
  }

  return {
    distribucion,
    estadoCaja,
    totalesCaja: {
      totalIngresos: pagosMes.reduce((s, p) => s + Number(p.monto), 0),
      totalOrdinarias: totalOrdinarias + totalFondoReservaCargos,
      totalExtraordinarias: totalExtraordinarias + totalCuotasExtraCargos,
      saldoFinal: saldoCajaActual,
    }
  };
}
