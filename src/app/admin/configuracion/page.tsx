"use client";

import React, { useState, useEffect } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createClient } from "@/lib/supabase/client";
import {
  Settings,
  Percent,
  CreditCard,
  ShieldAlert,
  Vote,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Bot,
  BookOpen,
  FileCode,
  Users,
  Key,
} from "lucide-react";

interface ConfigData {
  tasa_interes_mora: number;
  comision_pasarela_mp: number;
  monto_multa_limpieza: number;
  umbral_consenso_porcentaje: number;
  dias_vencimiento_expensas: number;
}

const DEFAULT_CONFIG: ConfigData = {
  tasa_interes_mora: 7.0,
  comision_pasarela_mp: 0.6,
  monto_multa_limpieza: 24000.0,
  umbral_consenso_porcentaje: 33.33,
  dias_vencimiento_expensas: 15,
};

export default function AdminConfiguracionPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"parametros" | "ia_reglamento" | "usuarios">("parametros");
  const [config, setConfig] = useState<ConfigData>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editUnidadId, setEditUnidadId] = useState("");

  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("inquilino");
  const [newUserUnidadId, setNewUserUnidadId] = useState("1");

  // Cargar configuración de Supabase
  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("configuracion_consorcio")
          .select("*")
          .eq("id", 1)
          .maybeSingle();

        if (data && !error) {
          setConfig({
            tasa_interes_mora: Number(data.tasa_interes_mora) || DEFAULT_CONFIG.tasa_interes_mora,
            comision_pasarela_mp: Number(data.comision_pasarela_mp) || DEFAULT_CONFIG.comision_pasarela_mp,
            monto_multa_limpieza: Number(data.monto_multa_limpieza) || DEFAULT_CONFIG.monto_multa_limpieza,
            umbral_consenso_porcentaje: Number(data.umbral_consenso_porcentaje) || DEFAULT_CONFIG.umbral_consenso_porcentaje,
            dias_vencimiento_expensas: Number(data.dias_vencimiento_expensas) || DEFAULT_CONFIG.dias_vencimiento_expensas,
          });
        } else {
          const localStored = localStorage.getItem("calle425_config");
          if (localStored) {
            setConfig(JSON.parse(localStored));
          }
        }
      } catch (err) {
        console.warn("Usando configuración por defecto:", err);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, [supabase]);

  // Guardar cambios
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from("configuracion_consorcio")
        .upsert({
          id: 1,
          tasa_interes_mora: config.tasa_interes_mora,
          comision_pasarela_mp: config.comision_pasarela_mp,
          monto_multa_limpieza: config.monto_multa_limpieza,
          umbral_consenso_porcentaje: config.umbral_consenso_porcentaje,
          dias_vencimiento_expensas: config.dias_vencimiento_expensas,
          updated_at: new Date().toISOString(),
        });

      localStorage.setItem("calle425_config", JSON.stringify(config));

      if (error) {
        setSuccessMsg("¡Parámetros guardados y sincronizados localmente con éxito!");
      } else {
        setSuccessMsg("¡Parámetros del Consorcio Calle 425 actualizados correctamente en Supabase!");
      }

      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg("Ocurrió un error al guardar los parámetros.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setSuccessMsg("Valores restablecidos a los valores por defecto. Guarde para confirmar.");
  };

  // Fetch Usuarios
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/usuarios');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error("Error fetching users", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "usuarios" && users.length === 0) {
      fetchUsers();
    }
  }, [activeTab]);

  const handleUpdateUser = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          email: editUserEmail || undefined,
          nombreCompleto: editUserName || undefined,
          rol: editRole || undefined,
          unidadId: editUnidadId || undefined,
          newPassword: newPassword || undefined
        })
      });
      if (res.ok) {
        setSuccessMsg("Usuario actualizado correctamente.");
        setEditingUserId(null);
        setNewPassword("");
        fetchUsers();
      } else {
        setErrorMsg("Error al actualizar el usuario.");
      }
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e) {
      setErrorMsg("Error de red al actualizar usuario.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserName || !newUserEmail) {
      setErrorMsg("Nombre y correo son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombreCompleto: newUserName,
          email: newUserEmail,
          rol: newUserRole,
          unidadId: newUserUnidadId
        })
      });
      if (res.ok) {
        setSuccessMsg("Usuario creado correctamente.");
        setIsCreatingUser(false);
        setNewUserName("");
        setNewUserEmail("");
        fetchUsers();
      } else {
        setErrorMsg("Error al crear el usuario.");
      }
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (e) {
      setErrorMsg("Error de red al crear usuario.");
    } finally {
      setSaving(false);
    }
  };

  // Cálculos dinámicos de simulación
  const moraEjemplo = (50000 * (config.tasa_interes_mora / 100)).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
  });
  const totalMoraEjemplo = (50000 * (1 + config.tasa_interes_mora / 100)).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
  });
  const comisionMpEjemplo = (500000 * (config.comision_pasarela_mp / 100)).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
  });
  const votosRequeridos = Math.ceil((9 * config.umbral_consenso_porcentaje) / 100);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Sidebar de Administración */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-6xl">
        {/* Header Stitch 09 */}
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Settings className="w-4 h-4" />
              <span>Consorcio Calle 425 • 9 UFs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Configuración & Base de Conocimiento IA
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Parámetros operacionales, tasas de mora, pasarela de pagos y reglas de convivencia para Gemini.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-900 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>
        </header>

        {/* Selector de Pestañas Stitch 09 */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("parametros")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "parametros"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Parámetros Operacionales</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ia_reglamento")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "ia_reglamento"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>Reglamento & Prompts de IA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("usuarios")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === "usuarios"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestión de Accesos & Claves</span>
          </button>
        </div>

        {/* Notificaciones */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {activeTab === "parametros" ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Tasa de Interés por Mora */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <Percent className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                          Interés por Mora
                        </h2>
                        <span className="text-[11px] text-slate-400">Recargo mensual por vencimiento</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold font-mono">
                      {config.tasa_interes_mora}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                    Porcentaje acumulativo aplicado sobre el saldo ordinario de las expensas no canceladas a término.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="0.5"
                      value={config.tasa_interes_mora}
                      onChange={(e) =>
                        setConfig({ ...config, tasa_interes_mora: parseFloat(e.target.value) || 0 })
                      }
                      className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    />
                    <div className="w-20 relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={config.tasa_interes_mora}
                        onChange={(e) =>
                          setConfig({ ...config, tasa_interes_mora: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full h-9 px-2 text-right pr-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-2 top-2.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* Simulador en vivo */}
                  <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300">
                    <div className="flex justify-between font-semibold">
                      <span>Simulación expensa $50.000:</span>
                      <span className="font-mono">+${moraEjemplo} mora</span>
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                      Total a pagar con mora: <strong className="font-mono">${totalMoraEjemplo}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Comisión Pasarela Mercado Pago */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                          Comisión Pasarela Mercado Pago
                        </h2>
                        <span className="text-[11px] text-slate-400">Deducción en rendición de cuentas</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-xs font-bold font-mono">
                      {config.comision_pasarela_mp}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                    Costo financiero de la pasarela para cobro digital automatizado de expensas del consorcio.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.05"
                      value={config.comision_pasarela_mp}
                      onChange={(e) =>
                        setConfig({ ...config, comision_pasarela_mp: parseFloat(e.target.value) || 0 })
                      }
                      className="flex-1 accent-sky-500 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    />
                    <div className="w-20 relative">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.05"
                        value={config.comision_pasarela_mp}
                        onChange={(e) =>
                          setConfig({ ...config, comision_pasarela_mp: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full h-9 px-2 text-right pr-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-2 top-2.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* Simulador en vivo */}
                  <div className="p-3 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-900/40 text-[11px] text-sky-900 dark:text-sky-300">
                    <div className="flex justify-between font-semibold">
                      <span>Para una cobranza de $500.000:</span>
                      <span className="font-mono">Retención: ${comisionMpEjemplo}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Multa por Limpieza Rotativa */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                          Multa por Limpieza Rotativa
                        </h2>
                        <span className="text-[11px] text-slate-400">Sanción por turno no cumplido</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold font-mono">
                      ${config.monto_multa_limpieza.toLocaleString("es-AR")}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                    Monto imputado como multa a la UF que incumpla su turno semanal y acreditado a la UF sustituta.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      min="1000"
                      max="100000"
                      step="1000"
                      value={config.monto_multa_limpieza}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          monto_multa_limpieza: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full h-10 pl-8 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-[11px] text-rose-900 dark:text-rose-300 flex items-center justify-between">
                    <span>Crédito automático para UF sustituta:</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      +${config.monto_multa_limpieza.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Umbral de Consenso para Presupuestos */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Vote className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                          Umbral de Consenso (Votaciones)
                        </h2>
                        <span className="text-[11px] text-slate-400">Rango legal: 30% a 40% de 9 UFs</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-bold font-mono">
                      {config.umbral_consenso_porcentaje}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                    Porcentaje mínimo de votos sobre las 9 UFs para que un presupuesto de proveedor se apruebe automáticamente.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="20"
                      max="60"
                      step="1"
                      value={config.umbral_consenso_porcentaje}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          umbral_consenso_porcentaje: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="flex-1 accent-indigo-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    />
                    <div className="w-20 relative">
                      <input
                        type="number"
                        min="10"
                        max="100"
                        step="0.5"
                        value={config.umbral_consenso_porcentaje}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            umbral_consenso_porcentaje: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full h-9 px-2 text-right pr-6 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                      />
                      <span className="absolute right-2 top-2.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>

                  {/* Simulador en vivo */}
                  <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center justify-between font-semibold">
                    <span>Votos requeridos para aprobación:</span>
                    <span className="font-mono bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400">
                      {votosRequeridos} de 9 UFs ({((votosRequeridos / 9) * 100).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Parámetro Adicional: Día de vencimiento */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Día de Vencimiento de Expensas Ordinarias
                  </h3>
                  <p className="text-xs text-slate-400">
                    Día del mes establecido como límite de pago voluntario antes de imputar intereses.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Día</span>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={config.dias_vencimiento_expensas}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      dias_vencimiento_expensas: parseInt(e.target.value) || 15,
                    })
                  }
                  className="w-16 h-10 px-3 text-center rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                />
                <span className="text-xs text-slate-500 font-medium">de cada mes</span>
              </div>
            </div>

            {/* Barra de Guardado */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Los cambios tienen efecto inmediato sobre las próximas liquidaciones y votaciones.</span>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Guardando parámetros...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Parámetros del Consorcio</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : activeTab === "ia_reglamento" ? (
          /* Pestaña: Base de Conocimiento IA y Reglamento */
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Base de Conocimiento de Convivencia (System Prompt)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Reglamento oficial cargado en Google Gemini para responder consultas a las 9 UFs.
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Gemini Activo</span>
              </span>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>1. Normas de Ruidos Molestos & Horarios de Descanso</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Horario de descanso obligatorio de <strong>22:00 a 08:00 hs</strong> los días de semana, y hasta las <strong>10:00 hs</strong> sábados, domingos y feriados. Obras ruidosas permitidas de 08:00 a 17:00 hs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>2. Tenencia Responsable de Mascotas (DeveloPet Friendly)</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Se permite un máximo de 2 mascotas por UF. En espacios comunes (palieres, hall, ascensor) deben circular con correa obligatoria.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>3. Recolección de Residuos & Limpieza Rotativa</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Disposición de residuos de <strong>19:00 a 20:30 hs</strong> en bolsas herméticas. Las 9 UFs cumplen guardias rotativas semanales; el incumplimiento genera multa de $24.000 a favor de la UF sustituta.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sky-500" />
                  <span>4. Mudanzas & Derivación a Mesa de Ayuda</span>
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  Las mudanzas deben coordinarse con 48 hs de anticipación. Para cualquier incidente no tipificado, la IA instruye al vecino abrir un ticket en la Mesa de Ayuda ITIL.
                </p>
              </div>
            </div>
          </div>
        ) : activeTab === "usuarios" ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Administración de Claves y Roles</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gestiona accesos para Administrador, Propietarios e Inquilinos.</p>
                  </div>
                </div>
                <button onClick={() => setIsCreatingUser(!isCreatingUser)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center shadow-sm">
                  <span className="text-lg mr-1 leading-none">+</span> Agregar Usuario
                </button>
              </div>
              <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="p-4 font-bold">Usuario</th>
                      <th className="p-4 font-bold">Rol</th>
                      <th className="p-4 font-bold">Unidad</th>
                      <th className="p-4 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {isCreatingUser && (
                      <tr className="bg-indigo-50/50 dark:bg-indigo-900/10">
                        <td className="p-4 space-y-2">
                          <input type="text" placeholder="Nombre Completo" autoComplete="off" className="w-full p-2 bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                          <input type="email" placeholder="Correo (Login)" autoComplete="off" className="w-full p-2 bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
                        </td>
                        <td className="p-4 align-top">
                          <select className="w-full p-2 bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                            <option value="propietario">Propietario</option>
                            <option value="inquilino">Inquilino</option>
                            <option value="vecino">Vecino</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </td>
                        <td className="p-4 align-top">
                          <select className="w-full p-2 bg-white dark:bg-slate-950 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" value={newUserUnidadId} onChange={e => setNewUserUnidadId(e.target.value)}>
                            <option value="0">Sin Unidad (Admin)</option>
                            {[1,2,3,4,5,6,7,8,9].map(num => (
                              <option key={num} value={num}>UF {num}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4 align-top text-right space-x-2">
                          <button onClick={handleCreateUser} disabled={saving} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold transition">
                            {saving ? "..." : "Crear"}
                          </button>
                          <button onClick={() => setIsCreatingUser(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition">
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    )}
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                          Cargando usuarios...
                        </td>
                      </tr>
                    ) : users.map(u => (
                      <tr key={u.id} className="text-sm bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="p-4 font-medium text-slate-900 dark:text-white">
                          {editingUserId === u.id ? (
                            <div className="space-y-2">
                              <input type="text" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" value={editUserName} onChange={e => setEditUserName(e.target.value)} />
                              <input type="email" className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} />
                            </div>
                          ) : (
                            <>
                              {u.username}
                              <div className="text-xs text-slate-400 font-normal mt-0.5">{u.email}</div>
                            </>
                          )}
                        </td>
                        <td className="p-4">
                          {editingUserId === u.id ? (
                            <select 
                              className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                            >
                              <option value="vecino">Vecino (Heredado)</option>
                              <option value="propietario">Propietario</option>
                              <option value="inquilino">Inquilino</option>
                              <option value="admin">Administrador</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              u.rol === 'admin' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                              u.rol === 'propietario' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                              u.rol === 'inquilino' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {u.rol.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400">
                          {editingUserId === u.id ? (
                            <select className="w-full p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500" value={editUnidadId} onChange={e => setEditUnidadId(e.target.value)}>
                              <option value="0">Sin Unidad</option>
                              {[1,2,3,4,5,6,7,8,9].map(num => (
                                <option key={num} value={num}>UF {num}</option>
                              ))}
                            </select>
                          ) : u.unidadInfo}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {editingUserId === u.id ? (
                            <div className="flex items-center justify-end gap-2 mt-2">
                              <input 
                                type="password" 
                                placeholder="Nueva clave (Opcional)"
                                autoComplete="new-password"
                                className="w-32 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />
                              <button onClick={() => handleUpdateUser(u.id)} disabled={saving} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center">
                                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />} Guardar
                              </button>
                              <button onClick={() => setEditingUserId(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition">
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => { 
                              setEditingUserId(u.id); 
                              setEditUserName(u.username);
                              setEditUserEmail(u.email);
                              setEditRole(u.rol);
                              setEditUnidadId(u.unidadInfo === 'Sin Unidad' ? '0' : u.unidadInfo.match(/\d+/)?.[0] || '1');
                            }} className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition flex items-center ml-auto">
                              <Settings className="w-3 h-3 mr-1.5 text-indigo-500" />
                              Gestionar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
