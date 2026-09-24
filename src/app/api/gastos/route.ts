import { NextResponse } from 'next/server';
import { PrismaClient, CategoriaGasto } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get('mes');
  const anio = searchParams.get('anio');

  if (!mes || !anio) {
    return NextResponse.json({ error: 'Faltan parámetros mes y anio' }, { status: 400 });
  }

  const fechaInicio = new Date(Number(anio), Number(mes) - 1, 1);
  const fechaFin = new Date(Number(anio), Number(mes), 0, 23, 59, 59);

  try {
    const gastos = await prisma.gasto.findMany({
      where: {
        fechaGasto: {
          gte: fechaInicio,
          lte: fechaFin
        }
      },
      orderBy: { fechaGasto: 'desc' }
    });
    
    // Serializar BigInt a String
    const serializedGastos = gastos.map(g => ({
      ...g,
      id: g.id.toString()
    }));

    return NextResponse.json(serializedGastos);
  } catch (error) {
    console.error('Error fetching gastos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { concepto, monto, categoria, fechaGasto } = body;

    if (!concepto || !monto) {
      return NextResponse.json({ error: 'Concepto y monto son requeridos' }, { status: 400 });
    }

    const nuevoGasto = await prisma.gasto.create({
      data: {
        concepto,
        monto: Number(monto),
        categoria: (categoria as CategoriaGasto) || CategoriaGasto.ordinario,
        fechaGasto: fechaGasto ? new Date(fechaGasto) : new Date(),
      }
    });

    return NextResponse.json({ 
      ...nuevoGasto, 
      id: nuevoGasto.id.toString() 
    });
  } catch (error) {
    console.error('Error creating gasto:', error);
    return NextResponse.json({ error: 'Error al crear gasto' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    await prisma.gasto.delete({
      where: { id: BigInt(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gasto:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
