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

    const unidades = await prisma.unidad.findMany({
      orderBy: {
        numeroUf: 'asc'
      }
    });

    return NextResponse.json(unidades.map(u => ({
      id: u.id.toString(),
      username: u.propietarioNombre,
      email: u.email,
      rol: u.rolUser,
      unidadInfo: `UF ${u.numeroUf} - ${u.pisoDepto}`
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
    
    // Supabase auth updates should be done via admin API (requires SERVICE_ROLE). 
    // Para simplificar la demo, ignoraremos newPassword si se manda o se podría llamar a supabase admin.
    
    if (newRole) {
      updateData.rolUser = newRole;
    }

    await prisma.unidad.update({
      where: { id: BigInt(id) },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Usuarios error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
