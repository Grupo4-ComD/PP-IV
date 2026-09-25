import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    await prisma.unidad.createMany({
      data: [
        { numeroUf: 1, pisoDepto: 'PB A', propietarioNombre: 'Paula Administradora', email: 'paula@mail.com', coeficienteProrrateo: 10.00 },
        { numeroUf: 2, pisoDepto: 'PB B', propietarioNombre: 'González, Mario', email: 'mario@mail.com', coeficienteProrrateo: 10.00 },
        { numeroUf: 3, pisoDepto: 'Piso 1 A', propietarioNombre: 'Martínez, Laura', email: 'laura@mail.com', coeficienteProrrateo: 12.00 },
        { numeroUf: 4, pisoDepto: 'Piso 1 B', propietarioNombre: 'Rodríguez, Carlos', email: 'carlos@mail.com', coeficienteProrrateo: 10.00 },
        { numeroUf: 5, pisoDepto: 'Piso 1 C', propietarioNombre: 'Fernández, Ana', email: 'ana@mail.com', coeficienteProrrateo: 10.00 },
        { numeroUf: 6, pisoDepto: 'Piso 2 A', propietarioNombre: 'García, Pedro', email: 'pedro@mail.com', coeficienteProrrateo: 12.00 },
        { numeroUf: 7, pisoDepto: 'Piso 2 B', propietarioNombre: 'Sciulli, Guillermo', email: 'guillermo@mail.com', coeficienteProrrateo: 15.00 },
        { numeroUf: 8, pisoDepto: 'Piso 3 A', propietarioNombre: 'López, María', email: 'maria@mail.com', coeficienteProrrateo: 11.00 },
        { numeroUf: 9, pisoDepto: 'Piso 3 B', propietarioNombre: 'Díaz, Juan', email: 'juan@mail.com', coeficienteProrrateo: 10.00 }
      ]
    });
    return NextResponse.json({ message: 'Unidades inyectadas' });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
