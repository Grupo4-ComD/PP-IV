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

    let miUnidad = null;
    if (user && user.email) {
      const usuario = await prisma.usuario.findUnique({
        where: { email: user.email },
        include: { unidad: true }
      });
      if (usuario && usuario.unidad) {
        miUnidad = {
          id: Number(usuario.unidad.id),
          numero_uf: usuario.unidad.numeroUf,
          piso_depto: usuario.unidad.pisoDepto,
          propietario_nombre: usuario.nombreCompleto || usuario.unidad.propietarioNombre
        };
      }
    }

    const ticketsConPresupuestos = await prisma.ticketReclamo.findMany({
      where: { presupuestos: { some: {} } },
      include: {
        presupuestos: {
          include: {
            votos: {
              include: { unidad: true }
            }
          }
        }
      }
    });

    const temas = ticketsConPresupuestos.map(t => {
      const fechaCierre = new Date(t.fechaCreacion);
      fechaCierre.setDate(fechaCierre.getDate() + 15);
      const diasRestantes = Math.ceil((fechaCierre.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

      return {
        id: Number(t.id),
        ticket_code: `#TK-${t.id}`,
        titulo: t.titulo,
        descripcion: t.descripcion,
        fecha_cierre: fechaCierre.toLocaleDateString('es-AR'),
        dias_restantes: diasRestantes > 0 ? diasRestantes : 0,
        presupuestos: t.presupuestos.map(p => ({
          id: Number(p.id),
          ticket_id: Number(t.id),
          ticket_titulo: t.titulo,
          proveedor_nombre: p.proveedorNombre,
          contacto: 'Datos en adjunto',
          monto_total: Number(p.montoTotal),
          detalle: p.detalle,
          tiempo_ejecucion: 'A convenir',
          garantia: 'No especificada',
          pdf_url: p.pdfUrl || '#',
          votos_favor: p.votosFavor,
          votos_ufs: p.votos.map(v => v.unidad.numeroUf),
          estado: p.estado
        }))
      };
    });

    return NextResponse.json({ temas, miUnidad });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
