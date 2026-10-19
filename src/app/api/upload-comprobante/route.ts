import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const expensaId = formData.get('expensaId') || 'general';

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuración de Supabase no disponible en el servidor' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `expensa_${expensaId}_${Date.now()}.${fileExt}`;
    const filePath = `transferencias/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabase.storage
      .from('comprobantes')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/png',
        upsert: true,
      });

    if (error) {
      console.error('Error subiendo a Supabase Storage:', error);
      return NextResponse.json(
        { error: `Error de almacenamiento: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from('comprobantes')
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error('Error en /api/upload-comprobante:', error);
    return NextResponse.json(
      { error: error?.message || 'Error inesperado al procesar el comprobante' },
      { status: 500 }
    );
  }
}
