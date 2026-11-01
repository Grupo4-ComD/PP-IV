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

    // En lugar de aplicar la multa directamente de forma unilateral,
    // el turno pasa a 'en_verificacion' con la UF sustituta registrada para que
    // la Administradora lo revise y homologue desde su Dashboard Central (Segregación de funciones)
    await prisma.limpiezaRotativa.update({
      where: { id: BigInt(turnoId) },
      data: {
        estado: 'en_verificacion',
        unidadIdSustituta: unidadIdSustituta ? BigInt(unidadIdSustituta) : null,
        observaciones: `Denuncia radicada por UF 0${unidadIdSustituta}. Pendiente de homologación por la Administración.`,
      }
    });

    return NextResponse.json({ 
      success: true, 
      enRevision: true,
      message: 'Denuncia registrada con éxito. Queda pendiente de revisión y homologación por la Administradora.' 
    });
  } catch (error) {
    console.error("Multar error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
