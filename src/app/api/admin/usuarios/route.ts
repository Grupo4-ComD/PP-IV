import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
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
        unidad: { numeroUf: 'asc' }
      }
    });

    return NextResponse.json(usuarios.map(u => ({
      id: u.id.toString(),
      username: u.nombreCompleto,
      email: u.email,
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

    const { id, email, nombreCompleto, rol, unidadId, newPassword } = await request.json();

    const updateData: any = {};
    
    if (rol) updateData.rol = rol;
    if (email) updateData.email = email;
    if (nombreCompleto) updateData.nombreCompleto = nombreCompleto;
    
    if (unidadId) {
      const ufNum = parseInt(unidadId);
      const uf = await prisma.unidad.findUnique({ where: { numeroUf: ufNum } });
      if (uf) updateData.unidadId = uf.id;
      else if (unidadId === "0") updateData.unidadId = null; // Admin sin unidad
    }

    // Actualizar datos locales en Prisma
    const updatedUser = await prisma.usuario.update({
      where: { id: BigInt(id) },
      data: updateData
    });

    // Si hay una nueva clave, actualizar también en Supabase Auth
    if (newPassword && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const targetEmail = email || updatedUser.email;
      
      // Buscar el usuario por email en Supabase
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (!listError && users) {
        const authUser = users.find(u => u.email === targetEmail);
        if (authUser) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            password: newPassword
          });
          if (updateError) console.error("Error actualizando auth:", updateError);
        } else {
          // Si el usuario no existe en Supabase Auth, lo creamos
          const { error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: targetEmail,
            password: newPassword,
            email_confirm: true
          });
          if (createError) console.error("Error creando auth:", createError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Usuarios error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

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
    const userRole = user.user_metadata?.rol || 'propietario';
    const isAdmin = userRole === 'admin' || (user.email && user.email.includes('admin'));
    if (!isAdmin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

    const { email, nombreCompleto, rol, unidadId } = await request.json();

    let uId = null;
    if (unidadId && unidadId !== "0") {
      const ufNum = parseInt(unidadId);
      const uf = await prisma.unidad.findUnique({ where: { numeroUf: ufNum } });
      if (uf) uId = uf.id;
    }

    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email,
        nombreCompleto,
        rol,
        unidadId: uId
      }
    });

    return NextResponse.json({ success: true, id: nuevoUsuario.id.toString() });
  } catch (error) {
    console.error("POST Usuarios error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
