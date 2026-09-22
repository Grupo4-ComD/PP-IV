"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  Receipt,
  Wrench,
  Settings,
  Plus,
  PawPrint,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
  Vote,
  ShieldCheck,
  TrendingUp,
  Percent,
} from "lucide-react";

interface Unidad {
  id: number;
  numero_uf: number;
  piso_depto: string;
  propietario_nombre: string;
  email: string;
  porcentual_m2: number;
  estado_expensa?: string;
  saldo_pendiente?: number;
}

const UNIDADES_DEFAULT: Unidad[] = [
  { id: 1, numero_uf: 1, piso_depto: "PB A", propietario_nombre: "Paula Administradora", email: "paula.admin@calle425.com", porcentual_m2: 7.60, estado_expensa: "pagado", saldo_pendiente: 0 },
  { id: 2, numero_uf: 2, piso_depto: "PB B", propietario_nombre: "González, Mario", email: "mario.gonzalez@calle425.com", porcentual_m2: 7.60, estado_expensa: "pendiente", saldo_pendiente: 51895 },
  { id: 3, numero_uf: 3, piso_depto: "PB C", propietario_nombre: "Martínez, Laura", email: "laura.martinez@calle425.com", porcentual_m2: 11.20, estado_expensa: "pagado", saldo_pendiente: 0 },
  { id: 4, numero_uf: 4, piso_depto: "1° A", propietario_nombre: "Rodríguez, Carlos", email: "carlos.rodriguez@calle425.com", porcentual_m2: 9.20, estado_expensa: "pagado", saldo_pendiente: 0 },
  { id: 5, numero_uf: 5, piso_depto: "1° B", propietario_nombre: "Fernández, Lucía", email: "lucia.fernandez@calle425.com", porcentual_m2: 9.20, estado_expensa: "pendiente", saldo_pendiente: 52000 },
  { id: 6, numero_uf: 6, piso_depto: "1° C", propietario_nombre: "López, Diego", email: "diego.lopez@calle425.com", porcentual_m2: 9.50, estado_expensa: "pendiente", saldo_pendiente: 51895 },
  { id: 7, numero_uf: 7, piso_depto: "2° A", propietario_nombre: "Sciulli, Guillermo", email: "gsciulli@calle425.com", porcentual_m2: 15.70, estado_expensa: "pagado", saldo_pendiente: 0 },
  { id: 8, numero_uf: 8, piso_depto: "2° B", propietario_nombre: "Greco, Verónica", email: "veronica.greco@calle425.com", porcentual_m2: 15.70, estado_expensa: "pagado", saldo_pendiente: 0 },
  { id: 9, numero_uf: 9, piso_depto: "2° C", propietario_nombre: "Perea, Braian", email: "braian.perea@calle425.com", porcentual_m2: 14.30, estado_expensa: "pagado", saldo_pendiente: 0 },
];

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [unidades, setUnidades] = useState<Unidad[]>(UNIDADES_DEFAULT);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const { data: uData, error } = await supabase
          .from("unidades")
          .select("id, numero_uf, piso_depto, propietario_nombre, email, porcentual_m2")
          .order("numero_uf", { ascending: true });

        if (uData && uData.length > 0 && !error) {
          const merged = uData.map((d: any) => {
            const def = UNIDADES_DEFAULT.find((u) => u.numero_uf === d.numero_uf);
            return {
              ...d,
              porcentual_m2: Number(d.porcentual_m2) || def?.porcentual_m2 || 11.11,
              estado_expensa: def?.estado_expensa || "pagado",
              saldo_pendiente: def?.saldo_pendiente || 0,
            };
          });
          setUnidades(merged);
        }
      } catch (err) {
        console.warn("Usando datos locales de dashboard:", err);
      }
    }

    loadDashboard();
  }, [supabase]);

  const ufsAlDia = unidades.filter((u) => u.estado_expensa === "pagado").length;
  const ufsMora = unidades.filter((u) => (u.saldo_pendiente || 0) > 0).length;
  const totalMoraPendiente = unidades.reduce((acc, u) => acc + (u.saldo_pendiente || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar Admin Modular */}
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-7xl">
        {/* Header Stitch 06 */}
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

        {/* Bento Grid KPIs Stitch 06 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recaudación Mes</span>
              <Receipt className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">$1.240.000</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{Math.round((ufsAlDia / 9) * 100)}% Cobrado ({ufsAlDia}/9 UFs)</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidades en Mora</span>
              <AlertCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-rose-600 font-mono">{ufsMora} UFs</div>
            <p className="text-xs text-slate-500 mt-2">
              Saldo pendiente: <strong className="font-mono text-rose-600">${totalMoraPendiente.toLocaleString("es-AR")}</strong>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tickets ITIL</span>
              <Wrench className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-600 font-mono">2 Activos</div>
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
              9 Departamentos • 100.00%
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
