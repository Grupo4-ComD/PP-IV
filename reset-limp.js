const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function reset() {
  await p.limpiezaRotativa.updateMany({
    where: {
      semanaInicio: { lte: new Date() },
      semanaFin: { gte: new Date() }
    },
    data: { estado: 'programado' }
  });
  console.log("Turnos de esta semana reseteados a 'programado'.");
  await p.$disconnect();
}
reset();
