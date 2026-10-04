const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el Sembrado (Seed) completo de datos...');

  // 1. UNIDADES (Solo si no existen)
  let countUnidades = await prisma.unidad.count();
  if (countUnidades === 0) {
    console.log('Creando Unidades...');
    await prisma.unidad.createMany({
      data: [
        { numeroUf: 1, pisoDepto: 'PB A', propietarioNombre: 'Paula Administradora', email: 'paula.admin@calle425.com', coeficienteProrrateo: 7.60, saldoAnteriorInicial: 0 },
        { numeroUf: 2, pisoDepto: 'PB B', propietarioNombre: 'González, Mario', email: 'mario.gonzalez@calle425.com', coeficienteProrrateo: 7.60, saldoAnteriorInicial: 0 },
        { numeroUf: 3, pisoDepto: 'PB C', propietarioNombre: 'Martínez, Laura', email: 'laura.martinez@calle425.com', coeficienteProrrateo: 11.20, saldoAnteriorInicial: 0 },
        { numeroUf: 4, pisoDepto: '1° A', propietarioNombre: 'Rodríguez, Carlos', email: 'carlos.rodriguez@calle425.com', coeficienteProrrateo: 9.20, saldoAnteriorInicial: 155000 },
        { numeroUf: 5, pisoDepto: '1° B', propietarioNombre: 'Fernández, Lucía', email: 'lucia.fernandez@calle425.com', coeficienteProrrateo: 9.20, saldoAnteriorInicial: 0 },
        { numeroUf: 6, pisoDepto: '1° C', propietarioNombre: 'López, Diego', email: 'diego.lopez@calle425.com', coeficienteProrrateo: 9.50, saldoAnteriorInicial: 0 },
        { numeroUf: 7, pisoDepto: '2° A', propietarioNombre: 'Sciulli, Guillermo', email: 'gsciulli@calle425.com', coeficienteProrrateo: 15.70, saldoAnteriorInicial: 0 },
        { numeroUf: 8, pisoDepto: '2° B', propietarioNombre: 'Greco, Verónica', email: 'veronica.greco@calle425.com', coeficienteProrrateo: 15.70, saldoAnteriorInicial: 0 },
        { numeroUf: 9, pisoDepto: '2° C', propietarioNombre: 'Perea, Braian', email: 'braian.perea@calle425.com', coeficienteProrrateo: 14.30, saldoAnteriorInicial: 0 }
      ]
    });
  }

  const unidades = await prisma.unidad.findMany();
  const uf3 = unidades.find(u => u.numeroUf === 3);
  const uf4 = unidades.find(u => u.numeroUf === 4);
  const uf7 = unidades.find(u => u.numeroUf === 7);

  // 2. GASTOS DEL CONSORCIO
  const countGastos = await prisma.gasto.count();
  if (countGastos === 0) {
    console.log('Creando Gastos Ordinarios...');
    await prisma.gasto.createMany({
      data: [
        { concepto: 'Factura Edesur - Espacios Comunes', monto: 45000.50, categoria: 'ordinario', fechaGasto: new Date() },
        { concepto: 'Aysa - Agua Corriente', monto: 28300.00, categoria: 'ordinario', fechaGasto: new Date() },
        { concepto: 'Abono Ascensores Elevadores Sur', monto: 85000.00, categoria: 'ordinario', fechaGasto: new Date() },
        { concepto: 'Reparación portón cochera', monto: 120000.00, categoria: 'extraordinario', fechaGasto: new Date() }
      ]
    });
  }

  // 3. EXPENSAS
  const countExpensas = await prisma.expensa.count();
  if (countExpensas === 0 && uf3 && uf4 && uf7) {
    console.log('Creando Expensas...');
    await prisma.expensa.createMany({
      data: [
        { unidadId: uf3.id, periodoMes: 10, periodoAnio: 2026, montoOrdinario: 55000, montoExtraordinario: 10000, montoCargos: 0, recargoMora: 0, totalPagar: 65000, fechaVencimiento: new Date('2026-10-10'), estado: 'pendiente' },
        { unidadId: uf4.id, periodoMes: 10, periodoAnio: 2026, montoOrdinario: 45000, montoExtraordinario: 8000, montoCargos: 24000, recargoMora: 5000, totalPagar: 82000, fechaVencimiento: new Date('2026-10-10'), estado: 'pendiente' },
        { unidadId: uf7.id, periodoMes: 10, periodoAnio: 2026, montoOrdinario: 75000, montoExtraordinario: 15000, montoCargos: 0, recargoMora: 0, totalPagar: 90000, fechaVencimiento: new Date('2026-10-10'), estado: 'pagado', fechaPago: new Date() }
      ]
    });
  }

  // 4. PAGOS
  const countPagos = await prisma.pagoVecino.count();
  if (countPagos === 0 && uf7) {
    console.log('Creando Pagos...');
    await prisma.pagoVecino.create({
      data: {
        unidadId: uf7.id, monto: 90000, fechaPago: new Date(), periodoMes: 10, periodoAnio: 2026, estado: 'aprobado', comprobanteUrl: 'https://ejemplo.com/comprobante.pdf'
      }
    });
  }

  // 5. TICKETS DE RECLAMO
  const countTickets = await prisma.ticketReclamo.count();
  if (countTickets === 0 && uf3) {
    console.log('Creando Tickets y Presupuestos...');
    const ticket = await prisma.ticketReclamo.create({
      data: {
        unidadId: uf3.id, titulo: 'Filtración de agua en techo del baño', descripcion: 'Hace dos días empezó a gotear el techo del baño, justo debajo de la terraza.', categoria: 'plomeria', estado: 'en_revision'
      }
    });

    await prisma.presupuestoVotacion.create({
      data: {
        ticketId: ticket.id, proveedorNombre: 'Plomería Hermanos Mario', montoTotal: 150000, detalle: 'Reparación de caño principal y albañilería', votosFavor: 2, estado: 'en_votacion'
      }
    });
  }

  // 6. LIMPIEZA ROTATIVA DE TODO EL CICLO (9 Semanas) Y MULTAS
  // Borramos las anteriores (si hay) para regenerar un ciclo limpio entero
  console.log('Generando Cronograma Completo de Limpiezas...');
  await prisma.multa.deleteMany();
  await prisma.limpiezaRotativa.deleteMany();

  const limpiezasData = [];
  // Empezamos un lunes reciente (ej. Septiembre de 2026)
  let fechaInicio = new Date('2026-09-07T00:00:00Z'); 
  
  // Ordenar las unidades por número
  const unidadesOrdenadas = [...unidades].sort((a, b) => a.numeroUf - b.numeroUf);
  
  for (let i = 0; i < unidadesOrdenadas.length; i++) {
    const u = unidadesOrdenadas[i];
    const fin = new Date(fechaInicio);
    fin.setDate(fin.getDate() + 6); // Domingo
    
    let estado = 'cumplido'; // default
    let observaciones = null;
    
    // Simular que las primeras 3 semanas ya pasaron y tienen estados diferentes
    if (i === 0) { estado = 'cumplido'; observaciones = 'Espacios limpios correctamente.'; }
    else if (i === 1) { estado = 'multado'; observaciones = 'No sacó la basura en toda la semana ni limpió ascensores.'; }
    else if (i === 2) { estado = 'cumplido'; }
    // A partir del índice 3 (semana 4) será "pendiente" (turno actual o futuro)
    
    limpiezasData.push({
      unidadIdAsignada: u.id,
      semanaInicio: new Date(fechaInicio),
      semanaFin: new Date(fin),
      estado: estado,
      observaciones: observaciones
    });
    
    // Avanzar a la próxima semana
    fechaInicio.setDate(fechaInicio.getDate() + 7);
  }

  await prisma.limpiezaRotativa.createMany({ data: limpiezasData });

  // Crear multa a la UF que fue "multada" en el ciclo (UF 2)
  const uf2 = unidadesOrdenadas.find(u => u.numeroUf === 2);
  if (uf2) {
    await prisma.multa.create({
      data: {
        unidadIdInfractora: uf2.id, monto: 24000.00, motivo: 'Incumplimiento de turno de limpieza rotativa (Semana 2)', pagada: false
      }
    });
  }

  console.log('✅ ¡Población de datos completa en todas las tablas!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
