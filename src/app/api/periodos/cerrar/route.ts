import { NextResponse } from 'next/server';
import { PrismaClient, EstadoPeriodo } from '@prisma/client';
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
    const userRole = user.user_metadata?.rol || 'vecino';
    const isAdmin = userRole === 'admin' || (user.email && user.email.includes('admin'));
    if (!isAdmin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

    const { periodoMes, periodoAnio, accion = 'cerrar' } = await request.json();

    if (!periodoMes || !periodoAnio) {
      return NextResponse.json({ error: 'Faltan parámetros periodoMes y periodoAnio' }, { status: 400 });
    }

    const mes = Number(periodoMes);
    const anio = Number(periodoAnio);

    const nuevoEstado = accion === 'cerrar' ? EstadoPeriodo.cerrado_bloqueado : EstadoPeriodo.abierto;

    const periodo = await prisma.periodoFinalizado.upsert({
      where: {
        uq_periodo_cierre: {
          periodoMes: mes,
          periodoAnio: anio,
        },
      },
      update: {
        estado: nuevoEstado,
        fechaCierre: accion === 'cerrar' ? new Date() : null,
        cerradoPor: accion === 'cerrar' ? (user.email || 'Admin') : null,
      },
      create: {
        periodoMes: mes,
        periodoAnio: anio,
        estado: nuevoEstado,
        fechaCierre: accion === 'cerrar' ? new Date() : null,
        cerradoPor: accion === 'cerrar' ? (user.email || 'Admin') : null,
      },
    });

    return NextResponse.json({
      success: true,
      periodo: {
        id: periodo.id.toString(),
        mes: periodo.periodoMes,
        anio: periodo.periodoAnio,
        estado: periodo.estado,
        fechaCierre: periodo.fechaCierre,
        cerradoPor: periodo.cerradoPor,
      },
      message: accion === 'cerrar'
        ? `Período ${mes}/${anio} cerrado y bloqueado por seguridad contable (RF-08).`
        : `Período ${mes}/${anio} reabierto para edición.`,
    });
  } catch (error: any) {
    console.error('Error cerrando período:', error);
    return NextResponse.json({ error: error?.message || 'Error al procesar el cierre del período' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('periodoMes');
    const anio = searchParams.get('periodoAnio');

    if (!mes || !anio) {
      const periodos = await prisma.periodoFinalizado.findMany({
        orderBy: [{ periodoAnio: 'desc' }, { periodoMes: 'desc' }],
      });
      return NextResponse.json(
        periodos.map((p) => ({
          ...p,
          id: p.id.toString(),
        }))
      );
    }

    const periodo = await prisma.periodoFinalizado.findUnique({
      where: {
        uq_periodo_cierre: {
          periodoMes: Number(mes),
          periodoAnio: Number(anio),
        },
      },
    });

    return NextResponse.json(
      periodo
        ? {
            ...periodo,
            id: periodo.id.toString(),
          }
        : null
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error al consultar estado del período' }, { status: 500 });
  }
}
