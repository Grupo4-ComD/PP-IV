import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
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

    const unidades = await prisma.unidad.findMany({
      orderBy: { numeroUf: 'asc' }
    });

    const unidadesFormatted = unidades.map(u => ({
      ...u,
      id: u.id.toString(),
      coeficienteProrrateo: Number(u.coeficienteProrrateo),
      saldoAnteriorInicial: Number(u.saldoAnteriorInicial)
    }));

    return NextResponse.json(unidadesFormatted);
  } catch (error) {
    console.error("GET Unidades error:", error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
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

    const body = await request.json();
    const { id, pisoDepto, propietarioNombre, email, coeficienteProrrateo } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const updated = await prisma.unidad.update({
      where: { id: BigInt(id) },
      data: {
        pisoDepto,
        propietarioNombre,
        email,
        coeficienteProrrateo
      }
    });

    return NextResponse.json({ 
      success: true, 
      unidad: {
        ...updated,
        id: updated.id.toString(),
        coeficienteProrrateo: Number(updated.coeficienteProrrateo),
        saldoAnteriorInicial: Number(updated.saldoAnteriorInicial)
      } 
    });
  } catch (error) {
    console.error("PATCH Unidad error:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
