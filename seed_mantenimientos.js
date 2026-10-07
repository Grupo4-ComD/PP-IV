const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.mantenimiento.upsert({
    where: { tipo: 'tanque_agua' },
    update: {},
    create: {
      tipo: 'tanque_agua',
      fechaUltimo: new Date('2025-08-12T00:00:00Z'),
      frecuenciaMeses: 12
    }
  });

  await prisma.mantenimiento.upsert({
    where: { tipo: 'matafuegos' },
    update: {},
    create: {
      tipo: 'matafuegos',
      fechaUltimo: new Date('2025-10-01T00:00:00Z'),
      frecuenciaMeses: 12
    }
  });

  console.log('Mantenimientos seeded');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
