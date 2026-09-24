import { NextResponse } from 'next/server';
import { generarLiquidacionConsolidada } from '@/lib/liquidaciones';

export async function GET(
  request: Request,
  { params }: { params: { anio: string; mes: string } }
) {
  try {
    const periodoAnio = parseInt(params.anio, 10);
    const periodoMes = parseInt(params.mes, 10);

    if (isNaN(periodoAnio) || isNaN(periodoMes)) {
      return NextResponse.json(
        { error: 'Año y mes deben ser números válidos.' },
        { status: 400 }
      );
    }

    const datosLiquidacion = await generarLiquidacionConsolidada({
      periodoAnio,
      periodoMes
    });

    return NextResponse.json(datosLiquidacion);
  } catch (error) {
    console.error('Error generando liquidación:', error);
    return NextResponse.json(
      { error: 'Error interno generando la liquidación.' },
      { status: 500 }
    );
  }
}
