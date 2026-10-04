import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { periodo, motivo, monto, accion } = await req.json();
    
    let montoNum = parseFloat(monto);
    if (isNaN(montoNum)) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    // Si es ingreso, registramos un gasto negativo para sumar a la caja.
    // Si es egreso, registramos un gasto positivo para restar de la caja.
    if (accion === "ingreso") {
      montoNum = -Math.abs(montoNum);
    } else {
      montoNum = Math.abs(montoNum);
    }

    const ajuste = await prisma.gasto.create({
      data: {
        concepto: `Ajuste de caja (${periodo}): ${motivo}`,
        monto: montoNum,
        categoria: "fondo_comun",
        fechaGasto: new Date(),
      }
    });

    return NextResponse.json({ success: true, ajuste });
  } catch (error) {
    console.error("Error al registrar ajuste de caja:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
