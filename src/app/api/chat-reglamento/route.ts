import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { NextResponse } from "next/server";

const REGLAMENTO_SISTEMA_PROMPT = `
Eres el "Asistente Virtual de Convivencia y Reglamento" del Consorcio Inteligente Calle 425 (Proyecto DeveloPet Friendly).
Tu objetivo es responder las dudas de los vecinos y copropietarios de las 9 Unidades Funcionales (UF 01 a UF 09) de manera cordial, clara y precisa.

REGLAMENTO DE COPROPIEDAD Y CONVIVENCIA DEL CONSORCIO CALLE 425:
- Art. 1 - Tenencia Responsable de Mascotas (DeveloPet Friendly):
  * Se permite la tenencia responsable de animales domésticos (máximo 2 mascotas por UF).
  * En pasillos, palieres, escaleras y áreas comunes, las mascotas deben circular SIEMPRE con correa y pretal bajo supervisión de un adulto. Prohibido transitar con mascotas sueltas.
  * Queda estrictamente prohibido dejar mascotas solas en balcones o patios en horarios de descanso si emiten ladridos o llantos continuos.
  * Es obligación ineludible del responsable limpiar de inmediato cualquier desecho en áreas comunes o vereda.

- Art. 2 - Ruidos Molestos y Horarios de Descanso:
  * Horarios de descanso estricto:
    - Lunes a Viernes: de 13:00 a 15:00 hs y de 22:00 a 08:00 hs.
    - Sábados, Domingos y Feriados: de 14:00 a 17:00 hs y de 23:00 a 09:00 hs.
  * Trabajos de obra, refacciones, agujereadoras y taladros: ÚNICAMENTE permitidos en días hábiles de Lunes a Viernes de 09:00 a 18:00 hs y Sábados de 09:00 a 13:00 hs.

- Art. 3 - Recolección y Disposición de Residuos:
  * Las bolsas de residuos deben estar debidamente cerradas y depositarse en el canasto exterior de la vereda EXCLUSIVAMENTE de Domingos a Viernes entre las 19:00 y las 20:30 hs.
  * Prohibido dejar bolsas de basura en palieres, puertas de departamentos o pasillos fuera de ese horario.
  * Reciclables limpios y secos van al cesto verde identificado.

- Art. 4 - Uso de Espacios Comunes, Terraza y Parrilla:
  * La terraza y sector común están habilitados de 09:00 a 22:00 hs con previa reserva en el sistema.
  * Cada unidad debe dejar el espacio en perfectas condiciones de higiene tras su uso.

- Art. 5 - Procedimiento de Mudanzas:
  * Deben notificarse y coordinarse con la administración con al menos 48 hs de antelación.
  * Horarios autorizados de mudanza: Lunes a Viernes de 09:00 a 17:00 hs y Sábados de 09:00 a 13:00 hs.

- Art. 6 - Cronograma de Limpieza Rotativo y Régimen de Sanciones:
  * La limpieza de pasillos y escaleras es autogestiva y rotativa semanal entre las 9 UFs.
  * Si una UF no realiza la guardia y no acordó permuta, se le aplica una MULTA AUTOMÁTICA de $24.000 (Art. 9) imputada en su próxima expensa, la cual se transfiere como crédito a favor de la UF que realice la suplencia.

REGLAS DE RESPUESTA:
1. Responde de forma amable, concisa y profesional en español rioplatense neutro.
2. Cita siempre el artículo correspondiente del reglamento (ej. "Según el Art. 1...", "Conforme al Art. 2...").
3. Si la duda o situación planteada por el vecino REQUIERE INTERVENCIÓN HUMANA, inspección técnica, una excepción formal o NO ESTÁ TIPIFICADA en el reglamento, indícale claramente que debe crear un ticket en la Mesa de Ayuda ITIL (/vecino/mesa-ayuda) para que la Administradora Paula o el proveedor correspondiente lo gestione.
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
      
      // Enviamos la respuesta local formateada para Vercel AI SDK
      return new Response(respuestaLocal, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
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
      const fallback = generarRespuestaLocal(lastMessage?.content || "");
      return new Response(fallback, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Ocurrió un error al procesar la consulta." },
      { status: 500 }
    );
  }
}

// Motor de reglas local con conocimiento del reglamento
function generarRespuestaLocal(pregunta: string): string {
  const p = pregunta.toLowerCase();

  if (p.includes("mascota") || p.includes("perro") || p.includes("gato") || p.includes("correa") || p.includes("ladrid")) {
    return (
      "🐾 **Tenencia de Mascotas (Art. 1 del Reglamento):**\n" +
      "• En el Consorcio Calle 425 somos *DeveloPet Friendly*, permitiendo hasta 2 mascotas por UF.\n" +
      "• En pasillos, palieres y escaleras, las mascotas deben circular **siempre con correa y pretal** acompañadas de un adulto.\n" +
      "• Está prohibido dejarlas solas en balcones en horarios de descanso si emiten ruidos.\n" +
      "• Es obligatorio limpiar de inmediato cualquier desecho en áreas comunes."
    );
  }

  if (p.includes("ruido") || p.includes("horario") || p.includes("descanso") || p.includes("musica") || p.includes("taladro") || p.includes("obra")) {
    return (
      "🔇 **Ruidos Molestos y Horarios de Descanso (Art. 2):**\n" +
      "• **Lunes a Viernes:** Descanso estricto de 13:00 a 15:00 hs y de 22:00 a 08:00 hs.\n" +
      "• **Fines de semana y feriados:** Descanso de 14:00 a 17:00 hs y de 23:00 a 09:00 hs.\n" +
      "• **Trabajos ruidosos / Taladros:** Únicamente permitidos días hábiles de 09:00 a 18:00 hs y Sábados de 09:00 a 13:00 hs.\n\n" +
      "Si experimenta ruidos fuera de estos horarios y el diálogo con el vecino no lo resuelve, puede reportarlo en la **Mesa de Ayuda**."
    );
  }

  if (p.includes("basura") || p.includes("residuo") || p.includes("reciclaj") || p.includes("bolsa") || p.includes("desecho")) {
    return (
      "🗑️ **Disposición de Residuos (Art. 3):**\n" +
      "• Las bolsas cerradas deben sacarse al canasto exterior de la vereda **de Domingos a Viernes de 19:00 a 20:30 hs**.\n" +
      "• Queda terminantemente prohibido depositar bolsas en los pasillos o palieres fuera del horario reglamentario."
    );
  }

  if (p.includes("multa") || p.includes("limpieza") || p.includes("turno") || p.includes("24000") || p.includes("24.000") || p.includes("guardia")) {
    return (
      "🧹 **Cronograma de Limpieza y Sanciones (Art. 6 y Art. 9):**\n" +
      "• La higiene de los palieres y escaleras rota semanalmente entre las 9 Unidades Funcionales.\n" +
      "• Si una UF no cumple con su turno y no solicitó permuta previa, el sistema aplica una **multa automática de $24.000** en la siguiente liquidación de expensas, la cual se transfiere como crédito a la UF que asumió la tarea."
    );
  }

  if (p.includes("mudanza") || p.includes("mudar") || p.includes("flete")) {
    return (
      "📦 **Procedimiento de Mudanzas (Art. 5):**\n" +
      "• Debe notificarse a la administración con al menos **48 horas de anticipación**.\n" +
      "• Horarios permitidos: Lunes a Viernes de 09:00 a 17:00 hs y Sábados de 09:00 a 13:00 hs."
    );
  }

  if (p.includes("terraza") || p.includes("parrilla") || p.includes("quincho") || p.includes("reserva")) {
    return (
      "🌿 **Uso de Terraza y Áreas Comunes (Art. 4):**\n" +
      "• Habilitada de 09:00 a 22:00 hs con previa reserva.\n" +
      "• La unidad responsable debe dejar el espacio completamente limpio y en orden tras su uso."
    );
  }

  // Respuesta general de triaje recomendando la Mesa de Ayuda
  return (
    "Hola vecino/a. Para este requerimiento específico o situación que requiere inspección y gestión directa, le recomendamos abrir un ticket en la **Mesa de Ayuda ITIL** (`/vecino/mesa-ayuda`).\n\n" +
    "Allí la Administradora Paula podrá intervenir, asignar al proveedor homologado correspondiente y darle seguimiento con SLA."
  );
}
