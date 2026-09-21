import React from "react";
import Link from "next/link";

export default function MesaAyudaPage() {
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm"
            >
              <span>🎫</span> Mesa de Ayuda ITIL
            </Link>
            <Link
              href="/vecino/votaciones"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition"
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
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Mesa de Ayuda ITIL e Incidentes
            </h1>
            <p className="text-sm text-slate-500">
              Registre y haga seguimiento de requerimientos e incidencias edilicias con estándares de calidad ITIL 4.
            </p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition">
            + Nuevo Ticket
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario / Lista */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-800 text-base mb-4">Mis Tickets Activos</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800 text-sm">#TCK-1042</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      Prioridad Alta
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      En Curso
                    </span>
                  </div>
                  <h3 className="font-medium text-slate-900 text-sm">Filtro de agua en bomba principal</h3>
                  <p className="text-xs text-slate-500 mt-1">Proveedor asignado: HidroServicios SRL — SLA estimado: 24hs</p>
                </div>
                <span className="text-xs text-slate-400">Hace 2 horas</span>
              </div>
            </div>
          </div>

          {/* Asistente IA Reglamento */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-2">
                <span>🤖</span> IA del Reglamento Interno
              </div>
              <h3 className="font-bold text-lg mb-2">¿Dudas sobre normas consorciales o mascotas?</h3>
              <p className="text-xs text-slate-300 mb-4">
                Consulte al bot inteligente potenciado por Gemini sobre convivencia, ruidos molestos, mascotas y espacios comunes.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <input
                type="text"
                placeholder="Preguntar sobre el reglamento..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 mb-2"
              />
              <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition">
                Consultar IA
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
