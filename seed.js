const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.unidad.count();
  console.log('Unidades count:', count);
  if (count === 0) {
    console.log('Seeding unidades...');
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
    console.log('Unidades seeded!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
