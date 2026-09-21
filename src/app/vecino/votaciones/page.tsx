import React from "react";
import Link from "next/link";

export default function VotacionesPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-6 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl">🐾</span>
            <div>
              <h2 className="font-bold text-white text-base">Calle 425</h2>
              <span className="text-xs text-indigo-400 font-medium">Portal Residente</span>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/vecino/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition"
            >
              <span>📊</span> Resumen General
            </Link>
            <Link
              href="/vecino/limpieza"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition"
            >
              <span>🧹</span> Turnos de Limpieza
            </Link>
            <Link
              href="/vecino/mesa-ayuda"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition"
            >
              <span>🎫</span> Mesa de Ayuda ITIL
            </Link>
            <Link
              href="/vecino/votaciones"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm"
            >
              <span>🗳️</span> Votaciones y Asambleas
            </Link>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-white">UF 4B - Torre 1</p>
          <p className="truncate">vecino@calle425.com</p>
          <Link href="/login" className="text-rose-400 hover:underline mt-2 inline-block">
            Cerrar Sesión
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Votaciones y Asambleas Virtuales
          </h1>
          <p className="text-sm text-slate-500">
            Participe en la toma de decisiones del consorcio mediante votación electrónica ponderada por porcentual de UF.
          </p>
        </header>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                Activa — Cierra en 4 días
              </span>
              <span className="text-xs text-slate-400">Quorum actual: 68%</span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Aprobación de Presupuesto para Pintura de Fachada y Medianera
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Se presenta a consideración de los propietarios la comparativa de presupuestos para el mantenimiento exterior del edificio con fondo extraordinario en 3 cuotas.
            </p>

            <div className="space-y-3 max-w-lg mb-6">
              <label className="flex items-center p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                <input type="radio" name="propuesta" className="text-indigo-600 focus:ring-indigo-500" />
                <span className="ml-3 text-sm font-medium text-slate-800">A favor — Presupuesto Pinturas del Sur ($1.800.000)</span>
              </label>
              <label className="flex items-center p-3.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                <input type="radio" name="propuesta" className="text-indigo-600 focus:ring-indigo-500" />
                <span className="ml-3 text-sm font-medium text-slate-800">En contra — Solicitar nuevos presupuestos</span>
              </label>
            </div>

            <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition">
              Emitir Voto
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
