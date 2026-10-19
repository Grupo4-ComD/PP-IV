"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  ExternalLink,
  Download,
  Loader2,
  ShieldCheck,
  Percent,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ConciliarExpensaData {
  id: string | number;
  unidad_id: string | number;
  periodo_mes: number;
  periodo_anio: number;
  total_pagar: number;
  estado: string;
  comprobante_url?: string | null;
  fecha_pago?: string | null;
  unidades?: {
    numero_uf: number;
    piso_depto: string;
    propietario_nombre: string;
  } | null;
}

interface ConciliarPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  expensa: ConciliarExpensaData | null;
  onConciliado: () => void;
}

export default function ConciliarPagoModal({
  isOpen,
  onClose,
  expensa,
  onConciliado,
}: ConciliarPagoModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pagoId, setPagoId] = useState<string | null>(null);
  const [reciboDigital, setReciboDigital] = useState<any | null>(null);
  const [imgError, setImgError] = useState(false);

  // Buscar si existe un pago registrado en tabla pagos_vecinos
  useEffect(() => {
    if (!isOpen || !expensa) {
      setReciboDigital(null);
      setErrorMsg(null);
      setPagoId(null);
      setImgError(false);
      return;
    }
    setImgError(false);

    const currentExpensa = expensa;

    async function buscarPago() {
      try {
        const res = await fetch(
          `/api/pagos?unidadId=${currentExpensa.unidad_id}&periodoMes=${currentExpensa.periodo_mes}&periodoAnio=${currentExpensa.periodo_anio}`
        );
        if (res.ok) {
          const pagos = await res.json();
          if (pagos && pagos.length > 0) {
            setPagoId(pagos[0].id);
            if (pagos[0].estado === "aprobado") {
              setReciboDigital({
                reciboNumero: `REC-${pagos[0].periodo_anio}${String(pagos[0].periodo_mes).padStart(2, "0")}-${String(pagos[0].id).padStart(4, "0")}`,
                fechaEmision: pagos[0].created_at || new Date().toISOString(),
                unidad: `UF ${currentExpensa.unidades?.numero_uf || currentExpensa.unidad_id} - ${currentExpensa.unidades?.piso_depto || ""}`,
                propietario: currentExpensa.unidades?.propietario_nombre || "",
                montoBruto: pagos[0].monto_bruto || pagos[0].monto,
                comisionMp: pagos[0].retencion_mp,
                montoNetoAcreditado: pagos[0].monto_neto,
                aliasDestino: "consorciorpena1454",
              });
            }
          }
        }
      } catch (err) {
        console.warn("Error buscando pago asociado:", err);
      }
    }

    buscarPago();
  }, [isOpen, expensa]);

  if (!isOpen || !expensa) return null;

  const montoBruto = Number(expensa.total_pagar || 0);
  const comisionMp = Number((montoBruto * 0.006).toFixed(2));
  const montoNeto = Number((montoBruto - comisionMp).toFixed(2));
  const mesesNombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const nombreMes = mesesNombres[expensa.periodo_mes - 1] || "Mes";

  const handleAccion = async (accion: "aprobar" | "rechazar") => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Si no hay pagoId específico, registrar primero la persistencia si aún no existía
      let currentPagoId = pagoId;
      if (!currentPagoId) {
        const resCrear = await fetch("/api/pagos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            unidadId: expensa.unidad_id,
            expensaId: expensa.id,
            monto: montoBruto,
            montoBruto,
            periodoMes: expensa.periodo_mes,
            periodoAnio: expensa.periodo_anio,
            comprobanteUrl: expensa.comprobante_url,
            origen: "vecino",
          }),
        });

        if (!resCrear.ok) {
          throw new Error("No se pudo inicializar el registro del pago");
        }
        const dataCrear = await resCrear.json();
        currentPagoId = dataCrear.id;
        setPagoId(dataCrear.id);
      }

      // 2. Conciliar a través del endpoint PATCH /api/pagos
      const res = await fetch("/api/pagos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagoId: currentPagoId,
          expensaId: expensa.id,
          accion,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al procesar la conciliación");
      }

      const resData = await res.json();

      if (accion === "aprobar") {
        setReciboDigital(resData.reciboDigital);
        onConciliado();
      } else {
        onConciliado();
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  // Descarga del Recibo Oficial en PDF
  const descargarReciboPdf = () => {
    try {
      const doc = new jsPDF();

      // Marco
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.8);
      doc.rect(14, 14, 182, 250);

      // Encabezado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("CONSORCIO DE PROPIETARIOS CALLE 425", 20, 26);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("CUIT: 30-71167103-9 • CABA, Buenos Aires • Administradora Paula", 20, 32);

      doc.setDrawColor(226, 232, 240);
      doc.line(20, 36, 190, 36);

      // Título del Recibo
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(5, 150, 105);
      doc.text("RECIBO OFICIAL DE COBRANZA", 20, 46);

      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(`N°: ${reciboDigital?.reciboNumero || "REC-2026-0001"}`, 140, 46);
      doc.text(`Fecha: ${new Date().toLocaleDateString("es-AR")}`, 140, 52);

      // Datos de la Unidad
      autoTable(doc, {
        startY: 58,
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2 },
        body: [
          ["Unidad Funcional:", `UF ${expensa.unidades?.numero_uf || expensa.unidad_id} (${expensa.unidades?.piso_depto || "—"})`],
          ["Propietario / Residente:", `${expensa.unidades?.propietario_nombre || "—"}`],
          ["Período Liquidado:", `${nombreMes} ${expensa.periodo_anio}`],
          ["Alias de Pago:", "consorciorpena1454 (Mercado Pago / CVU)"],
          ["Estado de Cobranza:", "CONCILIADO Y ACREDITADO"],
        ],
      });

      // Desglose Financiero
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [["Concepto", "Monto"]],
        theme: "striped",
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9, fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 3 },
        body: [
          ["Monto Bruto Transferido por el Vecino", `$ ${montoBruto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`],
          ["Deducción Pasarela Mercado Pago (0,6%)", `- $ ${comisionMp.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`],
          ["Monto Neto Acreditado a la Cuenta del Consorcio", `$ ${montoNeto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`],
        ],
      });

      // Leyenda legal y firma
      const finalY = (doc as any).lastAutoTable.finalY + 25;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Constancia emitida digitalmente por el Sistema Inteligente de Autogestión Consorcial Calle 425.",
        20,
        finalY
      );
      doc.text("Válido como comprobante formal de cancelación de expensas comunes.", 20, finalY + 5);

      // Firma digital
      doc.setDrawColor(148, 163, 184);
      doc.line(130, finalY + 25, 185, finalY + 25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Administración Consorcio", 133, finalY + 30);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Firma y Sello Digital", 143, finalY + 35);

      doc.save(`Recibo_UF${expensa.unidades?.numero_uf}_${nombreMes}_${expensa.periodo_anio}.pdf`);
    } catch (e) {
      console.error("Error generando PDF del recibo:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-100 dark:border-emerald-800/40">
            <ShieldCheck className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Conciliación de Comprobante Digital
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              UF {expensa.unidades?.numero_uf} ({expensa.unidades?.piso_depto}) • {expensa.unidades?.propietario_nombre}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Si ya se aprobó y emitió el recibo digital */}
        {reciboDigital ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Recibo Digital Oficial Emitido
                </span>
                <span className="font-mono font-bold text-xs bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800">
                  {reciboDigital.reciboNumero}
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                El cobro fue verificado y acreditado en la cuenta del consorcio con la deducción del 0,6% de Mercado Pago.
              </p>
            </div>

            {/* Desglose */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Monto Bruto Transferido:</span>
                <span className="font-mono font-bold">${montoBruto.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between text-amber-600">
                <span>Comisión Mercado Pago (0,6%):</span>
                <span className="font-mono font-bold">-${comisionMp.toLocaleString("es-AR")}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-semibold text-emerald-600">
                <span>Neto Acreditado en Caja:</span>
                <span className="font-mono font-bold text-sm">${montoNeto.toLocaleString("es-AR")}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={descargarReciboPdf}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Recibo Digital en PDF</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tarjeta de Cálculo Mercado Pago (0,6%) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs space-y-2.5">
              <div className="flex justify-between items-center text-slate-500">
                <span>Alias destino acreditado:</span>
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900">
                  consorciorpena1454
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-400">Total Expensa (Monto Bruto):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  ${montoBruto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                <span>Deducción Mercado Pago (0,6%):</span>
                <span className="font-mono font-bold">
                  -${comisionMp.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Neto a Acreditar en Caja Consorcio:</span>
                <span className="font-mono font-bold text-sm">
                  ${montoNeto.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Vista Previa del Comprobante */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Comprobante Adjuntado por el Vecino:
              </label>
              {expensa.comprobante_url ? (
                expensa.comprobante_url.startsWith("blob:") ? (
                  <div className="border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-xs flex flex-col items-center gap-2 text-center">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    <p className="font-semibold">Comprobante temporal local no sincronizado</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 max-w-sm">
                      Este pago se subió previamente con un identificador de sesión local temporal (blob). Ahora que el almacenamiento en la nube está activo, el vecino puede volver a adjuntarlo desde su panel, o bien puedes conciliarlo directamente si ya constataste la transferencia.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-3 bg-slate-50 dark:bg-slate-950 flex flex-col items-center gap-3">
                    {expensa.comprobante_url.toLowerCase().includes(".pdf") ? (
                      <div className="flex items-center gap-2 p-4 text-xs font-semibold text-indigo-600">
                        <FileText className="w-8 h-8" />
                        <span>Documento PDF de transferencia</span>
                      </div>
                    ) : imgError ? (
                      <div className="flex flex-col items-center gap-1.5 p-4 text-xs text-slate-500">
                        <FileText className="w-8 h-8 text-slate-400" />
                        <span>No se pudo previsualizar la imagen</span>
                      </div>
                    ) : (
                      <img
                        src={expensa.comprobante_url}
                        alt="Comprobante"
                        onError={() => setImgError(true)}
                        className="max-h-48 object-contain rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
                      />
                    )}
                    <a
                      href={expensa.comprobante_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Abrir comprobante en nueva pestaña</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )
              ) : (
                <div className="p-4 border border-dashed border-amber-300 dark:border-amber-800 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs text-center">
                  El vecino aún no ha adjuntado un archivo digital para esta liquidación.
                </div>
              )}
            </div>

            {/* Botones de Aprobación / Rechazo */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleAccion("rechazar")}
                disabled={loading}
                className="w-1/3 py-2.5 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-semibold rounded-xl text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => handleAccion("aprobar")}
                disabled={loading}
                className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold rounded-xl text-xs shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conciliando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aprobar Pago y Emitir Recibo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
