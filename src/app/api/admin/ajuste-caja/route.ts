import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { periodo, motivo, monto, accion } = await req.json();
    
    let montoNum = parseFloat(monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    // Si es ingreso, registramos un gasto negativo para sumar a la caja.
    // Si es egreso, registramos un gasto positivo para restar de la caja.
    // Los ajustes de caja llevan sufijo _sd (sin descuento de expensas)
    // para que no afecten el prorrateo mensual de las expensas ordinarias/extraordinarias.
    if (accion === "ingreso") {
      montoNum = -Math.abs(montoNum);
    } else {
      montoNum = Math.abs(montoNum);
    }

    const [anio, mes] = periodo ? periodo.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];

    const ajuste = await prisma.gasto.create({
      data: {
        concepto: `Ajuste de caja (${periodo}): ${motivo} _sd`,
        monto: montoNum,
        categoria: "fondo_comun",
        periodoMes: mes || null,
        periodoAnio: anio || null,
        fechaGasto: new Date(),
      }
    });

    return NextResponse.json({ 
      success: true, 
      ajuste: { ...ajuste, id: ajuste.id.toString() } 
    });
  } catch (error) {
    console.error("Error al registrar ajuste de caja:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
