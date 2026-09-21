import React from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between p-6 shrink-0 border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl">🏢</span>
            <div>
              <h2 className="font-bold text-white text-base">Consorcio 425</h2>
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                Administración
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-600 text-white font-medium text-sm"
            >
              <span>📈</span> Panel Central
            </Link>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-sm transition"
            >
              <span>💰</span> Liquidación Expensas
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-sm transition"
            >
              <span>🛠️</span> Mesa ITIL & Proveedores
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 text-sm transition"
            >
              <span>⚙️</span> Configuración Consorcio
            </a>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-white">Paula Admin</p>
          <p className="truncate">admin@calle425.com</p>
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
              Dashboard Central de Administración
            </h1>
            <p className="text-sm text-slate-500">
              Métricas operativas, estado contable y reclamos en tiempo real.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition">
              + Emitir Expensas
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Recaudación Mes
            </span>
            <div className="mt-2 text-2xl font-bold text-slate-900">$1.240.000</div>
            <p className="text-xs text-emerald-600 font-medium mt-2">85% Cobrado</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Unidades en Mora
            </span>
            <div className="mt-2 text-2xl font-bold text-rose-600">2 UFs</div>
            <p className="text-xs text-slate-500 mt-2">Total pendiente: $95.000</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tickets Abiertos
            </span>
            <div className="mt-2 text-2xl font-bold text-amber-600">3 Activos</div>
            <p className="text-xs text-slate-500 mt-2">1 requiere asignación</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Turnos de Limpieza
            </span>
            <div className="mt-2 text-2xl font-bold text-slate-900">100%</div>
            <p className="text-xs text-emerald-600 font-medium mt-2">Cubiertos este mes</p>
          </div>
        </div>

        {/* Resumen de Unidades */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Estado de Unidades Funcionales</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Unidad</th>
                  <th className="px-4 py-3">Propietario / Inquilino</th>
                  <th className="px-4 py-3">Mascotas</th>
                  <th className="px-4 py-3">Estado Expensa</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 font-bold text-slate-900">UF 1A</td>
                  <td className="px-4 py-3.5">González, Mario</td>
                  <td className="px-4 py-3.5">🐕 1 Perro</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Al día
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-900">$0</td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 font-bold text-slate-900">UF 2B</td>
                  <td className="px-4 py-3.5">Martínez, Laura</td>
                  <td className="px-4 py-3.5">🐈 2 Gatos</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      En mora (1 mes)
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-rose-600">$48.500</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
