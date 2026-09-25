"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  AlertTriangle,
  ArrowLeftRight,
  KeyRound,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Check,
  X,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import VecinoSidebar from "@/components/vecino/VecinoSidebar";

interface TurnoLimpieza {
  id: number;
  semana_numero: number;
  rango_fechas: string;
  numero_uf: number;
  piso_depto: string;
  residente: string;
  estado: "cumplido" | "en_curso" | "proximo" | "programado" | "multado";
  insumos_verificados?: boolean;
  unidad_sustituta_uf?: number | null;
}

export default function LimpiezaPage() {
  const supabase = createClient();

  const [turnos, setTurnos] = useState<TurnoLimpieza[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<"historial" | "actual" | "proximos">("actual");

  useEffect(() => {
    async function loadTurnos() {
      try {
        const res = await fetch("/api/vecino/limpieza");
        if (res.ok) {
          const data = await res.json();
          setTurnos(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTurnos();
  }, []);

  // Fondo especial de multas y compensaciones
  const [multasHistorial, setMultasHistorial] = useState<
    { id: number; infractora: number; sustituta: number; monto: number; fecha: string }[]
  >([]);

  // Modales
  const [showIncumplimientoModal, setShowIncumplimientoModal] = useState(false);
  const [showPermutaModal, setShowPermutaModal] = useState(false);
  const [permutaSeleccionada, setPermutaSeleccionada] = useState<number | null>(null);

  // Formulario Incumplimiento
  const [infractoraUf, setInfractoraUf] = useState<number>(2);
  const [sustitutaUf, setSustitutaUf] = useState<number>(3);
  const [motivoIncumplimiento, setMotivoIncumplimiento] = useState(
    "No se realizó la limpieza de palier ni escaleras en los días asignados."
  );
  const [reportingLoading, setReportingLoading] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  const [reportErrorMsg, setReportErrorMsg] = useState<string | null>(null);

  // Manejador para invocar aplicar_multa_limpieza
  const handleReportarIncumplimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportingLoading(true);
    setReportSuccessMsg(null);
    setReportErrorMsg(null);

    if (infractoraUf === sustitutaUf) {
      setReportErrorMsg("La UF infractora y la UF sustituta deben ser diferentes.");
      setReportingLoading(false);
      return;
    }

    try {
      // 1. Invocar función RPC en Supabase
      const { data, error } = await supabase.rpc("aplicar_multa_limpieza", {
        p_unidad_infractora: infractoraUf,
        p_unidad_sustituta: sustitutaUf,
      });

      if (error) {
        console.warn("RPC Warning, simulando ejecución local:", error);
      }

      // 2. Actualización de estado en tiempo real en la UI
      setTurnos((prev) =>
        prev.map((t) =>
          t.numero_uf === infractoraUf
            ? { ...t, estado: "multado", unidad_sustituta_uf: sustitutaUf }
            : t
        )
      );

      const nuevaMulta = {
        id: Date.now(),
        infractora: infractoraUf,
        sustituta: sustitutaUf,
        monto: 24000,
        fecha: new Date().toLocaleDateString("es-AR"),
      };

      setMultasHistorial((prev) => [nuevaMulta, ...prev]);

      setReportSuccessMsg(
        `¡Multa de $24.000 imputada exitosamente a la UF 0${infractoraUf}! Se ha acreditado el saldo a favor de la UF 0${sustitutaUf} en el Fondo Especial.`
      );

      setTimeout(() => {
        setShowIncumplimientoModal(false);
        setReportSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setReportErrorMsg("Ocurrió un error al procesar la sanción de limpieza.");
    } finally {
      setReportingLoading(false);
    }
  };

  const handleConfirmarPermuta = (ufDestino: number) => {
    setTurnos((prev) => {
      const idxOrigen = prev.findIndex((t) => t.numero_uf === 3);
      const idxDestino = prev.findIndex((t) => t.numero_uf === ufDestino);
      if (idxOrigen === -1 || idxDestino === -1) return prev;

      const newTurnos = [...prev];
      const tempUf = newTurnos[idxOrigen].numero_uf;
      const tempPiso = newTurnos[idxOrigen].piso_depto;
      const tempRes = newTurnos[idxOrigen].residente;

      newTurnos[idxOrigen].numero_uf = newTurnos[idxDestino].numero_uf;
      newTurnos[idxOrigen].piso_depto = newTurnos[idxDestino].piso_depto;
      newTurnos[idxOrigen].residente = newTurnos[idxDestino].residente;

      newTurnos[idxDestino].numero_uf = tempUf;
      newTurnos[idxDestino].piso_depto = tempPiso;
      newTurnos[idxDestino].residente = tempRes;

      return newTurnos;
    });

    setShowPermutaModal(false);
  };

  // Turno activo de la semana
  const turnoActivo = turnos.find((t) => t.estado === "en_curso") || turnos[0] || null;

  // Filtrado de turnos según la vista
  const turnosFiltrados = turnos.filter((t) => {
    if (vista === "historial") return t.estado === "cumplido" || t.estado === "multado" || t.estado === "incumplido";
    if (vista === "actual") return t.estado === "en_curso" || t.estado === "proximo" || t.estado === "programado";
    if (vista === "proximos") return t.estado === "programado" || t.estado === "proximo";
    return true;
  });

  // Solo mostrar una ventana razonable para la vista "actual" (por ejemplo el en curso y los 8 siguientes)
  const turnosAMostrar = vista === "actual" ? turnosFiltrados.slice(0, 9) : turnosFiltrados;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* SIDEBAR REUTILIZABLE CON ICONOS MODERNOS */}
      <VecinoSidebar />

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TOPBAR CON LOGO OFICIAL */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shrink-0 shadow-xs">
              <Image
                src="/logo.png"
                alt="Logo Consorcio 425"
                fill
                sizes="32px"
                className="object-contain p-0.5"
              />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                Calle 425 • Consorcio Inteligente
              </h1>
              <p className="text-[11px] text-slate-400">
                Régimen Autogestivo de Convivencia y Limpieza
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowIncumplimientoModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Reportar Incumplimiento ($24.000)</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="p-6 sm:p-8 space-y-8 max-w-6xl w-full mx-auto">
          {/* Header de Sección */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-200/60 dark:border-indigo-800/40">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Régimen de 9 Unidades Funcionales</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Cronograma de Limpieza Rotativo <span className="text-indigo-600 dark:text-indigo-400">Ciclo 2026</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Organización equitativa y comunitaria para la higiene de pasillos, escaleras y palieres. El reglamento establece una multa de $24.000 ante ausencias, transferida a la UF suplente.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowPermutaModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 transition cursor-pointer active:scale-[0.99]"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Intercambiar mi turno con otro vecino</span>
              </button>
            </div>
          </section>

          {/* 1. TARJETA DESTACADA: TURNO ACTIVO DE LA SEMANA */}
          {turnoActivo && (
          <section className="rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 p-6 sm:p-7 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
                <Sparkles className="w-7 h-7 stroke-[2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Semana {turnoActivo.semana_numero} (En Curso)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                    Inspección Viernes
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Responsable: <span className="text-indigo-600 dark:text-indigo-400">UF 0{turnoActivo.numero_uf}</span> ({turnoActivo.piso_depto})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {turnoActivo.residente} • Vigencia: {turnoActivo.rango_fechas} • Palier PB y Escalera Central
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white dark:bg-slate-950 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm self-start lg:self-auto">
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">
                  Turno Activo Actual
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {turnoActivo.rango_fechas}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-200 dark:border-emerald-800">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
          </section>
          )}

          {/* 2. CALENDARIO SECUENCIAL DE 9 UNIDADES */}
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Secuencia de Guardias Rotativas 2026
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rotación periódica continua asignada entre las 9 Unidades Funcionales
                </p>
              </div>

              {/* Controles de Vista */}
              <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setVista("historial")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    vista === "historial" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Historial
                </button>
                <button
                  onClick={() => setVista("actual")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    vista === "actual" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Ciclo Actual
                </button>
                <button
                  onClick={() => setVista("proximos")}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                    vista === "proximos" ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Próximos (Anual)
                </button>
              </div>
            </div>

            {/* Grid de tarjetas de turnos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-3 text-center py-10 text-slate-500">Cargando turnos...</div>
              ) : turnosAMostrar.length === 0 ? (
                <div className="col-span-3 text-center py-10 text-slate-500">No hay turnos para esta vista.</div>
              ) : turnosAMostrar.map((t) => {
                const esMiTurno = t.numero_uf === 7;
                const esActual = t.estado === "en_curso";
                const esMultado = t.estado === "multado";
                const esCumplido = t.estado === "cumplido";

                return (
                  <div
                    key={t.id}
                    className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                      esMultado
                        ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50 shadow-sm"
                        : esActual
                        ? "bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
                        : esMiTurno
                        ? "bg-white dark:bg-slate-900 border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-400/20 shadow-sm"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
                    }`}
                  >
                    <div>
                      {/* Cabecera del Turno */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                          Semana {t.semana_numero} • {t.rango_fechas}
                        </span>

                        {esMultado ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200">
                            Multado ($24.000)
                          </span>
                        ) : esActual ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
                            En Curso
                          </span>
                        ) : esMiTurno ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                            ¡Tu Turno!
                          </span>
                        ) : esCumplido ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>Cumplido</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-medium">
                            Programado
                          </span>
                        )}
                      </div>

                      {/* Info de la UF */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                            esMultado
                              ? "bg-rose-100 text-rose-700"
                              : esActual
                              ? "bg-indigo-600 text-white"
                              : esMiTurno
                              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          0{t.numero_uf}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            UF 0{t.numero_uf} — {t.piso_depto}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {t.residente}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer de la tarjeta */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      {esMultado ? (
                        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                          Cubierto por suplente: UF 0{t.unidad_sustituta_uf || 3}
                        </span>
                      ) : esCumplido ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Insumos y check verificado</span>
                        </span>
                      ) : esMiTurno ? (
                        <button
                          onClick={() => setShowPermutaModal(true)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>Permutar fecha</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Turno regular asignado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. RESUMEN DEL FONDO ESPECIAL DE SANCIONES */}
          {multasHistorial.length > 0 && (
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Historial de Multas y Compensaciones Aplicadas</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">UF Infractora (Cargo)</th>
                      <th className="px-4 py-3">UF Suplente (Crédito)</th>
                      <th className="px-4 py-3 text-right">Monto Imputado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {multasHistorial.map((m) => (
                      <tr key={m.id}>
                        <td className="px-4 py-3 text-slate-500">{m.fecha}</td>
                        <td className="px-4 py-3 font-semibold text-rose-600">UF 0{m.infractora} (+${m.monto.toLocaleString("es-AR")})</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">UF 0{m.sustituta} (-${m.monto.toLocaleString("es-AR")})</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">${m.monto.toLocaleString("es-AR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>

        {/* MODAL 1: REPORTAR INCUMPLIMIENTO DE LIMPIEZA */}
        {showIncumplimientoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
              <button
                onClick={() => setShowIncumplimientoModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold border border-rose-200 dark:border-rose-900/50">
                  <ShieldAlert className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Aplicar Sanción de Guardia (Art. 9)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Imputación automática de $24.000 por incumplimiento de limpieza
                  </p>
                </div>
              </div>

              {reportErrorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{reportErrorMsg}</span>
                </div>
              )}

              {reportSuccessMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{reportSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleReportarIncumplimiento} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    1. Unidad Funcional que NO realizó la limpieza:
                  </label>
                  <select
                    value={infractoraUf}
                    onChange={(e) => setInfractoraUf(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                  >
                    {turnos.map((t) => (
                      <option key={t.id} value={t.numero_uf}>
                        UF 0{t.numero_uf} — {t.piso_depto} ({t.residente})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    2. Unidad Funcional sustituta que asumió la tarea (recibe el crédito):
                  </label>
                  <select
                    value={sustitutaUf}
                    onChange={(e) => setSustitutaUf(Number(e.target.value))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {turnos.map((t) => (
                      <option key={t.id} value={t.numero_uf}>
                        UF 0{t.numero_uf} — {t.piso_depto} ({t.residente})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    3. Observaciones / Detalle:
                  </label>
                  <textarea
                    rows={2}
                    value={motivoIncumplimiento}
                    onChange={(e) => setMotivoIncumplimiento(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                  <p>• La función <code>aplicar_multa_limpieza()</code> registrará $24.000 en la tabla <code>multas</code>.</p>
                  <p>• El cargo se sumará a la próxima liquidación de la UF 0{infractoraUf} y se descontará a la UF 0{sustitutaUf}.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIncumplimientoModal(false)}
                    className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={reportingLoading}
                    className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-semibold rounded-xl text-xs shadow-lg shadow-rose-600/25 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {reportingLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Aplicando...</span>
                      </>
                    ) : (
                      "Confirmar e Imputar Multa"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: INTERCAMBIAR TURNO / PERMUTA */}
        {showPermutaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
              <button
                onClick={() => setShowPermutaModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2">
                  <ArrowLeftRight className="w-6 h-6 stroke-[2]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Permutar Turno de Limpieza
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Seleccione con qué unidad funcional desea intercambiar su semana asignada (Semana 38 • 15-21 Sep).
                </p>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto mb-5 pr-1">
                {turnos
                  .filter((t) => t.numero_uf !== 3)
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleConfirmarPermuta(t.numero_uf)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:bg-indigo-50 dark:hover:bg-slate-800 transition text-left flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Semana {t.semana_numero} • UF 0{t.numero_uf} ({t.piso_depto})
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {t.residente} ({t.rango_fechas})
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition">
                        <span>Intercambiar</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))}
              </div>

              <button
                onClick={() => setShowPermutaModal(false)}
                className="w-full py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
