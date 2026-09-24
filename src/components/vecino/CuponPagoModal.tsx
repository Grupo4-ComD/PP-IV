"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  QrCode,
  CreditCard,
  Copy,
  Check,
  Building2,
  Calendar,
  AlertTriangle,
  Receipt,
  ExternalLink,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface CuponPagoData {
  mes: string;
  anio: number;
  vencimiento: string;
  cuit: string;
  propietario: string;
  unidad: string;
  coeficiente: string;
  gastosOrdinarios: number;
  gastosExtraordinarios: number;
  deudaAnterior: number;
  pagoRegistrado: number;
  cargosActuales: number;
  totalPagar: number;
  alias: string;
}

interface CuponPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: Partial<CuponPagoData>;
}

export default function CuponPagoModal({
  isOpen,
  onClose,
  data,
}: CuponPagoModalProps) {
  const [copied, setCopied] = useState(false);
  const [pagandoMp, setPagandoMp] = useState(false);
  const [pagoExitoso, setPagoExitoso] = useState(false);

  if (!isOpen) return null;

  const cupon: CuponPagoData = {
    mes: data?.mes || "08/2026",
    anio: data?.anio || 2026,
    vencimiento: data?.vencimiento || "10/08/2026",
    cuit: data?.cuit || "30-71167103-9",
    propietario: data?.propietario || "Martínez, Laura",
    unidad: data?.unidad || "3 - PB C",
    coeficiente: data?.coeficiente || "11.20%",
    gastosOrdinarios: data?.gastosOrdinarios ?? 20693.73,
    gastosExtraordinarios: data?.gastosExtraordinarios ?? 32275.11,
    deudaAnterior: data?.deudaAnterior ?? 53157.54,
    pagoRegistrado: data?.pagoRegistrado ?? 53160.0,
    cargosActuales: data?.cargosActuales ?? 0.0,
    totalPagar: data?.totalPagar ?? 52966.38,
    alias: data?.alias || "CONSORCIO.CALLE425",
  };

  const copyAlias = () => {
    navigator.clipboard.writeText(cupon.alias);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const simularPagoMercadoPago = () => {
    setPagandoMp(true);
    setTimeout(() => {
      setPagandoMp(false);
      setPagoExitoso(true);
    }, 1500);
  };

  const descargarPdfCupon = () => {
    try {
      const doc = new jsPDF();

      // Marco exterior
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.8);
      doc.rect(12, 12, 186, 260);

      // Encabezado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("Consorcio de Propietarios Calle 425", 16, 22);

      doc.setFontSize(11);
      doc.text(`MES: ${cupon.mes}`, 192, 20, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Vencimiento: ${cupon.vencimiento}`, 192, 26, { align: "right" });

      doc.text(`CUIT: ${cupon.cuit}`, 16, 29);

      // Línea divisoria
      doc.setDrawColor(203, 213, 225);
      doc.line(16, 33, 192, 33);

      // Caja Propietario / Coeficiente
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(16, 36, 176, 18, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(`Propietario: ${cupon.propietario}`, 20, 43);
      doc.text(`Unidad: ${cupon.unidad}`, 20, 49);

      doc.text(`Coeficiente Prorrateo: ${cupon.coeficiente}`, 188, 46, {
        align: "right",
      });

      // Tabla de conceptos
      autoTable(doc, {
        startY: 58,
        margin: { left: 16, right: 16 },
        head: [["Detalle de Conceptos", "Monto"]],
        body: [
          [
            "Gastos Ordinarios (A) - Prorrateo",
            `$ ${cupon.gastosOrdinarios.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
          ],
          [
            "Gastos Extraordinarios (B) / Cuota Reserva",
            `$ ${cupon.gastosExtraordinarios.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
          ],
          [
            "Deuda de períodos anteriores",
            `$ ${cupon.deudaAnterior.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
          ],
          [
            "Pago registrado del período",
            `- $ ${cupon.pagoRegistrado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
          ],
          [
            "Cargos del período actual",
            `$ ${cupon.cargosActuales.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
          ],
        ],
        theme: "plain",
        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: "bold",
          fontSize: 9.5,
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 126 },
          1: { cellWidth: 50, halign: "right", fontStyle: "bold" },
        },
        didParseCell: (hookData) => {
          if (hookData.section === "body" && hookData.row.index === 3) {
            hookData.cell.styles.textColor = [16, 185, 129]; // Verde para pago registrado
          }
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY || 135;

      // Barra TOTAL A PAGAR (Fondo azul marino oscuro)
      doc.setFillColor(30, 41, 59);
      doc.rect(16, finalY + 4, 176, 15, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("TOTAL A PAGAR:", 22, finalY + 13.5);
      doc.text(
        `$ ${cupon.totalPagar.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        188,
        finalY + 13.5,
        { align: "right" }
      );

      // Bloque de Notas e Información de Pago
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("NOTAS E INFORMACIÓN DE PAGO:", 16, finalY + 30);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(
        "- Si ya realizó el pago y no figura en este cupón, por favor envíe el comprobante a la administración.",
        16,
        finalY + 36
      );
      doc.text(
        "- El pago después del día 10 puede generar intereses por mora en la siguiente liquidación.",
        16,
        finalY + 42
      );

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("DATOS PARA TRANSFERENCIA BANCARIA:", 16, finalY + 52);
      doc.setFont("helvetica", "normal");
      doc.text(`Alias: ${cupon.alias}`, 16, finalY + 58);

      // Recuadro Mercado Pago simulado en PDF
      doc.setDrawColor(14, 165, 233);
      doc.setLineDashPattern([2, 2], 0);
      doc.rect(135, finalY + 24, 57, 50);
      doc.setLineDashPattern([], 0);

      doc.setTextColor(14, 165, 233);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Pagar con Mercado Pago", 163.5, finalY + 30, { align: "center" });

      doc.setFillColor(14, 165, 233);
      doc.rect(148, finalY + 34, 30, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text("QR PAGO", 163, finalY + 50, { align: "center" });

      doc.setTextColor(71, 85, 105);
      doc.setFontSize(7);
      doc.text("Escanea para transferir", 163.5, finalY + 69, { align: "center" });

      // Guardar PDF
      doc.save(`Cupon_Pago_Calle425_UF_${cupon.unidad.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (err) {
      console.error("Error al generar PDF del cupón:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Cupón Oficial de Pago de Expensas
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Imprimible del Cupón */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Card Oficial del Cupón */}
          <div className="border-2 border-slate-800 dark:border-slate-700 rounded-xl p-6 bg-white dark:bg-slate-950 shadow-sm font-sans space-y-4">
            {/* Header del Consorcio */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Consorcio de Propietarios Calle 425
                </h4>
                <p className="text-xs text-slate-500 font-mono">CUIT: {cupon.cuit}</p>
              </div>
              <div className="sm:text-right">
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  MES: {cupon.mes}
                </span>
                <span className="text-xs text-slate-500">
                  Vencimiento: <strong className="text-rose-600">{cupon.vencimiento}</strong>
                </span>
              </div>
            </div>

            {/* Ficha Propietario / Prorrateo */}
            <div className="bg-slate-50 dark:bg-slate-900/70 p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <div>
                <p className="text-slate-500">
                  Propietario: <strong className="text-slate-800 dark:text-slate-200">{cupon.propietario}</strong>
                </p>
                <p className="text-slate-500">
                  Unidad: <strong className="text-slate-800 dark:text-slate-200">{cupon.unidad}</strong>
                </p>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block">Coeficiente Prorrateo:</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {cupon.coeficiente}
                </span>
              </div>
            </div>

            {/* Tabla de Conceptos */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/60 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-2.5">Detalle de Conceptos</th>
                    <th className="p-2.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="p-2.5">Gastos Ordinarios (A) - Prorrateo</td>
                    <td className="p-2.5 text-right font-medium">
                      ${cupon.gastosOrdinarios.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5">Gastos Extraordinarios (B) / Cuota Reserva</td>
                    <td className="p-2.5 text-right font-medium">
                      ${cupon.gastosExtraordinarios.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5">Deuda de períodos anteriores</td>
                    <td className="p-2.5 text-right font-medium">
                      ${cupon.deudaAnterior.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                    <td className="p-2.5">Pago registrado del período</td>
                    <td className="p-2.5 text-right">
                      - ${cupon.pagoRegistrado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5">Cargos del período actual</td>
                    <td className="p-2.5 text-right font-medium">
                      ${cupon.cargosActuales.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Barra de TOTAL A PAGAR */}
            <div className="bg-slate-900 text-white rounded-lg p-3.5 flex items-center justify-between shadow-md">
              <span className="font-bold tracking-wide text-xs sm:text-sm">TOTAL A PAGAR:</span>
              <span className="font-extrabold text-lg sm:text-xl text-emerald-400">
                ${cupon.totalPagar.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Grid inferior: Notas y Mercado Pago QR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Notas Legales */}
              <div className="md:col-span-2 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  NOTAS E INFORMACIÓN DE PAGO:
                </p>
                <p>
                  • Si ya realizó el pago y no figura en este cupón, envíe el comprobante adjunto
                  desde el botón del panel.
                </p>
                <p>
                  • El pago después del <strong>día 10</strong> genera intereses por mora (7%) en la
                  siguiente liquidación.
                </p>
                <div className="pt-2">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    DATOS PARA TRANSFERENCIA BANCARIA:
                  </span>
                  <div className="inline-flex items-center gap-1.5 mt-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-800 dark:text-slate-200 font-mono text-xs">
                    <span>Alias: {cupon.alias}</span>
                    <button
                      onClick={copyAlias}
                      className="p-1 hover:text-indigo-600 transition"
                      title="Copiar alias"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recuadro Mercado Pago QR */}
              <div className="border-2 border-dashed border-sky-400 rounded-xl p-3 bg-sky-50/50 dark:bg-sky-950/20 text-center flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 mb-1.5 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" /> Pagar con Mercado Pago
                </span>
                <div className="w-20 h-20 bg-sky-500 rounded-lg flex items-center justify-center shadow-inner my-1">
                  <span className="text-white font-black text-xs">QR PAGO</span>
                </div>
                <span className="text-[10px] text-slate-400">Escaneá para transferir</span>
              </div>
            </div>
          </div>

          {/* Estado de Simulación de Pago */}
          {pagoExitoso && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span>
                <strong>¡Pago simulado con éxito!</strong> El comprobante se registró y la
                administración fue notificada.
              </span>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={descargarPdfCupon}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Descargar Cupón PDF</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={simularPagoMercadoPago}
              disabled={pagandoMp || pagoExitoso}
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.99] text-white text-xs font-bold shadow-md shadow-sky-500/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4" />
              <span>{pagandoMp ? "Procesando..." : pagoExitoso ? "Pagado con MP" : "Pagar con Mercado Pago"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
