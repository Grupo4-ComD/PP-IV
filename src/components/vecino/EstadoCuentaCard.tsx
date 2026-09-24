"use client";

import React, { useState } from "react";
import {
  Receipt,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Paperclip,
  CreditCard,
  TrendingUp,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import UploadComprobanteModal from "./UploadComprobanteModal";
import PdfExportButton from "./PdfExportButton";
import CuponPagoModal from "./CuponPagoModal";
import LiquidacionConsolidadaModal from "../admin/LiquidacionConsolidadaModal";

export interface ExpensaData {
  id: number | string;
  unidad_id: number;
  periodo_mes: number;
  periodo_anio: number;
  monto_ordinario: number;
  recargo_mora: number;
  total_pagar: number;
  fecha_vencimiento: string;
  estado: "pendiente" | "en_verificacion" | "pagado";
  comprobante_url?: string | null;
  fecha_pago?: string | null;
}

export interface UnidadData {
  id: number;
  numero_uf: number;
  piso_depto: string;
  propietario_nombre: string;
  email: string;
}

interface EstadoCuentaProps {
  expensaInicial?: ExpensaData;
  unidadInicial?: UnidadData;
}

const mesesNombres = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function EstadoCuentaCard({
  expensaInicial,
  unidadInicial,
}: EstadoCuentaProps) {
  // Datos por defecto para demostración fluida
  const [unidad] = useState<UnidadData>(
    unidadInicial || {
      id: 3,
      numero_uf: 3,
      piso_depto: "PB C",
      propietario_nombre: "Martínez, Laura",
      email: "laura.martinez@calle425.com",
    }
  );

  const [expensa, setExpensa] = useState<ExpensaData>(
    expensaInicial || {
      id: 101,
      unidad_id: 3,
      periodo_mes: 8,
      periodo_anio: 2026,
      monto_ordinario: 20693.73,
      recargo_mora: 0,
      total_pagar: 52966.38,
      fecha_vencimiento: "2026-08-10",
      estado: "pendiente",
      comprobante_url: null,
    }
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCuponOpen, setIsCuponOpen] = useState(false);
  const [isLiquidacionOpen, setIsLiquidacionOpen] = useState(false);

  const nombreMes = mesesNombres[expensa.periodo_mes - 1] || "Agosto";
  const tieneMora = expensa.recargo_mora > 0 && expensa.estado !== "pagado";

  const handleUploadSuccess = (comprobanteUrl: string) => {
    setExpensa((prev) => ({
      ...prev,
      estado: "en_verificacion",
      comprobante_url: comprobanteUrl,
    }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm transition-all">
      {/* Header de la tarjeta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 stroke-[2.2]" />
              Estado de Cuenta y Expensas
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              UF 0{unidad.numero_uf} ({unidad.piso_depto})
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Período {nombreMes} {expensa.periodo_anio}
          </h2>
        </div>

        {/* Badge de Estado */}
        <div>
          {expensa.estado === "pagado" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.2]" />
              Expensa al Día
            </span>
          ) : expensa.estado === "en_verificacion" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
              <Clock className="w-3.5 h-3.5 text-indigo-600 animate-spin stroke-[2.2]" />
              Pago en Verificación
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.2]" />
              Pendiente de Pago
            </span>
          )}
        </div>
      </div>

      {/* Desglose de Montos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 my-6">
        {/* Monto Ordinario */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <Wallet className="w-3.5 h-3.5" />
            <span>Gasto Ordinario (Prorrateo)</span>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
            ${expensa.monto_ordinario.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
            <Calendar className="w-3 h-3" />
            <span>Vence: {expensa.fecha_vencimiento}</span>
          </div>
        </div>

        {/* Extraordinaria / Reserva */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Extraord. / Cuota Fondo</span>
            </div>
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-1">
            $32.275,11
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Recupero obras y reserva
          </p>
        </div>

        {/* Total a Pagar */}
        <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Total a Liquidar</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ${expensa.total_pagar.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-indigo-500/80 dark:text-indigo-300/70 mt-1">
            {expensa.estado === "pagado" ? "Saldo cancelado" : "Importe exigible (Vence 10/08)"}
          </p>
        </div>
      </div>

      {/* Barra de Acciones con Nuevos Botones Interactivos */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Ver Cupón Oficial */}
          <button
            onClick={() => setIsCuponOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition cursor-pointer"
          >
            <Receipt className="w-4 h-4 text-indigo-600" />
            <span>Ver Cupón de Pago</span>
          </button>

          {/* Botón Ver Liquidación Completa (Hojas 1 y 2) */}
          <button
            onClick={() => setIsLiquidacionOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <CreditCard className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Ver Liquidación 9 UFs</span>
          </button>
        </div>

        {/* Botón de Pagar / Informar Transferencia */}
        {expensa.estado !== "pagado" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4 stroke-[2]" />
            <span>
              {expensa.estado === "en_verificacion"
                ? "Reemplazar Comprobante"
                : "Informar Transferencia / Mercado Pago"}
            </span>
          </button>
        )}
      </div>

      {/* Modales Interactivos */}
      <UploadComprobanteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        expensaId={expensa.id}
        totalPagar={expensa.total_pagar}
        periodoTexto={`${nombreMes} ${expensa.periodo_anio}`}
        onSuccess={handleUploadSuccess}
      />

      <CuponPagoModal
        isOpen={isCuponOpen}
        onClose={() => setIsCuponOpen(false)}
        data={{
          mes: `${String(expensa.periodo_mes).padStart(2, "0")}/${expensa.periodo_anio}`,
          vencimiento: expensa.fecha_vencimiento,
          propietario: unidad.propietario_nombre,
          unidad: `${unidad.numero_uf} - ${unidad.piso_depto}`,
          totalPagar: expensa.total_pagar,
          gastosOrdinarios: expensa.monto_ordinario,
        }}
      />

      <LiquidacionConsolidadaModal
        isOpen={isLiquidacionOpen}
        onClose={() => setIsLiquidacionOpen(false)}
        periodo={`${String(expensa.periodo_mes).padStart(2, "0")} / ${expensa.periodo_anio}`}
      />
    </div>
  );
}
