import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    await prisma.limpiezaRotativa.deleteMany();
    const unidades = await prisma.unidad.findMany({ orderBy: { numeroUf: 'asc' } });
    if (unidades.length === 0) return NextResponse.json({ error: 'No hay unidades' }, { status: 400 });
    
    const fechaBase = new Date('2026-01-12T00:00:00Z'); // Lunes semana 1
    const asignaciones = [];
    
    for (let i = 0; i < 52; i++) {
      const inicio = new Date(fechaBase);
      inicio.setDate(inicio.getDate() + (i * 7));
      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 6);
      
      const unidadAsignada = unidades[i % unidades.length];
      asignaciones.push({
        unidadIdAsignada: unidadAsignada.id,
        semanaInicio: inicio,
        semanaFin: fin,
        estado: 'cumplido' // por defecto, el cronJob lo evaluara. Para UI demo es programado/cumplido
      });
    }
    
    await prisma.limpiezaRotativa.createMany({ data: asignaciones });
    return NextResponse.json({ success: true, count: asignaciones.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
