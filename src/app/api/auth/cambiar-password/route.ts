import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validatePasswordSecurity } from '@/lib/validators/password';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Sesión no válida o expirada' }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword) {
      return NextResponse.json(
        { error: 'Debe ingresar la nueva contraseña' },
        { status: 400 }
      );
    }

    // 1. Validar política estricta de seguridad
    const validation = validatePasswordSecurity(newPassword);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error:
            'La contraseña no cumple con los requisitos de seguridad requeridos: ' +
            validation.errors.join(', '),
          detalles: validation.errors,
        },
        { status: 400 }
      );
    }

    // 2. Actualizar en Supabase Auth para el usuario en sesión
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Error al actualizar contraseña en Supabase:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'No se pudo actualizar la contraseña' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error: any) {
    console.error('Error en /api/auth/cambiar-password:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al procesar el cambio de contraseña' },
      { status: 500 }
    );
  }
}
