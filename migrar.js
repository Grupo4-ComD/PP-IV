const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const unidades = await prisma.unidad.findMany();
  for (const u of unidades) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nombreCompleto: u.propietarioNombre, rol: u.rolUser, unidadId: u.id },
      create: { email: u.email, nombreCompleto: u.propietarioNombre, rol: u.rolUser, unidadId: u.id }
    });
  }
  // Admin explícito
  await prisma.usuario.upsert({
    where: { email: 'admin@consorciocalle425.com' },
    update: { nombreCompleto: 'Paula Administradora', rol: 'admin' },
    create: { email: 'admin@consorciocalle425.com', nombreCompleto: 'Paula Administradora', rol: 'admin' }
  });
  console.log('Migracion lista');
}
main().catch(console.error).finally(()=>prisma.$disconnect());
