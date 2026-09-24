"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createClient } from "@/lib/supabase/client";
import {
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Download,
  Calendar,
  Building2,
  Search,
  Layers,
} from "lucide-react";
import LiquidacionConsolidadaModal from "@/components/admin/LiquidacionConsolidadaModal";

interface ExpensaRecord {

  id: number;
  unidad_id: number;
  periodo_mes: number;
  periodo_anio: number;
  monto_ordinario: number;
  recargo_mora: number;
  total_pagar: number;
  fecha_vencimiento: string;
  estado: "pendiente" | "en_verificacion" | "pagado";
  fecha_pago: string | null;
  unidades?: {
    numero_uf: number;
    piso_depto: string;
    propietario_nombre: string;
  };
}

export default function LiquidacionExpensasPage() {
  const supabase = createClient();

  const [expensas, setExpensas] = useState<ExpensaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [isLiquidacionModalOpen, setIsLiquidacionModalOpen] = useState(false);

  useEffect(() => {
    async function loadExpensas() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("expensas")
          .select(`
            id,
            unidad_id,
            periodo_mes,
            periodo_anio,
            monto_ordinario,
            recargo_mora,
            total_pagar,
            fecha_vencimiento,
            estado,
            fecha_pago,
            unidades (
              numero_uf,
              piso_depto,
              propietario_nombre
            )
          `)
          .order("periodo_anio", { ascending: false })
          .order("periodo_mes", { ascending: false })
          .order("unidad_id", { ascending: true });

        if (data && data.length > 0 && !error) {
          setExpensas(data as any);
        } else {
          // Mock data fallback
          setExpensas([
            {
              id: 1,
              unidad_id: 1,
              periodo_mes: 9,
              periodo_anio: 2026,
              monto_ordinario: 52000,
              recargo_mora: 0,
              total_pagar: 52000,
              fecha_vencimiento: "2026-09-25",
              estado: "pagado",
              fecha_pago: "2026-09-18",
              unidades: { numero_uf: 1, piso_depto: "PB A", propietario_nombre: "Paula Administradora" },
            },
            {
              id: 2,
              unidad_id: 2,
              periodo_mes: 9,
              periodo_anio: 2026,
              monto_ordinario: 52000,
              recargo_mora: 0,
              total_pagar: 52000,
              fecha_vencimiento: "2026-09-25",
              estado: "pendiente",
              fecha_pago: null,
              unidades: { numero_uf: 2, piso_depto: "PB B", propietario_nombre: "González, Mario" },
            },
            {
              id: 3,
              unidad_id: 3,
              periodo_mes: 9,
              periodo_anio: 2026,
              monto_ordinario: 52000,
              recargo_mora: 0,
              total_pagar: 52000,
              fecha_vencimiento: "2026-09-25",
              estado: "pagado",
              fecha_pago: "2026-09-20",
              unidades: { numero_uf: 3, piso_depto: "Piso 1 A", propietario_nombre: "Martínez, Laura" },
            },
            {
              id: 4,
              unidad_id: 2,
              periodo_mes: 8,
              periodo_anio: 2026,
              monto_ordinario: 48500,
              recargo_mora: 3395,
              total_pagar: 51895,
              fecha_vencimiento: "2026-08-15",
              estado: "pendiente",
              fecha_pago: null,
              unidades: { numero_uf: 2, piso_depto: "PB B", propietario_nombre: "González, Mario" },
            },
          ]);
        }
      } catch (err) {
        console.warn("Error cargando expensas:", err);
      } finally {
        setLoading(false);
      }
    }

    loadExpensas();
  }, [supabase]);

  const expensasFiltradas = expensas.filter((e) => {
    const matchEstado = filtroEstado === "todos" || e.estado === filtroEstado;
    const matchBusqueda =
      busqueda === "" ||
      e.unidades?.propietario_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      e.unidades?.piso_depto.toLowerCase().includes(busqueda.toLowerCase()) ||
      `uf ${e.unidades?.numero_uf}`.toLowerCase().includes(busqueda.toLowerCase());
    return matchEstado && matchBusqueda;
  });

  const mesesNombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Receipt className="w-4 h-4" />
              <span>Consorcio Calle 425 • 9 UFs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Liquidación de Expensas
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Control de emisión, recaudación, estados de mora y comprobantes de pago.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsLiquidacionModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Ver Liquidación Oficial (9 UFs)</span>
            </button>

            <Link
              href="/admin/expensas/generar"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Nueva Expensa</span>
            </Link>
          </div>
        </header>

        {/* Filtros */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por UF o propietario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pagado">Pagados</option>
              <option value="pendiente">Pendientes / En Mora</option>
              <option value="en_verificacion">En Verificación</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Propietario</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3">Mora (7%)</th>
                  <th className="px-4 py-3 text-right">Total a Pagar</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expensasFiltradas.map((e) => {
                  const tieneMora = e.recargo_mora > 0;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {mesesNombres[e.periodo_mes - 1]} {e.periodo_anio}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        UF {e.unidades?.numero_uf || e.unidad_id} ({e.unidades?.piso_depto})
                      </td>
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                        {e.unidades?.propietario_nombre || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{e.fecha_vencimiento}</td>
                      <td className="px-4 py-3.5 font-mono">
                        {tieneMora ? (
                          <span className="text-rose-600 font-bold">
                            +${e.recargo_mora.toLocaleString("es-AR")}
                          </span>
                        ) : (
                          <span className="text-slate-400">$0</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ${e.total_pagar.toLocaleString("es-AR")}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {e.estado === "pagado" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Al día</span>
                          </span>
                        ) : tieneMora ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800">
                            <AlertCircle className="w-3 h-3" />
                            <span>En mora</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Pendiente</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de Liquidación Consolidada */}
        <LiquidacionConsolidadaModal
          isOpen={isLiquidacionModalOpen}
          onClose={() => setIsLiquidacionModalOpen(false)}
        />
      </main>
    </div>
  );
}
