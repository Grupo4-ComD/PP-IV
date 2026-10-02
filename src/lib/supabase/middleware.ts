import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isVecinoRoute = request.nextUrl.pathname.startsWith('/vecino');

  // 1. Si no hay usuario y trata de acceder a rutas protegidas, mandar al login
  if (!user && (isAdminRoute || isVecinoRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Si hay usuario, validar rol si trata de entrar a /admin o /vecino
  if (user) {
    const userRole = user.user_metadata?.rol || 'vecino'; // asumiendo que guardamos el rol en metadata
    const userEmail = user.email || '';

    const isAdmin = userRole === 'admin' || userEmail.includes('admin');
    
    // Si es login y ya está autenticado, mandarlo a su dashboard
    if (isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = isAdmin ? '/admin/dashboard' : '/vecino/dashboard';
      return NextResponse.redirect(url);
    }

    // Proteger /admin
    if (isAdminRoute && !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/vecino/dashboard';
      return NextResponse.redirect(url);
    }

    // Proteger /vecino
    if (isVecinoRoute && isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
