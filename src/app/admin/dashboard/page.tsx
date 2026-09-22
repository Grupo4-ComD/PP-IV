"use client";

import React from "react";
import Link from "next/link";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Building2,
  Receipt,
  Wrench,
  Settings,
  Plus,
  PawPrint,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar Admin Modular */}
      <AdminSidebar />

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
            <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Emitir Expensas</span>
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
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <PawPrint className="w-3.5 h-3.5 text-indigo-500" />
                      <span>1 Perro</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Al día</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-slate-900">$0</td>
                </tr>
                <tr className="hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 font-bold text-slate-900">UF 2B</td>
                  <td className="px-4 py-3.5">Martínez, Laura</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <PawPrint className="w-3.5 h-3.5 text-amber-500" />
                      <span>2 Gatos</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertCircle className="w-3 h-3" />
                      <span>En mora (1 mes)</span>
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
