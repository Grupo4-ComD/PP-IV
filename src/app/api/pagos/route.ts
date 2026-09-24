import { NextResponse } from 'next/server';
import { PrismaClient, EstadoPago } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { unidadId, monto, periodoMes, periodoAnio, fechaPago } = body;

    if (!unidadId || !monto) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios' }, { status: 400 });
    }

    const nuevoPago = await prisma.pagoVecino.create({
      data: {
        unidadId: BigInt(unidadId),
        monto: Number(monto),
        periodoMes: Number(periodoMes),
        periodoAnio: Number(periodoAnio),
        fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
        estado: EstadoPago.aprobado // Ingresado por Admin, entra aprobado directo
      }
    });

    return NextResponse.json({ 
      success: true, 
      id: nuevoPago.id.toString() 
    });
  } catch (error) {
    console.error('Error registrando cobro:', error);
    return NextResponse.json({ error: 'Error interno al registrar cobro' }, { status: 500 });
  }
}
