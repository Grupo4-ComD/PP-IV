import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mes = searchParams.get('mes');
  const anio = searchParams.get('anio');
  
  if (!mes || !anio) return NextResponse.json({ error: 'Faltan parametros' }, { status: 400 });
  
  try {
    const cargos = await prisma.cargoParticular.findMany({
      where: { periodoMes: Number(mes), periodoAnio: Number(anio) }
    });
    const serializados = cargos.map(c => ({ ...c, id: c.id.toString(), unidadId: c.unidadId.toString() }));
    return NextResponse.json(serializados);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { unidadId, concepto, monto, periodo } = await request.json();
    if (!unidadId || !concepto || !monto || !periodo) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 });
    }

    const [anio, mes] = periodo.split('-');
    
    const nuevoCargo = await prisma.cargoParticular.create({
      data: {
        unidadId: BigInt(unidadId),
        concepto,
        monto: Number(monto),
        periodoMes: Number(mes),
        periodoAnio: Number(anio)
      }
    });

    return NextResponse.json({ success: true, id: nuevoCargo.id.toString() });
  } catch (error) {
    console.error("Error al crear cargo particular:", error);
    return NextResponse.json({ error: 'Error al crear cargo' }, { status: 500 });
  }
}
