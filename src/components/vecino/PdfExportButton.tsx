"use client";

import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PdfExportProps {
  unidad: {
    numero_uf: number;
    piso_depto: string;
    propietario_nombre: string;
    email: string;
  };
  expensa: {
    id: number | string;
    periodo_mes: number;
    periodo_anio: number;
    monto_ordinario: number;
    recargo_mora: number;
    total_pagar: number;
    fecha_vencimiento: string;
    estado: "pendiente" | "en_verificacion" | "pagado";
  };
}

export default function PdfExportButton({ unidad, expensa }: PdfExportProps) {
  const [generating, setGenerating] = useState(false);

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const handleGeneratePdf = () => {
    try {
      setGenerating(true);

      const doc = new jsPDF();
      const nombreMes = meses[expensa.periodo_mes - 1] || "Mes";

      // 1. Encabezado Institucional
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(0, 0, 210, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("CONSORCIO INTELIGENTE CALLE 425", 14, 11);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Plataforma Residencial DeveloPet Friendly • Reg. Propiedad Horizontal", 14, 18);

      // Estado del Comprobante
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      const estadoTexto =
        expensa.estado === "pagado"
          ? "[ ESTADO: PAGADO / AL DÍA ]"
          : expensa.estado === "en_verificacion"
          ? "[ ESTADO: EN VERIFICACIÓN ]"
          : "[ ESTADO: PENDIENTE DE PAGO ]";
      doc.text(estadoTexto, 200, 15, { align: "right" });

      // 2. Título de la Liquidación
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(
        `EXTRACTO INDIVIDUAL DE EXPENSAS — ${nombreMes.toUpperCase()} ${expensa.periodo_anio}`,
        14,
        34
      );

      // 3. Ficha Técnica de la Unidad Funcional
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 38, 182, 28, 2, 2, "F");
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 38, 182, 28, 2, 2, "D");

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("UNIDAD FUNCIONAL:", 18, 45);
      doc.text("TITULAR / PROPIETARIO:", 18, 53);
      doc.text("CORREO REGISTRADO:", 18, 61);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(`UF 0${unidad.numero_uf} (Piso/Depto: ${unidad.piso_depto})`, 65, 45);
      doc.text(unidad.propietario_nombre, 65, 53);
      doc.text(unidad.email, 65, 61);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("1° VENCIMIENTO:", 135, 45);
      doc.text("PORCENTUAL:", 135, 53);
      doc.text("EMISIÓN:", 135, 61);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.text(expensa.fecha_vencimiento, 170, 45);
      doc.text("11.11% (1/9 UF)", 170, 53);
      doc.text(new Date().toLocaleDateString("es-AR"), 170, 61);

      // 4. Tabla de Conceptos Desglosados
      const tableData = [
        ["1", "Gastos Ordinarios de Mantenimiento y Servicios", "$ 32.000,00"],
        ["2", "Seguro Integral de Consorcio y Responsabilidad Civil", "$ 7.500,00"],
        ["3", "Fondo Común de Reserva Operativa y Limpieza", "$ 9.000,00"],
      ];

      if (expensa.recargo_mora > 0) {
        tableData.push([
          "4",
          "Interés por Mora (7% s/saldo impago vencido)",
          `$ ${expensa.recargo_mora.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        ]);
      }

      autoTable(doc, {
        startY: 72,
        head: [["Item", "Concepto / Descripción del Gasto", "Monto Imputado"]],
        body: tableData,
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8.5,
          textColor: [51, 65, 85],
        },
        columnStyles: {
          0: { cellWidth: 15, halign: "center" },
          1: { cellWidth: 125 },
          2: { cellWidth: 42, halign: "right", fontStyle: "bold" },
        },
        theme: "striped",
      });

      const finalY = (doc as any).lastAutoTable.finalY || 130;

      // 5. Bloque de Totales y Liquidación
      doc.setFillColor(241, 245, 249);
      doc.rect(120, finalY + 5, 76, 32, "F");
      doc.setDrawColor(203, 213, 225);
      doc.rect(120, finalY + 5, 76, 32, "D");

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("Subtotal Ordinario:", 124, finalY + 12);
      doc.text(
        `$ ${expensa.monto_ordinario.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        192,
        finalY + 12,
        { align: "right" }
      );

      doc.text("Recargo Mora (7%):", 124, finalY + 19);
      doc.text(
        `$ ${expensa.recargo_mora.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        192,
        finalY + 19,
        { align: "right" }
      );

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("TOTAL A PAGAR:", 124, finalY + 30);
      doc.text(
        `$ ${expensa.total_pagar.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`,
        192,
        finalY + 30,
        { align: "right" }
      );

      // 6. Datos Bancarios para Transferencia
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text("MEDIOS DE PAGO Y TRANSFERENCIA BANCARIA:", 14, finalY + 12);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text("• Banco: Banco Provincia de Buenos Aires", 14, finalY + 18);
      doc.text("• Titular: Consorcio Propietarios Calle 425", 14, finalY + 23);
      doc.text("• CBU: 0140999803000012345678", 14, finalY + 28);
      doc.text("• Alias: CONSORCIO.425.MP", 14, finalY + 33);

      // 7. Pie Legal
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Este extracto digital es válido como liquidación de expensas de acuerdo al Reglamento de Copropiedad y Administración del Consorcio Calle 425.",
        105,
        282,
        { align: "center" }
      );

      // Guardar PDF
      doc.save(`Liquidacion_UF${unidad.numero_uf}_${nombreMes}_${expensa.periodo_anio}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGeneratePdf}
      disabled={generating}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition shadow-sm cursor-pointer disabled:opacity-50"
    >
      <span>📄</span>
      <span>{generating ? "Generando Extracto..." : "Descargar Extracto PDF"}</span>
    </button>
  );
}
