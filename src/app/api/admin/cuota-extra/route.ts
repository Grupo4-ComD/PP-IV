import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { periodo, concepto, montoTotal } = await req.json();
    
    if (!periodo || !concepto || !montoTotal) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const [anio, mes] = periodo.split("-");
    const monto = parseFloat(montoTotal);

    if (isNaN(monto) || monto <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    // Traer todas las unidades
    const unidades = await prisma.unidad.findMany();

    if (unidades.length === 0) {
      return NextResponse.json({ error: "No hay unidades para distribuir" }, { status: 400 });
    }

    // Crear cargos para cada unidad
    const cargosPromesas = unidades.map((u) => {
      // El porcentual viene como Decimal, lo convertimos a Number.
      // Suponiendo que suma 100. (Ej. 10.50 => 10.5%)
      const porc = Number(u.porcentualCopropiedad) / 100;
      const montoProporcional = monto * porc;

      return prisma.cargoParticular.create({
        data: {
          unidadId: u.id,
          concepto: `Cuota Extra: ${concepto}`,
          monto: montoProporcional,
          periodoMes: Number(mes),
          periodoAnio: Number(anio),
        }
      });
    });

    await Promise.all(cargosPromesas);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al distribuir cuota extra:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
