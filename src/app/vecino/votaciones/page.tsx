"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Vote,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Check,
  Users,
  Award,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ProgressBarConsenso from "@/components/vecino/ProgressBarConsenso";
import VecinoSidebar from "@/components/vecino/VecinoSidebar";

interface PresupuestoItem {
  id: number;
  ticket_id: number;
  ticket_titulo: string;
  proveedor_nombre: string;
  contacto: string;
  monto_total: number;
  detalle: string;
  tiempo_ejecucion: string;
  garantia: string;
  pdf_url: string;
  votos_favor: number;
  votos_ufs: number[]; // UFs que votaron por esta propuesta
  estado: "en_votacion" | "aprobado" | "rechazado";
}

interface TemaVotacion {
  id: number;
  ticket_code: string;
  titulo: string;
  descripcion: string;
  fecha_cierre: string;
  dias_restantes: number;
  presupuestos: PresupuestoItem[];
}

export default function VotacionesPage() {
  const supabase = createClient();

  const miUnidad = {
    id: 7,
    numero_uf: 7,
    piso_depto: "3° B",
    propietario_nombre: "Sciulli, Guillermo",
  };

  // Temas de votación activos
  const [temas, setTemas] = useState<TemaVotacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemas() {
      try {
        const res = await fetch("/api/vecino/votaciones");
        if (res.ok) {
          const data = await res.json();
          setTemas(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTemas();
  }, []);

  const [feedbackVote, setFeedbackVote] = useState<{
    temaId: number;
    mensaje: string;
  } | null>(null);

  // Manejador interactivo de voto
  const handleVotar = async (temaId: number, presupuestoId: number) => {
    try {
      // 1. Registrar voto en Prisma a traves de la API
      const res = await fetch("/api/vecino/votaciones/votar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ presupuestoId, unidadId: miUnidad.id })
      });

      if (!res.ok) {
        console.warn("Error en la API al votar");
      }

      // 2. Actualización dinámica en el estado
      setTemas((prevTemas) =>
        prevTemas.map((tema) => {
          if (tema.id !== temaId) return tema;

          const updatedPresupuestos = tema.presupuestos.map((p) => {
            const yaVotoAca = p.votos_ufs.includes(miUnidad.numero_uf);

            // Si es el presupuesto votado
            if (p.id === presupuestoId) {
              if (yaVotoAca) {
                // Quitar voto (toggle)
                const nuevosVotosUfs = p.votos_ufs.filter((uf) => uf !== miUnidad.numero_uf);
                const nuevoTotal = nuevosVotosUfs.length;
                return {
                  ...p,
                  votos_favor: nuevoTotal,
                  votos_ufs: nuevosVotosUfs,
                  estado: (nuevoTotal >= 3 ? "aprobado" : "en_votacion") as any,
                };
              } else {
                // Agregar voto
                const nuevosVotosUfs = [...p.votos_ufs, miUnidad.numero_uf];
                const nuevoTotal = nuevosVotosUfs.length;
                return {
                  ...p,
                  votos_favor: nuevoTotal,
                  votos_ufs: nuevosVotosUfs,
                  estado: (nuevoTotal >= 3 ? "aprobado" : "en_votacion") as any,
                };
              }
            } else {
              // Si había votado en otra opción del mismo tema, retirar el voto anterior
              if (yaVotoAca) {
                const nuevosVotosUfs = p.votos_ufs.filter((uf) => uf !== miUnidad.numero_uf);
                const nuevoTotal = nuevosVotosUfs.length;
                return {
                  ...p,
                  votos_favor: nuevoTotal,
                  votos_ufs: nuevosVotosUfs,
                  estado: (nuevoTotal >= 3 ? "aprobado" : "en_votacion") as any,
                };
              }
              return p;
            }
          });

          return {
            ...tema,
            presupuestos: updatedPresupuestos,
          };
        })
      );

      const presupuestoElegido = temas
        .find((t) => t.id === temaId)
        ?.presupuestos.find((p) => p.id === presupuestoId);

      setFeedbackVote({
        temaId,
        mensaje: `✓ Voto de la UF 0${miUnidad.numero_uf} registrado correctamente para "${presupuestoElegido?.proveedor_nombre}".`,
      });

      setTimeout(() => setFeedbackVote(null), 4000);
    } catch (err) {
      console.error("Error al registrar el voto:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* SIDEBAR REUTILIZABLE CON ICONOS MODERNOS */}
      <VecinoSidebar unidad={miUnidad} />

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
                Calle 425 • Asamblea & Votaciones Virtuales
              </h1>
              <p className="text-[11px] text-slate-400">
                Democracia Consorcial Digital y Aprobación de Presupuestos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200">
              ● {temas.length} Votaciones Activas
            </span>
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="p-6 sm:p-8 space-y-10 max-w-6xl w-full mx-auto">
          {/* Header de Sección */}
          <section>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-200/60 dark:border-indigo-800/40">
              <Vote className="w-3.5 h-3.5" />
              <span>Sistema de Consenso Ponderado (9 UFs)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Votación de Presupuestos de Proveedores
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Compare las cotizaciones homologadas recibidas por la administración para cada incidente edilicio. Conforme al reglamento, al alcanzar entre el <strong>30% y 40% de consenso (3 votos)</strong>, el presupuesto queda automáticamente <strong>Aprobado para Ejecución</strong>.
            </p>
          </section>

          {/* TEMAS DE VOTACIÓN */}
          <div className="space-y-10">
            {loading ? (
              <div className="text-center py-10 text-slate-500">Cargando votaciones...</div>
            ) : temas.length === 0 ? (
              <div className="text-center py-10 text-slate-500">No hay votaciones activas en este momento.</div>
            ) : temas.map((tema) => (
              <section
                key={tema.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* Cabecera del Tema */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="font-bold text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {tema.ticket_code}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Votación Abierta</span>
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Cierra en {tema.dias_restantes} días ({tema.fecha_cierre})</span>
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {tema.titulo}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {tema.descripcion}
                    </p>
                  </div>
                </div>

                {/* Mensaje de Feedback */}
                {feedbackVote && feedbackVote.temaId === tema.id && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{feedbackVote.mensaje}</span>
                  </div>
                )}

                {/* Grid Comparativo de Presupuestos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {tema.presupuestos.map((p) => {
                    const votoEmitidoAca = p.votos_ufs.includes(miUnidad.numero_uf);
                    const esAprobado = p.votos_favor >= 3 || p.estado === "aprobado";

                    return (
                      <div
                        key={p.id}
                        className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                          esAprobado
                            ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/20 shadow-md"
                            : votoEmitidoAca
                            ? "bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-400 dark:border-indigo-600 shadow-sm"
                            : "bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 shadow-xs"
                        }`}
                      >
                        <div className="space-y-4">
                          {/* Badge de Estado del Presupuesto */}
                          <div className="flex items-center justify-between">
                            {esAprobado ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold border border-emerald-300 dark:border-emerald-700 shadow-xs">
                                <Award className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                                <span>Aprobado para Ejecución</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200">
                                <Clock className="w-3.5 h-3.5" />
                                <span>En Votación</span>
                              </span>
                            )}

                            {votoEmitidoAca && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                                <Check className="w-3 h-3" />
                                <span>Tu Voto (UF 03)</span>
                              </span>
                            )}
                          </div>

                          {/* Proveedor y Monto */}
                          <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white">
                              {p.proveedor_nombre}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{p.contacto}</p>
                            <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                              ${p.monto_total.toLocaleString("es-AR")}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Monto total imputado • ${Math.round(p.monto_total / 9).toLocaleString("es-AR")} por UF
                            </span>
                          </div>

                          {/* Detalle técnico */}
                          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                            <p>{p.detalle}</p>
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>Plazo: {p.tiempo_ejecucion}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                <span>Garantía: {p.garantia}</span>
                              </span>
                            </div>
                          </div>

                          {/* Enlace al PDF adjunto */}
                          <div className="pt-1">
                            <a
                              href={p.pdf_url}
                              onClick={(e) => {
                                e.preventDefault();
                                alert(`Descargando presupuesto formal en PDF de "${p.proveedor_nombre}"...`);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Ver Presupuesto Formal (PDF)</span>
                            </a>
                          </div>

                          {/* Componente Barra de Consenso */}
                          <div className="pt-2">
                            <ProgressBarConsenso
                              votosFavor={p.votos_favor}
                              totalUfs={9}
                              umbralMinimo={3}
                            />
                          </div>

                          {/* UFs que votaron */}
                          {p.votos_ufs.length > 0 && (
                            <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1 flex-wrap">
                              <Users className="w-3 h-3" />
                              <span>Votado por:</span>
                              {p.votos_ufs.map((uf) => (
                                <span
                                  key={uf}
                                  className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]"
                                >
                                  UF 0{uf}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Botón de Votar */}
                        <div className="pt-5 mt-4 border-t border-slate-200/80 dark:border-slate-800">
                          <button
                            onClick={() => handleVotar(tema.id, p.id)}
                            className={`w-full py-2.5 rounded-xl font-semibold text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
                              votoEmitidoAca
                                ? "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-rose-100 hover:text-rose-700 border border-indigo-200 dark:border-indigo-800"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25"
                            }`}
                          >
                            {votoEmitidoAca ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Vote className="w-4 h-4" />
                            )}
                            <span>
                              {votoEmitidoAca
                                ? "Voto Registrado (Clic para retirar)"
                                : "Votar este Presupuesto"}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
