import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    await prisma.limpiezaRotativa.deleteMany();
    const unidades = await prisma.unidad.findMany({ orderBy: { numeroUf: 'asc' } });
    if (unidades.length === 0) return NextResponse.json({ error: 'No hay unidades' }, { status: 400 });
    
    const currentYear = new Date().getFullYear();
    const fechaBase = new Date(`${currentYear}-01-01T00:00:00Z`);
    // Ajustar al primer lunes del año
    while (fechaBase.getDay() !== 1) {
      fechaBase.setDate(fechaBase.getDate() + 1);
    }
    
    const asignaciones: any[] = [];
    
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
        estado: 'programado' // Las tareas futuras nacen programadas, no cumplidas
      });
    }
    
    await prisma.limpiezaRotativa.createMany({ data: asignaciones });
    return NextResponse.json({ success: true, count: asignaciones.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
