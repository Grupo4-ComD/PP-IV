import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from "next/server";

const REGLAMENTO_SISTEMA_PROMPT = `
Eres el Asistente Virtual del "Consorcio de Propietarios Calle 425 - Rodríguez Peña 1454" (Santos Lugares, Tres de Febrero).
Tu objetivo es responder dudas sobre el Reglamento de Copropiedad y Administración a los vecinos de las 9 Unidades Funcionales.

RESUMEN DEL REGLAMENTO DE COPROPIEDAD:
- Cláusula Cuarta (Destino): Las Unidades Funcionales están destinadas exclusivamente a vivienda familiar.
- Cláusula Quinta (Reparaciones): Cada propietario debe realizar de inmediato reparaciones cuya omisión pueda causar daños a otras unidades o áreas comunes. Además, es obligatorio permitir el acceso a su unidad a personas encargadas de proyectar o inspeccionar trabajos de interés común.
- Cláusula Sexta (Prohibiciones): Prohibido hacer uso indebido de la unidad contrariando la moral, buenas costumbres o disposiciones municipales. ESTÁ ESTRICTAMENTE PROHIBIDO estacionar bicicletas, motocicletas o dejar cosa alguna sobre el pasillo.
- Cláusula Séptima (Bienes Comunes): Su uso debe ajustarse a su destino y leyes vigentes.
- Cláusula Octava y Novena (Expensas): Se deben abonar hasta el día 10 de cada mes. Vencidos los plazos, los importes adeudados devengarán un interés punitorio del 0,2% a favor del Consorcio, por cada mes o fracción de demora, en forma automática.
- Cláusulas Décima a Duodécima (Asambleas): Es la máxima autoridad. Las citaciones requieren 15 días de anticipación.
- Mesa de Ayuda: Si la situación requiere inspección, intervención directa, o no está especificada en el reglamento, indica claramente que deben crear un ticket en la Mesa de Ayuda (/vecino/mesa-ayuda).

REGLAS DE RESPUESTA:
1. Responde de forma amable, concisa y profesional.
2. Cita siempre la cláusula correspondiente del reglamento original (ej. "Según la Cláusula Sexta...").
3. Deriva a la Mesa de Ayuda (/vecino/mesa-ayuda) cuando sea pertinente.
`;

// Opcional, forzar entorno de ejecución
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // Si no hay clave real configurada o es "demo", usamos el motor inteligente de reglas local
    if (!apiKey || apiKey === "demo" || apiKey === "your-gemini-api-key" || apiKey.startsWith("AIzaSyTuClave")) {
      const lastMessage = messages[messages.length - 1];
      const respuestaLocal = generarRespuestaLocal(lastMessage?.content || "");
      return createFallbackStream(respuestaLocal);
    }

    try {
      const google = createGoogleGenerativeAI({ apiKey });
      const result = await streamText({
        model: google('gemini-1.5-flash'),
        system: REGLAMENTO_SISTEMA_PROMPT,
        messages,
      });

      return result.toDataStreamResponse();
    } catch (apiError: any) {
      console.warn("Error invocando Gemini API, usando motor de respaldo:", apiError);
      const lastMessage = messages[messages.length - 1];
      const fallback = generarRespuestaLocal(lastMessage?.content || "") + "\n\n(DEBUG INFO: " + (apiError?.message || "Unknown error") + ")";
      return createFallbackStream(fallback);
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Ocurrió un error al procesar la consulta." },
      { status: 500 }
    );
  }
}

function createFallbackStream(text: string) {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`0:${JSON.stringify(text)}\n`));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 
      'X-Vercel-AI-Data-Stream': 'v1',
      'Content-Type': 'text/plain; charset=utf-8'
    },
  });
}

// Motor de reglas local con conocimiento del reglamento
function generarRespuestaLocal(pregunta: string): string {
  const p = pregunta.toLowerCase();

  if (p.includes("pasillo") || p.includes("bicicleta") || p.includes("moto") || p.includes("dejar") || p.includes("prohibid")) {
    return (
      "🚫 **Prohibiciones en espacios comunes (Cláusula Sexta):**\n" +
      "• Queda **estrictamente prohibido estacionar bicicletas, motocicletas o dejar cosa alguna sobre el pasillo**.\n" +
      "• No se debe hacer un uso indebido de la unidad que contraríe la moral o buenas costumbres."
    );
  }

  if (p.includes("expensa") || p.includes("pago") || p.includes("vencimiento") || p.includes("interes") || p.includes("mora")) {
    return (
      "💰 **Pago de Expensas (Cláusula Novena):**\n" +
      "• Las expensas deben abonarse hasta el **día 10 de cada mes**.\n" +
      "• Vencido el plazo, se aplica automáticamente un **interés punitorio del 0,2%** por cada mes o fracción de demora."
    );
  }

  if (p.includes("destino") || p.includes("comercial") || p.includes("profesional") || p.includes("oficina") || p.includes("vivienda")) {
    return (
      "🏠 **Destino de las Unidades (Cláusula Cuarta):**\n" +
      "• Las Unidades Funcionales están destinadas exclusivamente a **vivienda familiar**.\n" +
      "• Solo podrán destinarse a consultorios profesionales si las normas así lo permiten y es aprobado."
    );
  }

  if (p.includes("reparacion") || p.includes("daño") || p.includes("arreglo") || p.includes("ingreso") || p.includes("humedad")) {
    return (
      "🔧 **Reparaciones (Cláusula Quinta):**\n" +
      "• Cada propietario debe efectuar de inmediato las reparaciones que puedan causar daños a otras unidades o partes comunes.\n" +
      "• Es obligatorio **permitir el ingreso a la unidad** a las personas encargadas de inspeccionar o realizar trabajos de interés común."
    );
  }

  if (p.includes("hola") || p.includes("buen dia") || p.includes("buenas tardes") || p.includes("saludo") || p.includes("ayuda")) {
    return (
      "¡Hola! Soy el Asistente Virtual del Consorcio Calle 425 en mi versión de respaldo. Todavía no me han configurado mi inteligencia avanzada, pero conozco las reglas básicas.\n\n" +
      "Pregúntame sobre:\n" +
      "• Pasillos y bicicletas\n" +
      "• Pago de expensas y vencimientos\n" +
      "• Destino de las unidades (vivienda)\n" +
      "• Reparaciones y arreglos"
    );
  }

  // Respuesta general de triaje recomendando la Mesa de Ayuda
  return (
    "Hola vecino/a. Para este requerimiento específico o situación que requiere inspección y gestión directa, le recomendamos abrir un ticket en la **Mesa de Ayuda ITIL** (`/vecino/mesa-ayuda`).\n\n" +
    "Allí la administración podrá intervenir y darle seguimiento."
  );
}
