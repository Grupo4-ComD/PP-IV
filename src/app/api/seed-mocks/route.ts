import { NextResponse } from 'next/server';
import { PrismaClient, EstadoPago, CategoriaGasto, EstadoTicket, CategoriaTicket, EstadoLimpieza } from '@prisma/client';

export const dynamic = 'force-dynamic';
const prisma = new PrismaClient();

export async function GET() {
  try {
    // Verificar si ya hay gastos para no duplicar
    const checkGastos = await prisma.gasto.count();
    if (checkGastos > 0) {
      return NextResponse.json({ message: 'Los mocks ya fueron inyectados anteriormente.' });
    }

    // 1. GASTOS (Los hardcodeados originales)
    await prisma.gasto.createMany({
      data: [
        { concepto: 'Honorarios Administración (Agosto)', monto: 180000, categoria: CategoriaGasto.ordinario, fechaGasto: new Date('2026-08-05') },
        { concepto: 'Aysa - Agua corriente y cloacas', monto: 45000, categoria: CategoriaGasto.ordinario, fechaGasto: new Date('2026-08-10') },
        { concepto: 'Edesur - Luz espacios comunes', monto: 38500, categoria: CategoriaGasto.ordinario, fechaGasto: new Date('2026-08-12') },
        { concepto: 'Abl - Alumbrado barrido y limpieza', monto: 22000, categoria: CategoriaGasto.ordinario, fechaGasto: new Date('2026-08-15') },
        { concepto: 'Mantenimiento Ascensores (Preventivo)', monto: 65000, categoria: CategoriaGasto.ordinario, fechaGasto: new Date('2026-08-18') },
        { concepto: 'Fondo de Reserva Ext. (Pintura pasillos)', monto: 120000, categoria: CategoriaGasto.fondo_comun, fechaGasto: new Date('2026-08-20') },
        { concepto: 'Seguro Integral de Consorcio', monto: 55000, categoria: CategoriaGasto.ordinario, fechaGasto: new Date('2026-08-25') },
      ]
    });

    // 2. PAGOS DE VECINOS (Simulando pagos del mes anterior - Mes 7)
    await prisma.pagoVecino.createMany({
      data: [
        { unidadId: BigInt(1), monto: 35000, periodoMes: 7, periodoAnio: 2026, fechaPago: new Date('2026-07-05'), estado: EstadoPago.aprobado },
        { unidadId: BigInt(2), monto: 35000, periodoMes: 7, periodoAnio: 2026, fechaPago: new Date('2026-07-08'), estado: EstadoPago.aprobado },
        { unidadId: BigInt(3), monto: 48500, periodoMes: 7, periodoAnio: 2026, fechaPago: new Date('2026-07-10'), estado: EstadoPago.aprobado },
        { unidadId: BigInt(5), monto: 40000, periodoMes: 7, periodoAnio: 2026, fechaPago: new Date('2026-07-12'), estado: EstadoPago.aprobado },
        { unidadId: BigInt(6), monto: 42000, periodoMes: 7, periodoAnio: 2026, fechaPago: new Date('2026-07-15'), estado: EstadoPago.aprobado },
        { unidadId: BigInt(7), monto: 60000, periodoMes: 7, periodoAnio: 2026, fechaPago: new Date('2026-07-02'), estado: EstadoPago.aprobado }, // UF 7 (Guillermo) pago OK
        { unidadId: BigInt(8), monto: 60000, periodoMes: 7, periodoAnio: 2026, fechaPago: new Date('2026-07-05'), estado: EstadoPago.aprobado },
        { unidadId: BigInt(9), monto: 55000, periodoMes: 7, periodoAnio: 2026, fechaPago: new Date('2026-07-09'), estado: EstadoPago.aprobado },
        // UF 4 (Carlos) NO PAGÓ EL MES 7 (Generará mora real)
      ]
    });

    // 3. TICKETS DE RECLAMOS
    await prisma.ticketReclamo.createMany({
      data: [
        { unidadId: BigInt(3), titulo: 'Humedad en techo baño', descripcion: 'Mancha que crece desde el piso de arriba', categoria: CategoriaTicket.plomeria, estado: EstadoTicket.abierto },
        { unidadId: BigInt(7), titulo: 'Luz quemada palier 2do piso', descripcion: 'Foco parpadea y se apaga', categoria: CategoriaTicket.electricidad, estado: EstadoTicket.en_revision },
      ]
    });

    // 4. LIMPIEZA ROTATIVA
    await prisma.limpiezaRotativa.createMany({
      data: [
        { unidadIdAsignada: BigInt(7), semanaInicio: new Date('2026-09-22'), semanaFin: new Date('2026-09-28'), estado: EstadoLimpieza.cumplido }
      ]
    });

    return NextResponse.json({ message: 'Todos los datos hardcodeados (gastos, pagos, tickets y limpieza) fueron inyectados a las tablas exitosamente.' });

  } catch (error: any) {
    console.error('Error seeding mocks:', error);
    return NextResponse.json({ error: 'Error inyectando mocks', details: error.message }, { status: 500 });
  }
}
