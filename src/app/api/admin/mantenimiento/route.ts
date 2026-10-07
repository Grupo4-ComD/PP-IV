import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const mantenimientos = await prisma.mantenimiento.findMany();
    return NextResponse.json({ success: true, mantenimientos });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener mantenimientos' }, { status: 500 });
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
    const { tipo, fechaUltimo, frecuenciaMeses } = body;

    const data: any = {};
    if (fechaUltimo) data.fechaUltimo = new Date(fechaUltimo);
    if (frecuenciaMeses) data.frecuenciaMeses = parseInt(frecuenciaMeses);

    const result = await prisma.mantenimiento.upsert({
      where: { tipo },
      update: data,
      create: {
        tipo,
        fechaUltimo: new Date(fechaUltimo),
        frecuenciaMeses: parseInt(frecuenciaMeses || '12')
      }
    });

    return NextResponse.json({ success: true, mantenimiento: result });
  } catch (error) {
    console.error("Mantenimiento error:", error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
