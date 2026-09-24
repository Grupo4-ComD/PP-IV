"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bot,
  Sparkles,
  Droplets,
  CalendarCheck,
  ArrowRight,
  ArrowLeftRight,
  LifeBuoy,
  Vote,
  CheckCircle2,
  Clock,
  ListTodo,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import EstadoCuentaCard, { ExpensaData, UnidadData } from "@/components/vecino/EstadoCuentaCard";
import VecinoSidebar from "@/components/vecino/VecinoSidebar";

export default function VecinoDashboardPage() {
  const supabase = createClient();

  const [unidad, setUnidad] = useState<UnidadData>({
    id: 3,
    numero_uf: 3,
    piso_depto: "1° B",
    propietario_nombre: "Martínez, Laura",
    email: "laura.martinez@calle425.com",
  });

  const [expensa, setExpensa] = useState<ExpensaData>({
    id: 101,
    unidad_id: 3,
    periodo_mes: 9,
    periodo_anio: 2026,
    monto_ordinario: 48500,
    recargo_mora: 3395,
    total_pagar: 51895,
    fecha_vencimiento: "2026-09-10",
    estado: "pendiente",
    comprobante_url: null,
  });

  // Checklist interactivo de limpieza
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Barrer palier y tramo de escalera del piso", done: true, time: "Ayer 18:20 hs" },
    { id: 2, text: "Mopa con desinfectante y secado de pisos", done: false, detail: "Insumos en el armario de PB" },
    { id: 3, text: "Verificar luminarias LED de emergencia", done: false, detail: "Probar botón de test lumínico" },
  ]);

  const toggleTask = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  useEffect(() => {
    async function loadData() {
      try {
        // Temporalmente hardcodeamos unidadId=7 (Guillermo Sciulli) hasta que hagamos el Login Real (Fase 2.3)
        // Luego leeremos esto directo de la sesión JWT
        const res = await fetch("/api/vecino/dashboard?unidadId=7");
        if (res.ok) {
          const data = await res.json();
          setUnidad(data.unidad);
          setExpensa(data.expensa);
        }
      } catch (err) {
        console.warn("Error cargando panel del vecino:", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-300">
      {/* SIDEBAR REUTILIZABLE CON ICONOS MODERNOS */}
      <VecinoSidebar unidad={unidad} />

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
                Portal de Autogestión Residencial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/vecino/mesa-ayuda"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40 text-xs font-semibold hover:bg-indigo-100 transition"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Consultar IA (Gemini)</span>
            </Link>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800 text-xs">
              <div className="text-right hidden md:block">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {unidad.propietario_nombre}
                </span>
                <span className="text-[11px] text-slate-400">
                  UF 0{unidad.numero_uf}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                {unidad.propietario_nombre.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD BODY */}
        <main className="p-6 sm:p-8 space-y-8 max-w-6xl w-full mx-auto">
          {/* Saludo y bienvenida */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Hola, {unidad.propietario_nombre.split(",")[0]}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Bienvenido al panel del Consorcio Calle 425. Aquí tiene el control integral de su unidad.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 shadow-xs self-start sm:self-auto">
              <Droplets className="w-3.5 h-3.5 text-sky-500" />
              <span>Tanque de Agua: <strong>Limpio (12/08)</strong></span>
            </div>
          </div>

          {/* 1. COMPONENTE ESTADO DE CUENTA Y EXPENSAS */}
          <section>
            <EstadoCuentaCard
              expensaInicial={expensa}
              unidadInicial={unidad}
            />
          </section>

          {/* 2. CRONOGRAMA DE LIMPIEZA & CHECKLIST */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
            {/* Banner de semana activa */}
            <div className="w-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    Semana de Limpieza Asignada
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Del 22 al 28 de Septiembre • Tu Unidad (UF 0{unidad.numero_uf})
                  </h3>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 text-xs font-semibold shadow-xs border border-amber-200 dark:border-amber-800/50">
                <Clock className="w-3.5 h-3.5" />
                En progreso (3 días restantes)
              </span>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Checklist interactivo de guardia</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  (Reglamento Interno Art. 9)
                </span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Marque las tareas a medida que las complete para registrar su cumplimiento ante el consorcio.
              </p>
            </div>

            <div className="space-y-2.5 mb-6">
              {checklist.map((item) => (
                <label
                  key={item.id}
                  onClick={() => toggleTask(item.id)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${
                    item.done
                      ? "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-80"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-xs font-semibold ${
                        item.done
                          ? "line-through text-slate-400 dark:text-slate-500"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {item.text}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {item.time ? `✓ ${item.time}` : item.detail}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                href="/vecino/limpieza"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
              >
                <span>Ver Calendario Anual de Guardias</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/vecino/limpieza"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Solicitar Permuta de Turno</span>
              </Link>
            </div>
          </section>

          {/* 3. ACCESOS DIRECTOS A MESA ITIL Y ASAMBLEA */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mesa de Ayuda ITIL */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <LifeBuoy className="w-4 h-4" />
                  <span>Mesa de Ayuda ITIL</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reportar Incidencia o Falla
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Cree tickets con seguimiento formal de SLA para plomería, electricidad, cerraduras o espacios comunes.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-slate-400">1 Ticket en curso</span>
                <Link
                  href="/vecino/mesa-ayuda"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold transition"
                >
                  <span>Abrir Ticket</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Votaciones y Asambleas */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Vote className="w-4 h-4" />
                  <span>Democracia Consorcial</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Votación de Presupuestos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Emita su voto ponderado para la aprobación de reparaciones y presupuestos extraordinarios.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-emerald-600 font-semibold">1 Votación Activa</span>
                <Link
                  href="/vecino/votaciones"
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-semibold transition"
                >
                  <span>Votar Ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
