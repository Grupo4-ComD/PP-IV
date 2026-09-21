"use client";

import React from "react";
import { CheckCircle2, Users, Award } from "lucide-react";

interface ProgressBarConsensoProps {
  votosFavor: number;
  totalUfs?: number;
  umbralMinimo?: number; // 3 votos = 33.3%
}

export default function ProgressBarConsenso({
  votosFavor,
  totalUfs = 9,
  umbralMinimo = 3,
}: ProgressBarConsensoProps) {
  const porcentaje = Math.min(Math.round((votosFavor / totalUfs) * 100), 100);
  const porcentajeUmbral = Math.round((umbralMinimo / totalUfs) * 100); // 33%
  const alcanzado = votosFavor >= umbralMinimo;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>Consenso Vecinal:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {votosFavor} de {totalUfs} UFs ({porcentaje}%)
          </span>
        </div>

        {alcanzado ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Umbral Alcanzado ({umbralMinimo}+ votos)
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">
            Falta {umbralMinimo - votosFavor} {umbralMinimo - votosFavor === 1 ? "voto" : "votos"} para aprobación
          </span>
        )}
      </div>

      {/* Barra de progreso interactiva */}
      <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700">
        {/* Marcador visual del umbral (33.3%) */}
        <div
          style={{ left: `${porcentajeUmbral}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 z-10"
          title={`Umbral de aprobación: ${porcentajeUmbral}% (${umbralMinimo} votos)`}
        />

        {/* Relleno animado de la barra */}
        <div
          style={{ width: `${porcentaje}%` }}
          className={`h-full rounded-full transition-all duration-500 ${
            alcanzado
              ? "bg-emerald-500 dark:bg-emerald-400 shadow-sm"
              : "bg-indigo-600 dark:bg-indigo-500"
          }`}
        />
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
        <span>0 votos (0%)</span>
        <span className="font-semibold text-slate-500 dark:text-slate-400">
          ▲ Quórum Aprobación: {umbralMinimo} UFs ({porcentajeUmbral}%)
        </span>
        <span>{totalUfs} votos (100%)</span>
      </div>
    </div>
  );
}
