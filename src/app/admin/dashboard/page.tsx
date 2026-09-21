import React from "react";
import Link from "next/link";
import {
  Building2,
  LayoutDashboard,
  Receipt,
  Wrench,
  Settings,
  LogOut,
  PlusCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Admin */}
      <aside className="w-72 bg-slate-950 text-slate-300 flex flex-col justify-between p-6 shrink-0 border-r border-slate-800/80 shadow-xl">
        <div className="flex flex-col gap-6">
          {/* Header Administración */}
          <div className="flex items-center gap-3 px-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm tracking-tight">Consorcio 425</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Gestión Central</p>
            </div>
          </div>

          <nav className="space-y-1.5" aria-label="Navegación del Administrador">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-600/25 ring-1 ring-emerald-500 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 stroke-[2]" />
              </div>
              <span>Panel Central</span>
            </Link>
            <a
              href="#"
              className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-medium transition"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-950/50 transition">
                <Receipt className="w-4 h-4 stroke-[2]" />
              </div>
              <span>Liquidación Expensas</span>
            </a>
            <a
              href="#"
              className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-medium transition"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-950/50 transition">
                <Wrench className="w-4 h-4 stroke-[2]" />
              </div>
              <span>Mesa ITIL & Proveedores</span>
            </a>
            <a
              href="#"
              className="group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-medium transition"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-950/50 transition">
                <Settings className="w-4 h-4 stroke-[2]" />
              </div>
              <span>Configuración Consorcio</span>
            </a>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            <p className="font-semibold text-white">Paula Admin</p>
            <p className="text-[11px] text-slate-500 truncate">admin@calle425.com</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5 stroke-[2]" />
            <span>Salir</span>
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
