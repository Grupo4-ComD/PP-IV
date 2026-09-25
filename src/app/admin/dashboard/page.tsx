"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import RegistrarCobroModal from "@/components/admin/RegistrarCobroModal";
import RegistrarGastoModal from "@/components/admin/RegistrarGastoModal";
import CargoVecinoModal from "@/components/admin/CargoVecinoModal";
import CuotaExtraModal from "@/components/admin/CuotaExtraModal";
import AjusteCajaModal from "@/components/admin/AjusteCajaModal";
import {
  Building2,
  Receipt,
  Wrench,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  DollarSign,
  Wallet,
  Settings2,
  TrendingDown,
  UserPlus,
  Users,
  ArrowRightLeft,
  FileText
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
    saldoCaja: 0,
    recaudacionMes: 0,
    ufsAlDia: 0,
    ufsMora: 0,
    totalMoraPendiente: 0,
    ticketsActivos: 0
  });
  const [cargando, setCargando] = useState(true);
  const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false);
  const [isCargoModalOpen, setIsCargoModalOpen] = useState(false);
  const [isCuotaModalOpen, setIsCuotaModalOpen] = useState(false);
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  
  // Nuevo estado para tabs
  const [activeTab, setActiveTab] = useState<"movimientos" | "unidades">("movimientos");
  const [movimientos, setMovimientos] = useState<any[]>([]);

  const loadDashboard = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setMetricas({
          saldoCaja: data.saldoCaja || 0,
          recaudacionMes: data.recaudacionMes,
          ufsAlDia: data.ufsAlDia,
          ufsMora: data.ufsMora,
          totalMoraPendiente: data.totalMoraPendiente,
          ticketsActivos: data.ticketsActivos
        });
        setUnidades(data.unidades);
        setMovimientos(data.movimientos || []);
      }
    } catch (err) {
      console.error("Error al cargar el dashboard real:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
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
              Métricas contables en tiempo real, control de caja y operaciones rápidas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setIsCobroModalOpen(true)}
              className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>+ Registrar Cobro</span>
            </button>
            <Link
              href="/admin/expensas/generar"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>+ Emitir Expensas</span>
            </Link>
          </div>
        </header>

        {/* Bento Grid KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
          <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-lg flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-24 h-24 text-white" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo en Caja Real</span>
              <Wallet className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2 text-3xl font-bold text-white font-mono relative z-10">
              ${metricas.saldoCaja.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-2 relative z-10">
              Disponible operativo
            </p>
          </div>

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
              Pendiente: <strong className="font-mono text-rose-600">${metricas.totalMoraPendiente.toLocaleString("es-AR")}</strong>
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
        </div>

        {/* Command Center */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            Centro de Operaciones
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button onClick={() => setIsGastoModalOpen(true)} className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-950/30 transition group">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                <TrendingDown className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Gasto Edificio</span>
            </button>
            <button onClick={() => setIsCargoModalOpen(true)} className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950/30 transition group">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                <UserPlus className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Cargo a Vecino</span>
            </button>
            <button onClick={() => setIsCuotaModalOpen(true)} className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/30 transition group">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center group-hover:scale-110 transition shadow-sm">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Cuota Extra</span>
            </button>
            <button onClick={() => setIsAjusteModalOpen(true)} className="flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition group">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition shadow-sm border border-slate-200 dark:border-slate-700">
                <ArrowRightLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
              <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300">Ajuste de Caja</span>
            </button>
          </div>
        </div>

        {/* Data Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab("movimientos")}
                className={`text-sm font-bold pb-4 -mb-[17px] border-b-2 transition ${activeTab === "movimientos" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
              >
                Últimos Movimientos
              </button>
              <button 
                onClick={() => setActiveTab("unidades")}
                className={`text-sm font-bold pb-4 -mb-[17px] border-b-2 transition ${activeTab === "unidades" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400" : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"}`}
              >
                Estado Unidades
              </button>
            </div>
            {activeTab === "unidades" && (
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-xs font-bold font-mono">
                {unidades.length} Deptos • 100%
              </span>
            )}
          </div>

          {activeTab === "movimientos" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Período</th>
                    <th className="px-4 py-3">Detalle</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-center">Tipo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {movimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-950/70 transition">
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{m.periodo}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{m.detalle}</td>
                      <td className={`px-4 py-3.5 text-right font-mono font-bold ${m.tipo === "GASTO" ? "text-rose-600" : m.tipo === "PAGO" ? "text-emerald-600" : "text-amber-600"}`}>
                        {m.tipo === "GASTO" ? "-" : "+"}${m.monto.toLocaleString("es-AR")}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          m.tipo === "GASTO" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : 
                          m.tipo === "PAGO" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {m.tipo}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">No hay movimientos recientes.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
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
          )}
        </div>

        <RegistrarCobroModal 
          isOpen={isCobroModalOpen}
          onClose={() => setIsCobroModalOpen(false)}
          unidades={unidades}
          onCobroExitoso={loadDashboard}
        />
        <RegistrarGastoModal isOpen={isGastoModalOpen} onClose={() => setIsGastoModalOpen(false)} />
        <CargoVecinoModal isOpen={isCargoModalOpen} onClose={() => setIsCargoModalOpen(false)} unidades={unidades} />
        <CuotaExtraModal isOpen={isCuotaModalOpen} onClose={() => setIsCuotaModalOpen(false)} />
        <AjusteCajaModal isOpen={isAjusteModalOpen} onClose={() => setIsAjusteModalOpen(false)} />
      </main>
    </div>
  );
}
