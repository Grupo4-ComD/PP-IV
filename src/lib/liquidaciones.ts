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

  // 3. Separar gastos por tipo de prorrateo
  let totalOrdinarias = 0;
  let totalExtraordinarias = 0;

  gastosMes.forEach(gasto => {
    if (gasto.categoria === CategoriaGasto.ordinario) {
      totalOrdinarias += Number(gasto.monto);
    } else if (gasto.categoria === CategoriaGasto.fondo_comun) {
      totalExtraordinarias += Number(gasto.monto);
    }
  });

  // 4. Obtener cargos particulares del mes
  const cargosMes = await prisma.cargoParticular.findMany({
    where: { periodoMes, periodoAnio },
  });

  // 5. Obtener pagos del mes
  const pagosMes = await prisma.pagoVecino.findMany({
    where: { periodoMes, periodoAnio, estado: 'aprobado' },
  });

  // --- CÁLCULO DE DISTRIBUCIÓN POR UNIDAD ---
  const distribucion = await Promise.all(unidades.map(async (unidad) => {
    const porcentual = Number(unidad.coeficienteProrrateo);
    
    // a) Deuda Histórica
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
    
    const deudaAnt = Number(unidad.saldoAnteriorInicial) + Number(cargosAnt._sum.monto || 0) - Number(pagosAnt._sum.monto || 0);

    // b) Pagos del mes actual para esta unidad
    const pagosUnidad = pagosMes.filter(p => p.unidadId === unidad.id).reduce((sum, p) => sum + Number(p.monto), 0);

    // c) Subtotal
    const subtotal = deudaAnt - pagosUnidad;

    // d) Prorrateos
    const ordinariasUnidad = (totalOrdinarias * porcentual) / 100;
    
    const cargosEspeciales = cargosMes.filter(c => c.unidadId === unidad.id);
    const cuotasExtra = cargosEspeciales.filter(c => c.concepto.toUpperCase().includes('CUOTA')).reduce((s, c) => s + Number(c.monto), 0);
    
    const extraordinariasUnidad = ((totalExtraordinarias * porcentual) / 100) + cuotasExtra;

    // e) Cargos Particulares
    const otrosCargos = cargosEspeciales.filter(c => !c.concepto.toUpperCase().includes('CUOTA')).reduce((s, c) => s + Number(c.monto), 0);

    // f) Total a Pagar
    const total = subtotal + ordinariasUnidad + extraordinariasUnidad + otrosCargos;

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
      cargos: otrosCargos,
      total: total
    };
  }));

  // --- CÁLCULO ESTADO DE CAJA ---
  let saldoCajaActual = 0; 
   
  const estadoCaja: any[] = []; 

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
    if (gasto.categoria !== CategoriaGasto.comision_pasarela) {
      saldoCajaActual -= Number(gasto.monto);
    }
    
    estadoCaja.push({
      tipo: gasto.categoria === CategoriaGasto.comision_pasarela ? "fondo" : "egreso",
      detalle: gasto.concepto,
      ingresos: null,
      ordinarias: gasto.categoria === CategoriaGasto.ordinario ? Number(gasto.monto) : null,
      extraordinaria: gasto.categoria === CategoriaGasto.fondo_comun ? Number(gasto.monto) : null,
      saldo: gasto.categoria !== CategoriaGasto.comision_pasarela ? saldoCajaActual : null,
      nota: null
    });
  });

  return {
    distribucion,
    estadoCaja,
    totalesCaja: {
      totalIngresos: pagosMes.reduce((s, p) => s + Number(p.monto), 0),
      totalOrdinarias,
      totalExtraordinarias,
      saldoFinal: saldoCajaActual,
    }
  };
}
