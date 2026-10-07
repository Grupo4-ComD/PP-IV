import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
    const userRole = user.user_metadata?.rol || 'propietario';
    const isAdmin = userRole === 'admin' || (user.email && user.email.includes('admin'));
    if (!isAdmin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

    const usuarios = await prisma.usuario.findMany({
      include: {
        unidad: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    return NextResponse.json(usuarios.map(u => ({
      id: u.id.toString(),
      username: u.username,
      rol: u.rol,
      unidadInfo: u.unidad ? `UF ${u.unidad.numeroUf} - ${u.unidad.pisoDepto}` : 'Sin Unidad'
    })));
  } catch (error) {
    console.error("GET Usuarios error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
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
    const userRole = user.user_metadata?.rol || 'propietario';
    const isAdmin = userRole === 'admin' || (user.email && user.email.includes('admin'));
    if (!isAdmin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

    const { id, newPassword, newRole } = await request.json();

    const updateData: any = {};
    if (newPassword) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }
    if (newRole) {
      updateData.rol = newRole;
    }

    await prisma.usuario.update({
      where: { id: BigInt(id) },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Usuarios error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
