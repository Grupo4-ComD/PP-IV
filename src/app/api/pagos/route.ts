import { NextResponse } from 'next/server';
import { PrismaClient, EstadoPago, EstadoExpensa } from '@prisma/client';

const prisma = new PrismaClient();

// Tasa oficial de Mercado Pago: 0.6% (0.006)
const TASA_COMISION_MP = 0.006;

/**
 * GET /api/pagos
 * Permite listar y filtrar pagos de vecinos con desglose de retención MP (0.6%).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const unidadId = searchParams.get('unidadId');
    const periodoMes = searchParams.get('periodoMes');
    const periodoAnio = searchParams.get('periodoAnio');

    const where: any = {};
    if (estado && Object.values(EstadoPago).includes(estado as EstadoPago)) {
      where.estado = estado as EstadoPago;
    }
    if (unidadId) {
      where.unidadId = BigInt(unidadId);
    }
    if (periodoMes) {
      where.periodoMes = Number(periodoMes);
    }
    if (periodoAnio) {
      where.periodoAnio = Number(periodoAnio);
    }

    const pagos = await prisma.pagoVecino.findMany({
      where,
      include: {
        unidad: {
          select: {
            id: true,
            numeroUf: true,
            pisoDepto: true,
            propietarioNombre: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = pagos.map((p) => {
      const bruto = Number(p.montoBruto || p.monto);
      const retencion = Number(p.retencionMp) || Number((bruto * TASA_COMISION_MP).toFixed(2));
      const neto = Number(p.montoNeto) || Number((bruto - retencion).toFixed(2));

      return {
        id: p.id.toString(),
        unidad_id: p.unidadId.toString(),
        monto: bruto,
        monto_bruto: bruto,
        retencion_mp: retencion,
        monto_neto: neto,
        fecha_pago: p.fechaPago ? p.fechaPago.toISOString().split('T')[0] : null,
        periodo_mes: p.periodoMes,
        periodo_anio: p.periodoAnio,
        comprobante_url: p.comprobanteUrl,
        estado: p.estado,
        created_at: p.createdAt.toISOString(),
        unidad: p.unidad
          ? {
              id: p.unidad.id.toString(),
              numero_uf: p.unidad.numeroUf,
              piso_depto: p.unidad.pisoDepto,
              propietario_nombre: p.unidad.propietarioNombre,
              email: p.unidad.email,
            }
          : null,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    return NextResponse.json({ error: 'Error al consultar pagos' }, { status: 500 });
  }
}

/**
 * POST /api/pagos
 * Registra un pago de vecino o una carga manual con cálculo automático del 0.6% de Mercado Pago.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      unidadId,
      expensaId,
      monto,
      montoBruto,
      periodoMes,
      periodoAnio,
      fechaPago,
      comprobanteUrl,
      origen = 'vecino', // 'vecino' | 'admin'
    } = body;

    const montoFinal = Number(montoBruto || monto);
    if (!unidadId || isNaN(montoFinal) || montoFinal <= 0) {
      return NextResponse.json(
        { error: 'Faltan parámetros obligatorios (unidadId, monto)' },
        { status: 400 }
      );
    }

    const mesFinal = Number(periodoMes) || (new Date().getMonth() + 1);
    const anioFinal = Number(periodoAnio) || new Date().getFullYear();

    // 1. Regla de negocio: Cálculo automático del 0,6% de comisión Mercado Pago
    const retencionMp = Number((montoFinal * TASA_COMISION_MP).toFixed(2));
    const montoNeto = Number((montoFinal - retencionMp).toFixed(2));

    // Si viene del admin entra aprobado; si lo sube el vecino entra en estado pendiente
    const estadoPago = origen === 'admin' ? EstadoPago.aprobado : EstadoPago.pendiente;

    // 2. Persistencia en tabla pagos_vecinos
    const nuevoPago = await prisma.pagoVecino.create({
      data: {
        unidadId: BigInt(unidadId),
        monto: montoFinal,
        montoBruto: montoFinal,
        retencionMp: retencionMp,
        montoNeto: montoNeto,
        periodoMes: mesFinal,
        periodoAnio: anioFinal,
        fechaPago: fechaPago ? new Date(fechaPago) : new Date(),
        comprobanteUrl: comprobanteUrl || null,
        estado: estadoPago,
      },
      include: {
        unidad: true,
      },
    });

    // 3. Sincronización con la Expensa correspondiente
    if (expensaId) {
      await prisma.expensa.update({
        where: { id: BigInt(expensaId) },
        data: {
          estado: origen === 'admin' ? EstadoExpensa.pagado : EstadoExpensa.en_verificacion,
          comprobanteUrl: comprobanteUrl || undefined,
          fechaPago: origen === 'admin' ? new Date() : undefined,
        },
      });
    } else {
      // Buscar si existe la expensa para este mes y unidad
      const expensaExistente = await prisma.expensa.findFirst({
        where: {
          unidadId: BigInt(unidadId),
          periodoMes: mesFinal,
          periodoAnio: anioFinal,
        },
      });

      if (expensaExistente) {
        await prisma.expensa.update({
          where: { id: expensaExistente.id },
          data: {
            estado: origen === 'admin' ? EstadoExpensa.pagado : EstadoExpensa.en_verificacion,
            comprobanteUrl: comprobanteUrl || expensaExistente.comprobanteUrl,
            fechaPago: origen === 'admin' ? new Date() : expensaExistente.fechaPago,
          },
        });
      }
    }

    // 4. Recibo digital si queda aprobado
    const reciboDigital =
      estadoPago === EstadoPago.aprobado
        ? {
            reciboNumero: `REC-${anioFinal}${String(mesFinal).padStart(2, '0')}-${String(
              nuevoPago.id
            ).padStart(4, '0')}`,
            fechaEmision: new Date().toISOString(),
            unidad: `UF ${nuevoPago.unidad.numeroUf} - ${nuevoPago.unidad.pisoDepto}`,
            propietario: nuevoPago.unidad.propietarioNombre,
            montoBruto: montoFinal,
            comisionMp: retencionMp,
            montoNetoAcreditado: montoNeto,
            aliasDestino: 'consorciorpena1454',
          }
        : null;

    return NextResponse.json({
      success: true,
      id: nuevoPago.id.toString(),
      mensaje:
        estadoPago === EstadoPago.aprobado
          ? 'Pago aprobado y conciliado exitosamente'
          : 'Comprobante recibido. Queda en estado pendiente de conciliación',
      pago: {
        id: nuevoPago.id.toString(),
        unidadId: nuevoPago.unidadId.toString(),
        montoBruto: montoFinal,
        retencionMp: retencionMp,
        montoNeto: montoNeto,
        estado: nuevoPago.estado,
        comprobanteUrl: nuevoPago.comprobanteUrl,
        aliasDestino: 'consorciorpena1454',
      },
      reciboDigital,
    });
  } catch (error) {
    console.error('Error registrando pago:', error);
    return NextResponse.json(
      { error: 'Error interno al registrar el comprobante de pago' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/pagos
 * Flujo de conciliación y validación por Administrador (pendiente -> aprobado / rechazado).
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { pagoId, accion, expensaId } = body; // accion: 'aprobar' | 'rechazar'

    if (!pagoId || !['aprobar', 'rechazar'].includes(accion)) {
      return NextResponse.json(
        { error: 'Parámetros inválidos (pagoId y accion requeridos)' },
        { status: 400 }
      );
    }

    const pago = await prisma.pagoVecino.findUnique({
      where: { id: BigInt(pagoId) },
      include: { unidad: true },
    });

    if (!pago) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    const nuevoEstadoPago = accion === 'aprobar' ? EstadoPago.aprobado : EstadoPago.rechazado;

    // Actualizar el estado del pago
    const pagoActualizado = await prisma.pagoVecino.update({
      where: { id: BigInt(pagoId) },
      data: {
        estado: nuevoEstadoPago,
      },
      include: { unidad: true },
    });

    // Actualizar la expensa asociada
    const nuevoEstadoExpensa =
      accion === 'aprobar' ? EstadoExpensa.pagado : EstadoExpensa.pendiente;

    if (expensaId) {
      await prisma.expensa.update({
        where: { id: BigInt(expensaId) },
        data: {
          estado: nuevoEstadoExpensa,
          fechaPago: accion === 'aprobar' ? new Date() : null,
        },
      });
    } else {
      await prisma.expensa.updateMany({
        where: {
          unidadId: pago.unidadId,
          periodoMes: pago.periodoMes,
          periodoAnio: pago.periodoAnio,
        },
        data: {
          estado: nuevoEstadoExpensa,
          fechaPago: accion === 'aprobar' ? new Date() : null,
        },
      });
    }

    const reciboDigital =
      accion === 'aprobar'
        ? {
            reciboNumero: `REC-${pago.periodoAnio}${String(pago.periodoMes).padStart(2, '0')}-${String(
              pago.id
            ).padStart(4, '0')}`,
            fechaEmision: new Date().toISOString(),
            unidad: `UF ${pago.unidad.numeroUf} - ${pago.unidad.pisoDepto}`,
            propietario: pago.unidad.propietarioNombre,
            montoBruto: Number(pago.montoBruto || pago.monto),
            comisionMp: Number(pago.retencionMp),
            montoNetoAcreditado: Number(pago.montoNeto),
            aliasDestino: 'consorciorpena1454',
          }
        : null;

    return NextResponse.json({
      success: true,
      mensaje:
        accion === 'aprobar'
          ? 'Pago aprobado y conciliado con emisión de recibo digital'
          : 'Pago rechazado. La expensa vuelve a estado pendiente',
      pago: {
        id: pagoActualizado.id.toString(),
        estado: pagoActualizado.estado,
      },
      reciboDigital,
    });
  } catch (error) {
    console.error('Error en conciliación de pago:', error);
    return NextResponse.json(
      { error: 'Error interno al conciliar el pago' },
      { status: 500 }
    );
  }
}
