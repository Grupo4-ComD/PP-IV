import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

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

    const body = await request.json();
    const { limpiezaId } = body;

    if (!limpiezaId) return NextResponse.json({ error: 'ID de limpieza requerido' }, { status: 400 });

    const turno = await prisma.limpiezaRotativa.update({
      where: { id: BigInt(limpiezaId) },
      data: { estado: 'en_verificacion' }
    });

    return NextResponse.json({ success: true, estado: turno.estado });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
