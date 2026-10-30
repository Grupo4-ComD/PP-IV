import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.POSTGRES_URL_NON_POOLING } }
});

export async function GET() {
  try {
    let config = await prisma.configuracionConsorcio.findFirst({
      where: { id: 1 }
    });

    if (!config) {
      config = await prisma.configuracionConsorcio.create({
        data: {
          id: 1,
          tasaInteresMora: 7.00,
          comisionPasarelaMp: 0.60,
          montoMultaLimpieza: 24000.00,
          umbralConsensoPorcentaje: 33.33,
          diasVencimientoExpensas: 15,
          montoFondoReserva: 200000.00,
        }
      });
    }

    return NextResponse.json({
      tasa_interes_mora: Number(config.tasaInteresMora),
      comision_pasarela_mp: Number(config.comisionPasarelaMp),
      monto_multa_limpieza: Number(config.montoMultaLimpieza),
      umbral_consenso_porcentaje: Number(config.umbralConsensoPorcentaje),
      dias_vencimiento_expensas: config.diasVencimientoExpensas,
      monto_fondo_reserva: Number(config.montoFondoReserva),
      updated_at: config.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching configuracion:', error);
    return NextResponse.json({
      tasa_interes_mora: 7.0,
      comision_pasarela_mp: 0.6,
      monto_multa_limpieza: 24000.0,
      umbral_consenso_porcentaje: 33.33,
      dias_vencimiento_expensas: 15,
      monto_fondo_reserva: 200000.0,
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await prisma.configuracionConsorcio.upsert({
      where: { id: 1 },
      update: {
        tasaInteresMora: body.tasa_interes_mora ?? 7.00,
        comisionPasarelaMp: body.comision_pasarela_mp ?? 0.60,
        montoMultaLimpieza: body.monto_multa_limpieza ?? 24000.00,
        umbralConsensoPorcentaje: body.umbral_consenso_porcentaje ?? 33.33,
        diasVencimientoExpensas: body.dias_vencimiento_expensas ?? 15,
        montoFondoReserva: body.monto_fondo_reserva ?? 200000.00,
      },
      create: {
        id: 1,
        tasaInteresMora: body.tasa_interes_mora ?? 7.00,
        comisionPasarelaMp: body.comision_pasarela_mp ?? 0.60,
        montoMultaLimpieza: body.monto_multa_limpieza ?? 24000.00,
        umbralConsensoPorcentaje: body.umbral_consenso_porcentaje ?? 33.33,
        diasVencimientoExpensas: body.dias_vencimiento_expensas ?? 15,
        montoFondoReserva: body.monto_fondo_reserva ?? 200000.00,
      }
    });

    return NextResponse.json({
      success: true,
      config: {
        tasa_interes_mora: Number(updated.tasaInteresMora),
        comision_pasarela_mp: Number(updated.comisionPasarelaMp),
        monto_multa_limpieza: Number(updated.montoMultaLimpieza),
        umbral_consenso_porcentaje: Number(updated.umbralConsensoPorcentaje),
        dias_vencimiento_expensas: updated.diasVencimientoExpensas,
        monto_fondo_reserva: Number(updated.montoFondoReserva),
      }
    });
  } catch (error) {
    console.error('Error updating configuracion:', error);
    return NextResponse.json({ error: 'Error al actualizar configuración' }, { status: 500 });
  }
}

