"use client";

import React, { useState } from "react";
import {
  X,
  FileDown,
  Building2,
  Receipt,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface DistribucionItem {
  uf: number;
  pisoDepto: string;
  propietario: string;
  porcentual: number;
  deudaAnt: number;
  pagos: number;
  subtotal: number;
  ordinarias: number;
  extraordinarias: number;
  cargos: number;
  total: number;
}

export const DISTRIBUCION_AGOSTO_2026: DistribucionItem[] = [
  { uf: 1, pisoDepto: "PB A", propietario: "Paula Administradora", porcentual: 7.60, deudaAnt: 36071.60, pagos: -36100.00, subtotal: -28.40, ordinarias: 14042.17, extraordinarias: 21900.97, cargos: 0.00, total: 35914.74 },
  { uf: 2, pisoDepto: "PB B", propietario: "González, Mario", porcentual: 7.60, deudaAnt: 90264.84, pagos: -14170.75, subtotal: 76094.09, ordinarias: 14042.17, extraordinarias: 21900.97, cargos: 5326.59, total: 117363.82 },
  { uf: 3, pisoDepto: "PB C", propietario: "Martínez, Laura", porcentual: 11.20, deudaAnt: 53157.54, pagos: -53160.00, subtotal: -2.46, ordinarias: 20693.73, extraordinarias: 32275.11, cargos: 0.00, total: 52966.38 },
  { uf: 4, pisoDepto: "1° A", propietario: "Rodríguez, Carlos", porcentual: 9.20, deudaAnt: 42687.09, pagos: 0.00, subtotal: 42687.09, ordinarias: 16998.42, extraordinarias: 26511.70, cargos: 2988.10, total: 89185.31 },
  { uf: 5, pisoDepto: "1° B", propietario: "Fernández, Lucía", porcentual: 9.20, deudaAnt: 43662.80, pagos: -43700.00, subtotal: -37.20, ordinarias: 16998.42, extraordinarias: 26511.70, cargos: 0.00, total: 43472.92 },
  { uf: 6, pisoDepto: "1° C", propietario: "López, Diego", porcentual: 9.50, deudaAnt: 45089.64, pagos: -74239.85, subtotal: -29150.21, ordinarias: 17552.72, extraordinarias: 27376.21, cargos: 24000.00, total: 39778.72 },
  { uf: 7, pisoDepto: "2° A", propietario: "Sciulli, Guillermo", porcentual: 15.70, deudaAnt: 74516.57, pagos: -74516.57, subtotal: 0.00, ordinarias: 29008.18, extraordinarias: 45242.78, cargos: -16800.00, total: 57450.96 },
  { uf: 8, pisoDepto: "2° B", propietario: "Greco, Verónica", porcentual: 15.70, deudaAnt: 62515.90, pagos: -62516.00, subtotal: -0.10, ordinarias: 29008.18, extraordinarias: 45242.78, cargos: -12000.00, total: 62250.86 },
  { uf: 9, pisoDepto: "2° C", propietario: "Perea, Braian", porcentual: 14.30, deudaAnt: 93915.18, pagos: -93916.00, subtotal: -0.82, ordinarias: 26421.46, extraordinarias: 41208.40, cargos: 0.00, total: 67629.04 },
];

export const ESTADO_CAJA_ITEMS = [
  { tipo: "saldo_anterior", detalle: "SALDO ANTERIOR ACUMULADO", ingresos: null, ordinarias: null, extraordinaria: null, saldo: 1709442.29, nota: null },
  { tipo: "ingreso", detalle: "Cobro Unidad 1 - PB A", ingresos: 36100.00, ordinarias: null, extraordinaria: null, saldo: 1745542.29, nota: null },
  { tipo: "ingreso", detalle: "Cobro Unidad 2 - PB B", ingresos: 14170.75, ordinarias: null, extraordinaria: null, saldo: 1759713.04, nota: null },
  { tipo: "ingreso", detalle: "Cobro Unidad 3 - PB C", ingresos: 53160.00, ordinarias: null, extraordinaria: null, saldo: 1812873.04, nota: null },
  { tipo: "ingreso", detalle: "Cobro Unidad 5 - 1° B", ingresos: 43700.00, ordinarias: null, extraordinaria: null, saldo: 1856573.04, nota: null },
  { tipo: "ingreso", detalle: "Cobro Unidad 6 - 1° C", ingresos: 74239.85, ordinarias: null, extraordinaria: null, saldo: 1930812.89, nota: null },
  { tipo: "ingreso", detalle: "Cobro Unidad 7 - 2° A", ingresos: 74516.57, ordinarias: null, extraordinaria: null, saldo: 2005329.46, nota: null },
  { tipo: "ingreso", detalle: "Cobro Unidad 8 - 2° B", ingresos: 62516.00, ordinarias: null, extraordinaria: null, saldo: 2067845.46, nota: null },
  { tipo: "ingreso", detalle: "Cobro Unidad 9 - 2° C", ingresos: 93916.00, ordinarias: null, extraordinaria: null, saldo: 2161761.46, nota: null },
  { tipo: "egreso", detalle: "Seguro", ingresos: null, ordinarias: 5615.49, extraordinaria: null, saldo: 2156145.97, nota: "Descuenta de caja" },
  { tipo: "egreso", detalle: "Aysa", ingresos: null, ordinarias: 135292.04, extraordinaria: null, saldo: 2020853.93, nota: "Descuenta de caja" },
  { tipo: "recupero", detalle: "Recupero Mario 4/4", ingresos: null, ordinarias: null, extraordinaria: 88170.60, saldo: 2020853.93, nota: "Gasto de materiales ya descontado previamente en caja; en proceso de recupero (no descuenta de nuevo)" },
  { tipo: "egreso", detalle: "Edenor", ingresos: null, ordinarias: 12344.00, extraordinaria: null, saldo: 2008509.93, nota: "Descuenta de caja" },
  { tipo: "compensacion", detalle: "Internet", ingresos: null, ordinarias: 12000.00, extraordinaria: null, saldo: 2008509.93, nota: "Compensación en expensas: Se descuenta en las expensas de la UF 8 (proveedora); no es egreso de caja" },
  { tipo: "egreso", detalle: "Impuestos MP", ingresos: null, ordinarias: 2713.92, extraordinaria: null, saldo: 2005796.01, nota: "Descuenta de caja" },
  { tipo: "compensacion", detalle: "Limpieza", ingresos: null, ordinarias: 16800.00, extraordinaria: null, saldo: 2005796.01, nota: "Guardia sustituta: Se descuenta como pago a la UF que cubrió la limpieza de quien no lo hizo (y la multa se carga al infractor)" },
  { tipo: "fondo", detalle: "CUOTA: Fondo (Fondo)", ingresos: null, ordinarias: null, extraordinaria: 200000.00, saldo: null, nota: "Cuota para juntar fondos de reserva y obras, no representa egreso de caja" },
];

export const ESTADO_CAJA_TOTALES = {
  totalIngresos: 452319.17,
  totalOrdinarias: 184765.45,
  totalExtraordinarias: 288170.60,
  saldoFinal: 2005796.01,
};

interface LiquidacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodo?: string;
}

export default function LiquidacionConsolidadaModal({
  isOpen,
  onClose,
  periodo = "08 / 2026",
}: LiquidacionModalProps) {
  const [tabActiva, setTabActiva] = useState<"caja" | "distribucion">("caja");
  const [exportando, setExportando] = useState(false);

  if (!isOpen) return null;

  const exportarPdfOficial2Paginas = () => {
    try {
      setExportando(true);
      const doc = new jsPDF({ orientation: "portrait" });

      // ==========================================
      // PÁGINA 1: ESTADO DE CAJA (Imagen 3)
      // ==========================================
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("Consorcio de Propietarios Calle 425", 14, 18);

      doc.setFontSize(13);
      doc.text("LIQUIDACIÓN DE EXPENSAS", 196, 18, { align: "right" });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Mes: ${periodo}`, 196, 24, { align: "right" });

      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.5);
      doc.line(14, 27, 196, 27);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("1. ESTADO DE CAJA", 105, 34, { align: "center" });

      const bodyCaja: any[] = ESTADO_CAJA_ITEMS.map((item) => [
        item.detalle,
        item.ingresos ? `$ ${item.ingresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "",
        item.ordinarias ? `$ ${item.ordinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "",
        item.extraordinaria ? `$ ${item.extraordinaria.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "",
        item.saldo !== null ? `$ ${item.saldo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "--",
      ]);

      // Fila final
      bodyCaja.push([
        { content: "TOTALES DEL PERÍODO", fontStyle: "bold" },
        { content: `$ ${ESTADO_CAJA_TOTALES.totalIngresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, fontStyle: "bold" },
        { content: `$ ${ESTADO_CAJA_TOTALES.totalOrdinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, fontStyle: "bold" },
        { content: `$ ${ESTADO_CAJA_TOTALES.totalExtraordinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, fontStyle: "bold" },
        { content: `$ ${ESTADO_CAJA_TOTALES.saldoFinal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, fontStyle: "bold" },
      ]);

      autoTable(doc, {
        startY: 38,
        head: [["DETALLE / MOVIMIENTO", "INGRESOS", "ORDINARIAS", "EXTRAORDINARIA", "SALDO"]],
        body: bodyCaja,
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 1.8 },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 28, halign: "right", textColor: [16, 185, 129] },
          2: { cellWidth: 28, halign: "right" },
          3: { cellWidth: 28, halign: "right" },
          4: { cellWidth: 28, halign: "right", fontStyle: "bold" },
        },
      });

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Página 1 de 2 • Rendición de Cuentas Consorcio Calle 425", 14, 285);

      // ==========================================
      // PÁGINA 2: PLANILLA DE DISTRIBUCIÓN (Imagen 2)
      // ==========================================
      doc.addPage("portrait");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("2. PLANILLA DE DISTRIBUCIÓN - PERÍODO 08 / 2026", 105, 18, { align: "center" });

      const bodyDist: any[] = DISTRIBUCION_AGOSTO_2026.map((item) => [
        `${item.uf} - ${item.pisoDepto}`,
        `${item.porcentual.toFixed(2)}%`,
        `$ ${item.deudaAnt.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        `- $ ${Math.abs(item.pagos).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        `$ ${item.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        `$ ${item.ordinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        `$ ${item.extraordinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        `$ ${item.cargos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        `$ ${item.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
      ]);

      // Totales
      bodyDist.push([
        { content: "TOTALES GENERALES", fontStyle: "bold" },
        { content: "100.00%", fontStyle: "bold" },
        { content: "$ 541.881,16", fontStyle: "bold" },
        { content: "- $ 452.319,17", fontStyle: "bold" },
        { content: "$ 89.561,99", fontStyle: "bold" },
        { content: "$ 184.765,45", fontStyle: "bold" },
        { content: "$ 288.170,60", fontStyle: "bold" },
        { content: "$ 3.514,69", fontStyle: "bold" },
        { content: "$ 566.012,73", fontStyle: "bold" },
      ]);

      autoTable(doc, {
        startY: 24,
        head: [
          [
            "UNIDAD / PROP.",
            "%",
            "DEUDA ANT.",
            "PAGOS",
            "SUBTOTAL",
            "ORDINARIAS",
            "EXTRAORDINARIA",
            "CARGOS",
            "TOTAL",
          ],
        ],
        body: bodyDist,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 1.8 },
        headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 14, halign: "center" },
          2: { cellWidth: 19, halign: "right" },
          3: { cellWidth: 20, halign: "right", textColor: [16, 185, 129] },
          4: { cellWidth: 18, halign: "right" },
          5: { cellWidth: 20, halign: "right" },
          6: { cellWidth: 21, halign: "right" },
          7: { cellWidth: 19, halign: "right" },
          8: { cellWidth: 25, halign: "right", fontStyle: "bold" },
        },
      });

      const finalYPage2 = (doc as any).lastAutoTable.finalY || 160;

      // Alias para transferencia
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, finalYPage2 + 8, 80, 12, 1, 1, "FD");
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.text("Alias para transferencia: CONSORCIO.CALLE425", 18, finalYPage2 + 15.5);

      // Firmas
      doc.setDrawColor(100, 116, 139);
      doc.line(30, finalYPage2 + 45, 85, finalYPage2 + 45);
      doc.line(125, finalYPage2 + 45, 180, finalYPage2 + 45);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text("Firma Administración", 57.5, finalYPage2 + 50, { align: "center" });
      doc.text("Sello Consorcio", 152.5, finalYPage2 + 50, { align: "center" });

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Página 2 de 2 • Liquidación Oficial Consorcio Calle 425", 14, 285);

      // Descargar
      doc.save(`Liquidacion_Consorcio_Calle425_${periodo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (err) {
      console.error("Error al exportar liquidación:", err);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Liquidación Oficial de Expensas — Consorcio Calle 425
              </h3>
              <p className="text-xs text-slate-500">Período {periodo} • 9 Unidades Funcionales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/30 dark:bg-slate-950/20">
          <button
            onClick={() => setTabActiva("caja")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              tabActiva === "caja"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>1. Estado de Caja (Rendición de Cuentas)</span>
          </button>
          <button
            onClick={() => setTabActiva("distribucion")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              tabActiva === "distribucion"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>2. Planilla de Distribución (9 UFs)</span>
          </button>
        </div>

        {/* Contenido según Tab */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {tabActiva === "caja" ? (
            /* HOJA 1: ESTADO DE CAJA */
            <div className="space-y-4">
              {/* Resumen & Reglas Financieras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Saldo Anterior Acumulado:
                  </span>
                  <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                    $1.709.442,29
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Saldo Final Real en Caja:
                  </span>
                  <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300 font-mono">
                    $2.005.796,01
                  </span>
                </div>
              </div>

              {/* Aclaraciones Contables Clave */}
              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-600" />
                  <span>Aclaración sobre Egresos, Compensaciones y Fondos:</span>
                </div>
                <p>
                  • <strong>Recupero Mario 4/4 ($88.170,60):</strong> Es un gasto de materiales que ya fue descontado oportunamente de caja en el período en que se compraron los insumos. En esta liquidación solo se está recuperando de los copropietarios, <u>por eso no se vuelve a descontar del saldo</u>.
                </p>
                <p>
                  • <strong>Guardia Sustituta de Limpieza ($16.800,00) y Multa ($24.000,00):</strong> Si un departamento no cumple su turno de limpieza, <u>se le imputa una multa como cargo en sus expensas</u> (ej. UF 6 con +$24.000). Al vecino que asume el reemplazo y realiza la limpieza <u>se le descuenta y retribuye en sus expensas como crédito</u> (ej. UF 7 con -$16.800 en la columna Cargos). Por eso se recauda y no requiere desembolso directo de caja.
                </p>
                <p>
                  • <strong>Internet ($12.000,00):</strong> Es provisto por la UF 8, por lo que su valor se le descuenta directamente en sus expensas (crédito de -$12.000).
                </p>
                <p>
                  • <strong>CUOTA: Fondo de Reserva ($200.000,00):</strong> Es una cuota extraordinaria emitida para constituir el fondo común de obras; <u>no representa un gasto ni un egreso de caja</u>.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2.5">Detalle / Movimiento</th>
                      <th className="p-2.5 text-right text-emerald-600">Ingresos</th>
                      <th className="p-2.5 text-right">Ordinarias</th>
                      <th className="p-2.5 text-right">Extraordinaria</th>
                      <th className="p-2.5 text-right">Saldo en Caja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {ESTADO_CAJA_ITEMS.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                          item.tipo === "recupero" || item.tipo === "fondo"
                            ? "bg-amber-50/30 dark:bg-amber-950/15"
                            : ""
                        }`}
                      >
                        <td className="p-2.5">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {item.detalle}
                            </span>
                            {item.nota && (
                              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                                ℹ️ {item.nota}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-right text-emerald-600 font-mono font-medium">
                          {item.ingresos ? `$${item.ingresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "-"}
                        </td>
                        <td className="p-2.5 text-right text-slate-600 dark:text-slate-300 font-mono font-medium">
                          {item.ordinarias ? `$${item.ordinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "-"}
                        </td>
                        <td className="p-2.5 text-right text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                          {item.extraordinaria ? `$${item.extraordinaria.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "-"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {item.saldo !== null ? `$${item.saldo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "-"}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                      <td className="p-2.5">TOTALES DEL PERÍODO</td>
                      <td className="p-2.5 text-right text-emerald-600 font-mono">
                        ${ESTADO_CAJA_TOTALES.totalIngresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        ${ESTADO_CAJA_TOTALES.totalOrdinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right text-indigo-600 dark:text-indigo-400 font-mono">
                        ${ESTADO_CAJA_TOTALES.totalExtraordinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400 font-mono font-extrabold text-sm">
                        ${ESTADO_CAJA_TOTALES.saldoFinal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* HOJA 2: PLANILLA DE DISTRIBUCIÓN */
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-2">Unidad</th>
                      <th className="p-2 text-center">%</th>
                      <th className="p-2 text-right">Deuda Ant.</th>
                      <th className="p-2 text-right text-emerald-600">Pagos</th>
                      <th className="p-2 text-right">Subtotal</th>
                      <th className="p-2 text-right">Ordinarias</th>
                      <th className="p-2 text-right">Extraord.</th>
                      <th className="p-2 text-right">Cargos</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {DISTRIBUCION_AGOSTO_2026.map((item) => (
                      <tr key={item.uf} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2 font-medium">{item.uf} - {item.pisoDepto}</td>
                        <td className="p-2 text-center text-slate-500">{item.porcentual.toFixed(2)}%</td>
                        <td className="p-2 text-right font-mono">${item.deudaAnt.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                        <td className="p-2 text-right text-emerald-600 font-mono font-medium">
                          - ${Math.abs(item.pagos).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right font-mono">${item.subtotal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                        <td className="p-2 text-right font-mono">${item.ordinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                        <td className="p-2 text-right font-mono">${item.extraordinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</td>
                        <td className={`p-2 text-right font-mono ${item.cargos > 0 ? "text-rose-600 font-bold" : ""}`}>
                          ${item.cargos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ${item.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                      <td className="p-2">TOTALES</td>
                      <td className="p-2 text-center">100%</td>
                      <td className="p-2 text-right font-mono">$541.881,16</td>
                      <td className="p-2 text-right text-emerald-600 font-mono">- $452.319,17</td>
                      <td className="p-2 text-right font-mono">$89.561,99</td>
                      <td className="p-2 text-right font-mono">$184.765,45</td>
                      <td className="p-2 text-right font-mono">$288.170,60</td>
                      <td className="p-2 text-right font-mono">$3.514,69</td>
                      <td className="p-2 text-right text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                        $566.012,73
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer con Acciones */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
          <button
            onClick={exportarPdfOficial2Paginas}
            disabled={exportando}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{exportando ? "Generando Liquidación..." : "Descargar Liquidación Oficial (PDF 2 Hojas)"}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
