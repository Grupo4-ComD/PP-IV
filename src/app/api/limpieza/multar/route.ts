import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { turnoId, unidadIdInfractora, unidadIdSustituta } = await request.json();

    if (!turnoId || !unidadIdInfractora) {
      return NextResponse.json({ error: 'Parámetros incompletos' }, { status: 400 });
    }

    const turno = await prisma.limpiezaRotativa.findUnique({ where: { id: BigInt(turnoId) } });
    if (!turno) return NextResponse.json({ error: 'Turno no encontrado' }, { status: 404 });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Crear registro de Multa
    const multa = await prisma.multa.create({
      data: {
        unidadIdInfractora: BigInt(unidadIdInfractora),
        acreditadoAUnidadId: unidadIdSustituta ? BigInt(unidadIdSustituta) : null,
        monto: 24000,
        motivo: 'Incumplimiento de turno de limpieza rotativa',
      }
    });

    // 2. Insertar CargoParticular a la UF infractora (+)
    await prisma.cargoParticular.create({
      data: {
        unidadId: BigInt(unidadIdInfractora),
        concepto: 'Multa por incumplimiento limpieza rotativa',
        monto: 24000,
        periodoMes: currentMonth,
        periodoAnio: currentYear,
      }
    });

    // 3. Insertar Bonificación a la UF sustituta (-) si existe
    if (unidadIdSustituta) {
      await prisma.cargoParticular.create({
        data: {
          unidadId: BigInt(unidadIdSustituta),
          concepto: 'Bonificación por suplencia de limpieza',
          monto: -24000,
          periodoMes: currentMonth,
          periodoAnio: currentYear,
        }
      });
    }

    // 4. Actualizar el estado del turno
    await prisma.limpiezaRotativa.update({
      where: { id: BigInt(turnoId) },
      data: {
        estado: 'multado',
        unidadIdSustituta: unidadIdSustituta ? BigInt(unidadIdSustituta) : null
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Multa aplicada exitosamente' 
    });
  } catch (error) {
    console.error("Multar error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
