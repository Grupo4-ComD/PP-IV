"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  User,
  ArrowLeftRight,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Filter,
  X,
} from "lucide-react";

export interface TurnoLimpieza {
  id: number;
  semana_numero: number;
  rango_fechas: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  numero_uf: number;
  piso_depto: string;
  residente: string;
  estado: "cumplido" | "en_curso" | "proximo" | "programado" | "multado" | "incumplido";
  insumos_verificados?: boolean;
  unidad_sustituta_uf?: number | null;
  solicitud_permuta_uf?: number | null;
  estado_permuta?: string | null;
}

interface CalendarioLimpiezaProps {
  turnos: TurnoLimpieza[];
  miNumeroUf: number;
  onPedirPermuta?: (turno: TurnoLimpieza) => void;
  onReportarIncumplimiento?: (turno: TurnoLimpieza) => void;
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function CalendarioLimpieza({
  turnos,
  miNumeroUf,
  onPedirPermuta,
  onReportarIncumplimiento,
}: CalendarioLimpiezaProps) {
  // Inicializar en el mes con más turnos o el mes actual (Octubre 2026 por defecto)
  const [currentDate, setCurrentDate] = useState(() => {
    // Si hay un turno activo 'en_curso', centrar en ese mes
    const activo = turnos.find((t) => t.estado === "en_curso" && t.fecha_inicio);
    if (activo && activo.fecha_inicio) {
      return new Date(activo.fecha_inicio + "T00:00:00");
    }
    return new Date(2026, 9, 1); // Octubre 2026
  });

  const [selectedTurno, setSelectedTurno] = useState<TurnoLimpieza | null>(null);
  const [soloMisTurnos, setSoloMisTurnos] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Parsear turnos con rango Date para comparación rápida
  const parsedTurnos = useMemo(() => {
    return turnos.map((t) => {
      let start: Date;
      let end: Date;

      if (t.fecha_inicio && t.fecha_fin) {
        start = new Date(t.fecha_inicio + "T00:00:00");
        end = new Date(t.fecha_fin + "T23:59:59");
      } else {
        // Fallback aproximado si no vinieran fechas ISO
        start = new Date(2026, 8, 7 + (t.semana_numero - 37) * 7);
        end = new Date(start.getTime() + 6 * 24 * 3600 * 1000);
      }

      return {
        ...t,
        startDate: start,
        endDate: end,
      };
    });
  }, [turnos]);

  // Generar la matriz de días para el mes actual
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Ajustar primer día de la semana (0=Dom -> queremos 0=Lun, 6=Dom)
    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const cells: {
      date: Date;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      turno: (typeof parsedTurnos)[0] | null;
    }[] = [];

    // Días del mes previo
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const turno = parsedTurnos.find((t) => date >= t.startDate && date <= t.endDate) || null;
      cells.push({
        date,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        turno,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const turno = parsedTurnos.find((t) => date >= t.startDate && date <= t.endDate) || null;
      cells.push({
        date,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: isSameDay(date, new Date()),
        turno,
      });
    }

    // Días del mes siguiente para completar la cuadrícula (múltiplo de 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let next = 1; next <= remaining; next++) {
      const date = new Date(year, month + 1, next);
      const turno = parsedTurnos.find((t) => date >= t.startDate && date <= t.endDate) || null;
      cells.push({
        date,
        dayNumber: next,
        isCurrentMonth: false,
        isToday: isSameDay(date, new Date()),
        turno,
      });
    }

    return cells;
  }, [year, month, parsedTurnos]);

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToday = () => {
    // Si estamos en 2026, ir a Octubre 2026 o fecha actual
    const now = new Date();
    if (now.getFullYear() === 2026) {
      setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    } else {
      setCurrentDate(new Date(2026, 9, 1)); // Octubre 2026
    }
  };

  // Color Helper según el estado del turno
  const getBadgeStyle = (turno: TurnoLimpieza) => {
    const esMiTurno = turno.numero_uf === miNumeroUf;

    switch (turno.estado) {
      case "en_curso":
        return {
          bg: "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30",
          border: "border-indigo-500",
          dot: "bg-white animate-pulse",
          label: "En Curso",
        };
      case "cumplido":
        return {
          bg: esMiTurno
            ? "bg-emerald-600 text-white"
            : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300",
          border: "border-emerald-300 dark:border-emerald-800",
          dot: "bg-emerald-500",
          label: "Cumplido",
        };
      case "multado":
      case "incumplido":
        return {
          bg: "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300",
          border: "border-rose-300 dark:border-rose-800",
          dot: "bg-rose-500",
          label: "Multado",
        };
      case "proximo":
        return {
          bg: esMiTurno
            ? "bg-amber-600 text-white"
            : "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300",
          border: "border-amber-300 dark:border-amber-800",
          dot: "bg-amber-500",
          label: "Próximo",
        };
      default:
        return {
          bg: esMiTurno
            ? "bg-indigo-600 text-white"
            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
          border: "border-slate-200 dark:border-slate-700",
          dot: "bg-slate-400",
          label: "Programado",
        };
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-sm transition-all space-y-6">
      {/* 1. HEADER DEL CALENDARIO: CONTROLES DE MES Y FILTROS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-100 dark:border-indigo-800/40 shrink-0">
            <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
              <span>{MESES[month]} {year}</span>
              {year === 2026 && month === 9 && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Mes en curso
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Rotación semanal de limpieza de escaleras y palieres (Lunes a Domingo)
            </p>
          </div>
        </div>

        {/* Botones de Navegación y Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Filtro "Solo Mis Turnos" */}
          <button
            onClick={() => setSoloMisTurnos(!soloMisTurnos)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              soloMisTurnos
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{soloMisTurnos ? "Viendo mi UF" : "Filtrar mi UF"}</span>
          </button>

          {/* Botón "Ir al Mes Actual" */}
          <button
            onClick={goToday}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            Ciclo Actual
          </button>

          {/* Paginación Meses */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
            <button
              onClick={prevMonth}
              aria-label="Mes anterior"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Mes siguiente"
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. LEYENDA RÁPIDA DE COLORES */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Estados:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
          <span>En Curso (Activo)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Cumplido</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Próximo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Multado ($24.000)</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto font-medium text-indigo-600 dark:text-indigo-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Haz clic en un turno para ver detalles</span>
        </div>
      </div>

      {/* 3. GRILLA DEL CALENDARIO */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Cabecera Días de Semana */}
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-center py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400">
          {DIAS_SEMANA.map((dia, idx) => (
            <div key={idx} className={idx >= 5 ? "text-indigo-600 dark:text-indigo-400" : ""}>
              {dia}
            </div>
          ))}
        </div>

        {/* Celdas de los Días */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
          {calendarCells.map((cell, index) => {
            const turno = cell.turno;
            const esMiTurno = turno && turno.numero_uf === miNumeroUf;
            const ocultoPorFiltro = soloMisTurnos && (!turno || !esMiTurno);

            const badgeStyle = turno ? getBadgeStyle(turno) : null;

            // Determinar si es el inicio de la semana (Lunes) para destacar el título de la guardia
            const isMonday = cell.date.getDay() === 1;

            return (
              <div
                key={index}
                onClick={() => {
                  if (turno) setSelectedTurno(turno);
                }}
                className={`min-h-[92px] sm:min-h-[110px] p-2 sm:p-2.5 flex flex-col justify-between transition-colors relative group ${
                  !cell.isCurrentMonth
                    ? "bg-slate-50/40 dark:bg-slate-950/40 text-slate-400 dark:text-slate-600"
                    : "text-slate-800 dark:text-slate-200"
                } ${
                  turno && !ocultoPorFiltro
                    ? "cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20"
                    : ""
                } ${
                  esMiTurno && !ocultoPorFiltro
                    ? "bg-indigo-50/20 dark:bg-indigo-950/10"
                    : ""
                }`}
              >
                {/* Header de la Celda: Número de Día */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      cell.isToday
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>

                  {/* Indicador de tu turno */}
                  {esMiTurno && !ocultoPorFiltro && isMonday && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                      Mi UF
                    </span>
                  )}
                </div>

                {/* Contenido del Turno en el Día */}
                {turno && !ocultoPorFiltro && badgeStyle && (
                  <div className="mt-1">
                    {/* Tarjeta / Chip del Turno */}
                    <div
                      className={`rounded-lg px-2 py-1 text-[10px] sm:text-[11px] font-bold border transition-all ${
                        badgeStyle.bg
                      } ${badgeStyle.border} ${
                        esMiTurno ? "ring-2 ring-indigo-400 dark:ring-indigo-500" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">
                          UF 0{turno.numero_uf} ({turno.piso_depto})
                        </span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeStyle.dot}`} />
                      </div>

                      {/* Nombre del residente visible en desktop */}
                      <div className="hidden sm:block text-[9px] opacity-90 truncate font-normal mt-0.5">
                        {turno.residente.split(",")[0]}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MODAL / DETALLE DEL TURNO SELECCIONADO */}
      {selectedTurno && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative">
            <button
              onClick={() => setSelectedTurno(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Encabezado */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold border border-indigo-100 dark:border-indigo-800/40">
                <Sparkles className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Semana {selectedTurno.semana_numero} • Cronograma 2026
                </span>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Guardia UF 0{selectedTurno.numero_uf} ({selectedTurno.piso_depto})
                </h4>
              </div>
            </div>

            {/* Ficha de Información */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 text-xs mb-5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Residente responsable:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedTurno.residente}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Vigencia del turno:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {selectedTurno.rango_fechas}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-2">
                <span className="text-slate-500">Estado de la guardia:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                    selectedTurno.estado === "en_curso"
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                      : selectedTurno.estado === "cumplido"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : selectedTurno.estado === "multado"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                      : "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {selectedTurno.estado.replace("_", " ")}
                </span>
              </div>

              {selectedTurno.solicitud_permuta_uf && (
                <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-700 dark:text-indigo-300">
                  Solicitud de permuta con UF {selectedTurno.solicitud_permuta_uf} (
                  {selectedTurno.estado_permuta || "Pendiente"})
                </div>
              )}

              {selectedTurno.unidad_sustituta_uf && (
                <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-700 dark:text-amber-300">
                  Turno cubierto por Unidad Sustituta: UF {selectedTurno.unidad_sustituta_uf} (Compensación de $24.000 aplicada)
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              {onPedirPermuta && selectedTurno.numero_uf !== miNumeroUf && (
                <button
                  onClick={() => {
                    onPedirPermuta(selectedTurno);
                    setSelectedTurno(null);
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Proponer Permuta</span>
                </button>
              )}

              {onReportarIncumplimiento && selectedTurno.estado === "en_curso" && (
                <button
                  onClick={() => {
                    onReportarIncumplimiento(selectedTurno);
                    setSelectedTurno(null);
                  }}
                  className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Reportar</span>
                </button>
              )}

              <button
                onClick={() => setSelectedTurno(null)}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
