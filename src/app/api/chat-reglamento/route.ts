import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "El mensaje es requerido." },
        { status: 400 }
      );
    }

    // Respuesta base / mock para la inicialización de la API de asistencia sobre reglamento
    const apiKey = process.env.GEMINI_API_KEY;
    
    // Si la clave no está configurada, devolver respuesta estructurada informativa
    if (!apiKey || apiKey === "your-gemini-api-key") {
      return NextResponse.json({
        response: `[Base de Conocimiento Reglamento 425] Hemos recibido su consulta: "${message}". El asistente con Gemini AI responderá automáticamente en base al reglamento de copropiedad una vez configurada la variable GEMINI_API_KEY.`,
        status: "ready",
      });
    }

    return NextResponse.json({
      response: `Consulta procesada para: "${message}".`,
      status: "success",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno procesando la consulta al reglamento." },
      { status: 500 }
    );
  }
}
