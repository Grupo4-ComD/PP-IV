"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Building2,
  Receipt,
  Wrench,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";

interface Unidad {
  id: string;
  numero_uf: number;
  piso_depto: string;
  propietario_nombre: string;
  email: string;
  porcentual_m2: number;
  estado_expensa: string;
  saldo_pendiente: number;
}

export default function AdminDashboardPage() {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [metricas, setMetricas] = useState({
    recaudacionMes: 0,
    ufsAlDia: 0,
    ufsMora: 0,
    totalMoraPendiente: 0,
    ticketsActivos: 0
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (res.ok) {
          const data = await res.json();
          setMetricas({
            recaudacionMes: data.recaudacionMes,
            ufsAlDia: data.ufsAlDia,
            ufsMora: data.ufsMora,
            totalMoraPendiente: data.totalMoraPendiente,
            ticketsActivos: data.ticketsActivos
          });
          setUnidades(data.unidades);
        }
      } catch (err) {
        console.error("Error al cargar el dashboard real:", err);
      } finally {
        setCargando(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar Admin Modular */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl relative">
        
        {/* Loader Overlay */}
        {cargando && (
          <div className="absolute inset-0 z-10 bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-sm flex items-center justify-center flex-col gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Cargando panel financiero en vivo...
            </span>
          </div>
        )}

        <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Consorcio Calle 425 • Panel General</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Dashboard Central de Administración
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Métricas contables en tiempo real, distribución de expensas por m2 y estado operativo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/expensas/generar"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Emitir Expensas</span>
            </Link>
          </div>
        </header>

        {/* Bento Grid KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recaudación Mes</span>
              <Receipt className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
              ${metricas.recaudacionMes.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{unidades.length > 0 ? Math.round((metricas.ufsAlDia / unidades.length) * 100) : 0}% Cobrado ({metricas.ufsAlDia}/{unidades.length} UFs)</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidades en Mora</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-600 font-mono">{metricas.ufsMora} UFs</div>
            <p className="text-xs text-slate-500 mt-2">
              Saldo pendiente: <strong className="font-mono text-rose-600">${metricas.totalMoraPendiente.toLocaleString("es-AR")}</strong>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tickets ITIL</span>
              <Wrench className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">{metricas.ticketsActivos} Activos</div>
            <Link href="/admin/mesa-ayuda" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 flex items-center gap-1">
              <span>Gestionar cotizaciones →</span>
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guardias Limpieza</span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">100%</div>
            <p className="text-xs text-emerald-600 font-medium mt-2">4 semanas asignadas</p>
          </div>
        </div>

        {/* Resumen Oficial de Unidades Funcionales con Porcentuales m2 */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Estado de Unidades Funcionales (Distribución m2)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Prorrateo de copropiedad según planos fiscales del Consorcio Calle 425.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-bold font-mono">
              {unidades.length} Departamentos • 100.00%
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Piso / Depto</th>
                  <th className="px-4 py-3">Propietario</th>
                  <th className="px-4 py-3 text-center">Coeficiente m2</th>
                  <th className="px-4 py-3 text-center">Estado Expensa</th>
                  <th className="px-4 py-3 text-right">Saldo Pendiente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {unidades.map((u) => {
                  const alDia = u.estado_expensa === "pagado";
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/70 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        UF {u.numero_uf}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-indigo-600 dark:text-indigo-400">
                        {u.piso_depto}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                        {u.propietario_nombre}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {u.porcentual_m2.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {alDia ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Al día</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300">
                            <AlertCircle className="w-3 h-3" />
                            <span>En mora</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold">
                        {alDia ? (
                          <span className="text-slate-400">$0</span>
                        ) : (
                          <span className="text-rose-600">${u.saldo_pendiente?.toLocaleString("es-AR")}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
