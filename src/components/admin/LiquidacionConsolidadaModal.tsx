"use client";

import React, { useState, useEffect } from "react";
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
  Loader2,
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

// Datos de respaldo con la contabilidad oficial de Octubre 2026
const MOCK_DISTRIBUCION: DistribucionItem[] = [
  { uf: 1, pisoDepto: "PB A", propietario: "Paula Administradora", porcentual: 7.60, deudaAnt: 0.00, pagos: 0.00, subtotal: 0.00, ordinarias: 12790.84, extraordinarias: 24320.00, cargos: 0.00, total: 37110.84 },
  { uf: 2, pisoDepto: "PB B", propietario: "González, Mario", porcentual: 7.60, deudaAnt: 0.00, pagos: 0.00, subtotal: 0.00, ordinarias: 12790.84, extraordinarias: 24320.00, cargos: 0.00, total: 37110.84 },
  { uf: 3, pisoDepto: "PB C", propietario: "Martínez, Laura", porcentual: 11.20, deudaAnt: 0.00, pagos: 0.00, subtotal: 0.00, ordinarias: 18849.66, extraordinarias: 35840.00, cargos: 0.00, total: 54689.66 },
  { uf: 4, pisoDepto: "1° A", propietario: "Rodríguez, Carlos", porcentual: 9.20, deudaAnt: 155000.00, pagos: -200000.00, subtotal: -45000.00, ordinarias: 15483.65, extraordinarias: 29440.00, cargos: 0.00, total: -76.35 },
  { uf: 5, pisoDepto: "1° B", propietario: "Fernández, Lucía", porcentual: 9.20, deudaAnt: 0.00, pagos: 0.00, subtotal: 0.00, ordinarias: 15483.65, extraordinarias: 29440.00, cargos: 0.00, total: 44923.65 },
  { uf: 6, pisoDepto: "1° C", propietario: "López, Diego", porcentual: 9.50, deudaAnt: 0.00, pagos: 0.00, subtotal: 0.00, ordinarias: 15988.55, extraordinarias: 30400.00, cargos: 0.00, total: 46388.55 },
  { uf: 7, pisoDepto: "2° A", propietario: "Sciulli, Guillermo", porcentual: 15.70, deudaAnt: 0.00, pagos: -90000.00, subtotal: -90000.00, ordinarias: 26423.18, extraordinarias: 50240.00, cargos: 0.00, total: -13336.82 },
  { uf: 8, pisoDepto: "2° B", propietario: "Greco, Verónica", porcentual: 15.70, deudaAnt: 0.00, pagos: 0.00, subtotal: 0.00, ordinarias: 26423.18, extraordinarias: 50240.00, cargos: 0.00, total: 76663.18 },
  { uf: 9, pisoDepto: "2° C", propietario: "Perea, Braian", porcentual: 14.30, deudaAnt: 0.00, pagos: -40929.00, subtotal: -40929.00, ordinarias: 24066.97, extraordinarias: 45760.00, cargos: 0.00, total: 28897.97 },
];

const MOCK_ESTADO_CAJA = [
  { tipo: "ingreso", detalle: "Cobro Unidad 7 - 2° A", ingresos: 90000.00, ordinarias: null, extraordinaria: null, saldo: 90000.00, nota: null },
  { tipo: "ingreso", detalle: "Cobro Unidad 9 - 2° C", ingresos: 40929.00, ordinarias: null, extraordinaria: null, saldo: 130929.00, nota: null },
  { tipo: "ingreso", detalle: "Cobro Unidad 4 - 1° A", ingresos: 200000.00, ordinarias: null, extraordinaria: null, saldo: 330929.00, nota: null },
  { tipo: "egreso", detalle: "Factura Edesur - Espacios Comunes", ingresos: null, ordinarias: 45000.50, extraordinaria: null, saldo: 285928.50, nota: "Descuenta de caja" },
  { tipo: "egreso", detalle: "Aysa - Agua Corriente", ingresos: null, ordinarias: 28300.00, extraordinaria: null, saldo: 257628.50, nota: "Descuenta de caja" },
  { tipo: "egreso", detalle: "Gasto ordinario - test de integración", ingresos: null, ordinarias: 10000.00, extraordinaria: null, saldo: 247628.50, nota: "Descuenta de caja" },
  { tipo: "egreso", detalle: "Reparación", ingresos: null, ordinarias: null, extraordinaria: 120000.00, saldo: 127628.50, nota: "Descuenta de caja" },
  { tipo: "egreso", detalle: "Abono mantenimiento", ingresos: null, ordinarias: 85000.00, extraordinaria: null, saldo: 42628.50, nota: "Descuenta de caja" },
  { tipo: "fondo", detalle: "Cuota Extra: Fondo de reserva (Fondo)", ingresos: null, ordinarias: null, extraordinaria: 200000.00, saldo: null, nota: "Cuota para juntar fondos de reserva y obras, no representa egreso de caja" },
];

const MOCK_ESTADO_CAJA_TOTALES = {
  saldoAnteriorAcumulado: 0.00,
  totalIngresos: 330929.00,
  totalOrdinarias: 168300.50,
  totalExtraordinarias: 320000.00,
  saldoFinal: 42628.50,
};

const formatMoney = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return "-";
  return val.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

interface LiquidacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodo?: string;
}

export default function LiquidacionConsolidadaModal({
  isOpen,
  onClose,
  periodo = "10 / 2026",
}: LiquidacionModalProps) {
  const [tabActiva, setTabActiva] = useState<"caja" | "distribucion">("caja");
  const [exportando, setExportando] = useState(false);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(periodo || "10 / 2026");

  useEffect(() => {
    if (periodo) {
      setPeriodoSeleccionado(periodo);
    }
  }, [periodo]);
  
  // Estados para datos dinámicos
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [distribucion, setDistribucion] = useState<DistribucionItem[]>(MOCK_DISTRIBUCION);
  const [estadoCajaItems, setEstadoCajaItems] = useState<any[]>(MOCK_ESTADO_CAJA);
  const [totalesCaja, setTotalesCaja] = useState<any>(MOCK_ESTADO_CAJA_TOTALES);
  const [usandoMock, setUsandoMock] = useState(false);

  // Fetch a la API Route de Liquidaciones
  useEffect(() => {
    if (isOpen) {
      const cargarLiquidacion = async () => {
        try {
          setCargandoDatos(true);
          const [mesStr, anioStr] = periodoSeleccionado.split(" / ");
          const mes = mesStr ? mesStr.trim() : "10";
          const anio = anioStr ? anioStr.trim() : "2026";
          
          const res = await fetch(`/api/liquidaciones/${anio}/${mes}`);
          if (res.ok) {
            const data = await res.json();
            if (data.distribucion && data.distribucion.length > 0) {
              setDistribucion(data.distribucion);
              setEstadoCajaItems(data.estadoCaja || []);
              setTotalesCaja(data.totalesCaja || MOCK_ESTADO_CAJA_TOTALES);
              setUsandoMock(false);
            } else {
              // Si la BD está vacía (sin unidades), usamos mock para no romper la UI
              throw new Error("Base de datos vacía");
            }
          } else {
            throw new Error("Error en API (probablemente falla conexión BD)");
          }
        } catch (error) {
          console.warn("Usando datos de respaldo (Mock) porque la BD falló:", error);
          setDistribucion(MOCK_DISTRIBUCION);
          setEstadoCajaItems(MOCK_ESTADO_CAJA);
          setTotalesCaja(MOCK_ESTADO_CAJA_TOTALES);
          setUsandoMock(true);
        } finally {
          setCargandoDatos(false);
        }
      };

      cargarLiquidacion();
    }
  }, [isOpen, periodoSeleccionado]);

  // Cálculos dinámicos de los totales de la planilla de distribución
  const totalGralDeudaAnt = distribucion.reduce((acc, item) => acc + item.deudaAnt, 0);
  const totalGralPagos = distribucion.reduce((acc, item) => acc + Math.abs(item.pagos), 0);
  const totalGralSubtotal = distribucion.reduce((acc, item) => acc + item.subtotal, 0);
  const totalGralOrdinarias = distribucion.reduce((acc, item) => acc + item.ordinarias, 0);
  const totalGralExtra = distribucion.reduce((acc, item) => acc + item.extraordinarias, 0);
  const totalGralCargos = distribucion.reduce((acc, item) => acc + item.cargos, 0);
  const totalGralTotal = distribucion.reduce((acc, item) => acc + item.total, 0);


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
      doc.text(`Mes: ${periodoSeleccionado}`, 196, 24, { align: "right" });

      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.5);
      doc.line(14, 27, 196, 27);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("1. ESTADO DE CAJA", 105, 34, { align: "center" });

      const bodyCaja: any[] = estadoCajaItems.map((item) => [
        item.detalle,
        item.ingresos ? `$ ${item.ingresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "",
        item.ordinarias ? `$ ${item.ordinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "",
        item.extraordinaria ? `$ ${item.extraordinaria.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "",
        item.saldo !== null ? `$ ${item.saldo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "--",
      ]);

      // Fila final
      bodyCaja.push([
        { content: "TOTALES DEL PERÍODO", fontStyle: "bold" },
        { content: `$ ${totalesCaja.totalIngresos.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, fontStyle: "bold" },
        { content: `$ ${totalesCaja.totalOrdinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, fontStyle: "bold" },
        { content: `$ ${totalesCaja.totalExtraordinarias.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, fontStyle: "bold" },
        { content: `$ ${totalesCaja.saldoFinal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`, fontStyle: "bold" },
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
      doc.text(`2. PLANILLA DE DISTRIBUCIÓN - PERÍODO ${periodoSeleccionado}`, 105, 18, { align: "center" });

      const bodyDist: any[] = distribucion.map((item) => [
        `${item.uf} - ${item.pisoDepto}`,
        `${item.porcentual.toFixed(2)}%`,
        `$ ${formatMoney(item.deudaAnt)}`,
        `- $ ${formatMoney(Math.abs(item.pagos))}`,
        `$ ${formatMoney(item.subtotal)}`,
        `$ ${formatMoney(item.ordinarias)}`,
        `$ ${formatMoney(item.extraordinarias)}`,
        `$ ${formatMoney(item.cargos)}`,
        item.total < 0
          ? `- $ ${formatMoney(Math.abs(item.total))} (A favor)`
          : `$ ${formatMoney(item.total)}`,
      ]);

      // Totales
      bodyDist.push([
        { content: "TOTALES GENERALES", fontStyle: "bold" },
        { content: "100.00%", fontStyle: "bold" },
        { content: `$ ${formatMoney(totalGralDeudaAnt)}`, fontStyle: "bold" },
        { content: `- $ ${formatMoney(totalGralPagos)}`, fontStyle: "bold" },
        { content: `$ ${formatMoney(totalGralSubtotal)}`, fontStyle: "bold" },
        { content: `$ ${formatMoney(totalGralOrdinarias)}`, fontStyle: "bold" },
        { content: `$ ${formatMoney(totalGralExtra)}`, fontStyle: "bold" },
        { content: `$ ${formatMoney(totalGralCargos)}`, fontStyle: "bold" },
        { content: `$ ${formatMoney(totalGralTotal)}`, fontStyle: "bold" },
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
      doc.save(`Liquidacion_Consorcio_Calle425_${periodoSeleccionado.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    } catch (err) {
      console.error("Error al exportar liquidación:", err);
    } finally {
      setExportando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Loader Overlay */}
        {cargandoDatos && (
          <div className="absolute inset-0 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center flex-col gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Calculando Prorrateos Dinámicos...
            </span>
          </div>
        )}

        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Liquidación Oficial de Expensas — Consorcio Calle 425
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-medium">Período:</span>
                <select
                  value={periodoSeleccionado}
                  onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg px-2 py-0.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="10 / 2026">10 / 2026 (Octubre)</option>
                  <option value="09 / 2026">09 / 2026 (Septiembre)</option>
                  <option value="08 / 2026">08 / 2026 (Agosto)</option>
                  <option value="07 / 2026">07 / 2026 (Julio)</option>
                </select>
                <span className="text-xs text-slate-400">• {distribucion.length} Unidades Funcionales</span>
                {usandoMock && <span className="ml-1 text-amber-500 font-medium text-xs">(Modo Prueba)</span>}
              </div>
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
            <span>2. Planilla de Distribución ({distribucion.length} UFs)</span>
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
                    ${formatMoney(totalesCaja.saldoAnteriorAcumulado ?? 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Saldo Final Real en Caja:
                  </span>
                  <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300 font-mono">
                    ${totalesCaja.saldoFinal.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
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
                  • <strong>Recupero:</strong> Gasto de materiales ya descontado que se recupera de expensas, no descuenta de saldo nuevamente.
                </p>
                <p>
                  • <strong>Multas y Compensaciones (Ej. Limpieza):</strong> Se imputan en los cargos de las UFs. No requieren desembolso de caja directo.
                </p>
                <p>
                  • <strong>Fondo de Reserva:</strong> Cuota para juntar fondos de obras, no representa egreso de caja general.
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
                    {estadoCajaItems.map((item, idx) => (
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
                          {item.ingresos ? `$${formatMoney(item.ingresos)}` : "-"}
                        </td>
                        <td className="p-2.5 text-right text-slate-600 dark:text-slate-300 font-mono font-medium">
                          {item.ordinarias ? `$${formatMoney(item.ordinarias)}` : "-"}
                        </td>
                        <td className="p-2.5 text-right text-indigo-600 dark:text-indigo-400 font-mono font-medium">
                          {item.extraordinaria ? `$${formatMoney(item.extraordinaria)}` : "-"}
                        </td>
                        <td className="p-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                          {item.saldo !== null ? `$${formatMoney(item.saldo)}` : "-"}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                      <td className="p-2.5">TOTALES DEL PERÍODO</td>
                      <td className="p-2.5 text-right text-emerald-600 font-mono">
                        ${formatMoney(totalesCaja.totalIngresos)}
                      </td>
                      <td className="p-2.5 text-right font-mono">
                        ${formatMoney(totalesCaja.totalOrdinarias)}
                      </td>
                      <td className="p-2.5 text-right text-indigo-600 dark:text-indigo-400 font-mono">
                        ${formatMoney(totalesCaja.totalExtraordinarias)}
                      </td>
                      <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400 font-mono font-extrabold text-sm">
                        ${formatMoney(totalesCaja.saldoFinal)}
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
                    {distribucion.map((item) => (
                      <tr key={item.uf} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-2 font-medium">{item.uf} - {item.pisoDepto}</td>
                        <td className="p-2 text-center text-slate-500">{item.porcentual.toFixed(2)}%</td>
                        <td className="p-2 text-right font-mono">${formatMoney(item.deudaAnt)}</td>
                        <td className="p-2 text-right text-emerald-600 font-mono font-medium">
                          - ${formatMoney(Math.abs(item.pagos))}
                        </td>
                        <td className="p-2 text-right font-mono">${formatMoney(item.subtotal)}</td>
                        <td className="p-2 text-right font-mono">${formatMoney(item.ordinarias)}</td>
                        <td className="p-2 text-right font-mono">${formatMoney(item.extraordinarias)}</td>
                        <td className={`p-2 text-right font-mono ${item.cargos > 0 ? "text-rose-600 font-bold" : ""}`}>
                          ${formatMoney(item.cargos)}
                        </td>
                        <td className="p-2 text-right font-mono font-bold">
                          {item.total < 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                              -${formatMoney(Math.abs(item.total))}
                              <span className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                                A favor
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-900 dark:text-white">
                              ${formatMoney(item.total)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white">
                      <td className="p-2">TOTALES</td>
                      <td className="p-2 text-center">100%</td>
                      <td className="p-2 text-right font-mono">${formatMoney(totalGralDeudaAnt)}</td>
                      <td className="p-2 text-right text-emerald-600 font-mono">- ${formatMoney(totalGralPagos)}</td>
                      <td className="p-2 text-right font-mono">${formatMoney(totalGralSubtotal)}</td>
                      <td className="p-2 text-right font-mono">${formatMoney(totalGralOrdinarias)}</td>
                      <td className="p-2 text-right font-mono">${formatMoney(totalGralExtra)}</td>
                      <td className="p-2 text-right font-mono">${formatMoney(totalGralCargos)}</td>
                      <td className="p-2 text-right text-emerald-600 dark:text-emerald-400 font-extrabold font-mono">
                        ${formatMoney(totalGralTotal)}
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
            disabled={exportando || cargandoDatos}
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
