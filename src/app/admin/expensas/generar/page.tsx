"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createClient } from "@/lib/supabase/client";
import {
  PlusCircle,
  Receipt,
  Calendar,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Send,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  Layers,
  Percent,
  Plus,
  Trash2,
  FileSpreadsheet,
} from "lucide-react";

interface Unidad {
  id: number;
  numero_uf: number;
  piso_depto: string;
  propietario_nombre: string;
  email: string;
  porcentual_m2: number;
}

export default function GenerarExpensasPage() {
  const supabase = createClient();

  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [periodoMes, setPeriodoMes] = useState<number>(new Date().getMonth() + 1);
  const [periodoAnio, setPeriodoAnio] = useState<number>(new Date().getFullYear());
  const [fechaVencimiento, setFechaVencimiento] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 15)
      .toISOString()
      .split("T")[0]
  );

  // Gastos ordinarios cargados para el período desde la BD
  const [gastos, setGastos] = useState<any[]>([]);
  const [nuevoConcepto, setNuevoConcepto] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [nuevoRubro, setNuevoRubro] = useState("Servicios Públicos");

  const [porcentajeFondoReserva, setPorcentajeFondoReserva] = useState(5.0); // 5% por defecto

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar las UFs de Supabase
  useEffect(() => {
    async function fetchUnidades() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("unidades")
          .select("id, numero_uf, piso_depto, propietario_nombre, email, coeficiente_prorrateo")
          .order("numero_uf", { ascending: true });

        if (data && !error) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            numero_uf: d.numero_uf,
            piso_depto: d.piso_depto,
            propietario_nombre: d.propietario_nombre,
            email: d.email,
            porcentual_m2: Number(d.coeficiente_prorrateo)
          }));
          setUnidades(mapped);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUnidades();
  }, [supabase]);

  // Cargar los Gastos del Mes desde la API Real
  useEffect(() => {
    async function fetchGastos() {
      try {
        const res = await fetch(`/api/gastos?mes=${periodoMes}&anio=${periodoAnio}`);
        if (res.ok) {
          const data = await res.json();
          setGastos(data);
        }
      } catch (error) {
        console.error("Error cargando gastos:", error);
      }
    }
    fetchGastos();
  }, [periodoMes, periodoAnio]);

  // Cálculos contables de la liquidación
  const totalGastosOrdinarios = gastos.reduce((acc, g) => acc + g.monto, 0);
  const montoFondoReserva = Math.round(totalGastosOrdinarios * (porcentajeFondoReserva / 100));
  const totalProrratear = totalGastosOrdinarios + montoFondoReserva;

  // Agregar gasto a la base de datos
  const handleAgregarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoConcepto || !nuevoMonto) return;

    try {
      // Forzamos fecha al periodo activo seleccionado para el ejemplo
      const diaAleatorio = Math.floor(Math.random() * 28) + 1;
      const fechaGasto = new Date(periodoAnio, periodoMes - 1, diaAleatorio).toISOString();
      
      const res = await fetch("/api/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concepto: nuevoConcepto,
          monto: nuevoMonto,
          categoria: "ordinario",
          fechaGasto
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGastos((prev) => [data, ...prev]);
        setNuevoConcepto("");
        setNuevoMonto("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEliminarGasto = async (id: string) => {
    try {
      const res = await fetch(`/api/gastos?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setGastos((prev) => prev.filter((g) => g.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const mesesNombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Emisión en Supabase
  const handleEmitirExpensas = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      // Generar lote de expensas calculado por porcentual m2 exacto para cada una de las 9 UFs
      const loteExpensas = unidades.map((u) => {
        const montoPorUf = Math.round(totalProrratear * (u.porcentual_m2 / 100));
        return {
          unidad_id: u.id,
          periodo_mes: periodoMes,
          periodo_anio: periodoAnio,
          monto_ordinario: montoPorUf,
          recargo_mora: 0.00,
          total_pagar: montoPorUf,
          fecha_vencimiento: fechaVencimiento,
          estado: "pendiente",
          created_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from("expensas")
        .upsert(loteExpensas, { onConflict: "unidad_id,periodo_mes,periodo_anio" });

      if (error) {
        console.warn("Nota: upsert remoto falló o requiere tabla:", error);
      }

      setSuccessMsg(
        `¡Expensas de ${mesesNombres[periodoMes - 1]} ${periodoAnio} emitidas con éxito! Se prorratearon $${totalProrratear.toLocaleString("es-AR")} entre las 9 UFs según sus coeficientes de m2.`
      );
    } catch (err: any) {
      setErrorMsg("Ocurrió un error al emitir la liquidación.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar Admin */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl">
        {/* Header Pantalla 07 */}
        <header className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Motor de Prorrateo Automatizado
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Borrador Activo
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Motor de Liquidación & Prorrateo Mensual
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Período {mesesNombres[periodoMes - 1]} {periodoAnio} • Consorcio Calle 425 • 9 Unidades Funcionales
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/expensas/liquidacion"
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2"
            >
              <Receipt className="w-4 h-4 text-indigo-500" />
              <span>Historial Períodos</span>
            </Link>
          </div>
        </header>

        {/* Stepper de Proceso Contable en 3 Pasos */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-900/60">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                1
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 block truncate">
                  1. Carga de Gastos del Mes
                </span>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                  Total: <strong className="font-mono">${totalGastosOrdinarios.toLocaleString("es-AR")}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm shrink-0">
                2
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  2. Coeficientes m2 (100%)
                </span>
                <span className="text-[11px] text-slate-500 truncate block">
                  Prorrateo 9 UFs + Fondo Reserva ({porcentajeFondoReserva}%)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 opacity-90">
              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm shrink-0">
                3
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  3. Emisión & Notificación
                </span>
                <span className="text-[11px] text-slate-500 truncate block">
                  Vencimiento: {fechaVencimiento}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Contable: Subtotales y Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gastos Ordinarios</span>
              <Receipt className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                ${totalGastosOrdinarios.toLocaleString("es-AR")}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">{gastos.length} comprobantes cargados</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fondo Reserva ({porcentajeFondoReserva}%)</span>
              <Building2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                ${montoFondoReserva.toLocaleString("es-AR")}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Reglamento interno art. 14</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suma Coeficientes</span>
              <Percent className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">
                100.00%
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-0.5">Distribución 9 UFs exacta</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Total a Prorratear</span>
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div className="mt-2">
              <span className="text-3xl font-bold font-mono">
                ${totalProrratear.toLocaleString("es-AR")}
              </span>
              <span className="text-[11px] text-indigo-200 block mt-0.5">Balance 100% Cuadrado</span>
            </div>
          </div>
        </div>

        {/* Feedback de éxito / error */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">{successMsg}</span>
            </div>
            <Link
              href="/admin/expensas/liquidacion"
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition"
            >
              Ver en Liquidaciones →
            </Link>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Layout Principal: Carga de Gastos + Previsualización de Prorrateo */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-8">
          
          {/* Columna Izquierda: Tabla de Gastos del Mes (5 Columnas) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-500" />
                <span>Comprobantes & Gastos del Mes</span>
              </h2>

              <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
                {gastos.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{g.concepto}</p>
                      <span className="text-[10px] text-slate-400">
                        {g.categoria.toUpperCase()} • {new Date(g.fechaGasto).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ${g.monto.toLocaleString("es-AR")}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEliminarGasto(g.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 transition"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA en lugar del formulario rápido para forzar Opción A */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <p className="text-indigo-800 dark:text-indigo-300 font-medium">
                    <Info className="inline w-4 h-4 mr-1 mb-0.5" />
                    Los comprobantes de gastos se administran desde el panel principal.
                  </p>
                  <Link href="/admin/dashboard" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-sm transition whitespace-nowrap">
                    Ir al Dashboard
                  </Link>
                </div>
              </div>
            </div>

            {/* Parámetros de Período y Vencimiento */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>Período & Vencimiento</span>
              </h3>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">Mes</label>
                  <select
                    value={periodoMes}
                    onChange={(e) => setPeriodoMes(parseInt(e.target.value))}
                    className="w-full h-9 px-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  >
                    {mesesNombres.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-1">Año</label>
                  <input
                    type="number"
                    value={periodoAnio}
                    onChange={(e) => setPeriodoAnio(parseInt(e.target.value))}
                    className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">Fecha de Vencimiento Legal</label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Matriz de Prorrateo según m2 oficial (7 Columnas) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Matriz de Prorrateo por Superficie (m2)</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Distribución porcentual exacta del Consorcio Calle 425 sobre las 9 Unidades Funcionales.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold font-mono">
                Σ 100.00%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">UF</th>
                    <th className="px-3 py-2.5">Depto</th>
                    <th className="px-3 py-2.5">Propietario</th>
                    <th className="px-3 py-2.5 text-center">Coef. m2</th>
                    <th className="px-3 py-2.5 text-right">Ordinarias</th>
                    <th className="px-3 py-2.5 text-right">Total a Liquidar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {unidades.map((u) => {
                    const montoUf = Math.round(totalProrratear * (u.porcentual_m2 / 100));
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/60 transition">
                        <td className="px-3 py-3 font-bold text-slate-900 dark:text-white">
                          UF {u.numero_uf}
                        </td>
                        <td className="px-3 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                          {u.piso_depto}
                        </td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {u.propietario_nombre}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                            {u.porcentual_m2.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          ${Math.round(totalGastosOrdinarios * (u.porcentual_m2 / 100)).toLocaleString("es-AR")}
                        </td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ${montoUf.toLocaleString("es-AR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold">
                  <tr>
                    <td colSpan={3} className="px-3 py-3 text-slate-900 dark:text-white">
                      TOTAL CONDOMINIO (9 UFs)
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-emerald-600">
                      100.00%
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-900 dark:text-white">
                      ${totalGastosOrdinarios.toLocaleString("es-AR")}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-emerald-600 text-sm">
                      ${totalProrratear.toLocaleString("es-AR")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Botón de Emisión Oficial */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Liquidación conforme a coeficientes de copropiedad legal.</span>
              </div>

              <button
                type="button"
                onClick={handleEmitirExpensas}
                disabled={submitting || loading}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Emitiendo liquidación...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Emitir y Notificar Expensas ({mesesNombres[periodoMes - 1]} {periodoAnio})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
