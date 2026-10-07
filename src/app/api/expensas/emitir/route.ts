import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 1. Autenticación y Autorización
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const userRole = user.user_metadata?.rol || 'vecino';
    const isAdmin = userRole === 'admin' || (user.email && user.email.includes('admin'));
    
    if (!isAdmin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

    // 2. Obtener parámetros
    const { periodoMes, periodoAnio, fechaVencimiento, porcentajeFondoReserva = 5.0, forceOverride = false } = await request.json();

    // 2.1 Verificar Bloqueo (Advertencia de cierre)
    if (!forceOverride) {
      const existingExpensa = await prisma.expensa.findFirst({
        where: {
          periodoMes,
          periodoAnio
        }
      });

      if (existingExpensa) {
        return NextResponse.json(
          { error: 'Período ya emitido. Se requiere confirmación para sobrescribir.', requiresOverride: true },
          { status: 409 }
        );
      }
    }

    
    // 3. Consultar datos de la Base de Datos
    const unidades = await prisma.unidad.findMany();
    
    // Gastos del período indicado
    const startDate = new Date(periodoAnio, periodoMes - 1, 1);
    const endDate = new Date(periodoAnio, periodoMes, 0, 23, 59, 59);
    
    const gastos = await prisma.gasto.findMany({
      where: {
        fechaGasto: {
          gte: startDate,
          lte: endDate,
        }
      }
    });

    const cargos = await prisma.cargoParticular.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        }
      }
    });

    // 4. Cálculos del Motor de Prorrateo
    const totalGastosOrdinarios = gastos
      .filter(g => g.categoria === "ordinario")
      .reduce((acc, g) => acc + Number(g.monto), 0);

    const totalGastosExtraordinarios = gastos
      .filter(g => g.categoria === "extraordinario" || g.categoria === "fondo_comun")
      .reduce((acc, g) => acc + Number(g.monto), 0);

    const montoFondoReserva = Math.round(totalGastosOrdinarios * (porcentajeFondoReserva / 100));
    const totalProrratearOrdinario = totalGastosOrdinarios + montoFondoReserva;

    // 5. Generar lote de expensas
    for (const u of unidades) {
      const montoUfOrd = Math.round(totalProrratearOrdinario * (Number(u.coeficienteProrrateo) / 100));
      const montoUfExt = Math.round(totalGastosExtraordinarios * (Number(u.coeficienteProrrateo) / 100));
      const cargosUf = cargos
        .filter((c: any) => c.unidadId === u.id)
        .reduce((acc: number, c: any) => acc + Number(c.monto), 0);
      
      const montoUfTotal = montoUfOrd + montoUfExt + cargosUf;

      await prisma.expensa.upsert({
        where: {
          uq_unidad_periodo: {
            unidadId: u.id,
            periodoMes,
            periodoAnio,
          }
        },
        update: {
          montoOrdinario: montoUfOrd,
          montoExtraordinario: montoUfExt,
          montoCargos: cargosUf,
          totalPagar: montoUfTotal,
          fechaVencimiento: new Date(fechaVencimiento),
        },
        create: {
          unidadId: u.id,
          periodoMes,
          periodoAnio,
          montoOrdinario: montoUfOrd,
          montoExtraordinario: montoUfExt,
          montoCargos: cargosUf,
          recargoMora: 0,
          totalPagar: montoUfTotal,
          fechaVencimiento: new Date(fechaVencimiento),
          estado: 'pendiente'
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Liquidación emitida correctamente.' });
  } catch (error) {
    console.error("Emitir error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
