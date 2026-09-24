import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const count = await prisma.unidad.count();
    
    if (count > 0) {
      return NextResponse.json({ message: 'La base de datos ya tiene unidades.', count });
    }

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

    return NextResponse.json({ message: 'Base de datos inicializada exitosamente desde Vercel con 9 UFs.' });
  } catch (error: any) {
    console.error('Error seeding:', error);
    return NextResponse.json({ error: 'Error al inicializar la base de datos', details: error.message }, { status: 500 });
  }
}
