"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Home,
  Receipt,
  Sparkles,
  LifeBuoy,
  Vote,
  ShieldCheck,
  ArrowRight,
  Bot,
  Layers,
  CreditCard,
  QrCode,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Luces y gradientes de fondo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center text-center gap-8 py-8">
        {/* Header Consorcio */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-700 bg-white shadow-xl flex items-center justify-center p-2">
            <Image
              src="/logo.png"
              alt="Logo Consorcio Calle 425"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Consorcio Residencial Calle 425 • 9 Unidades</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              DeveloPet Friendly <span className="text-indigo-400">🐾</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
              Plataforma integral de autogestión consorcial, liquidación transparente de expensas,
              votaciones en tiempo real y turnos de limpieza rotativa.
            </p>
          </div>
        </div>

        {/* Acceso Rápido por Roles (Live Demo) */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Tarjeta Rol Administradora */}
          <Link
            href="/admin/dashboard"
            className="group p-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 shadow-xl transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                Rol Administradora
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                Panel de Administración (Paula)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Visualizá las 9 UFs, la liquidación oficial de expensas, mora del 7%, estado de caja
                y presupuestos de proveedores.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Ingresar como Administradora</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>

          {/* Tarjeta Rol Vecino */}
          <Link
            href="/vecino/dashboard"
            className="group p-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 shadow-xl transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Home className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                Rol Vecino (Laura • UF 3)
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                Panel del Vecino (Copropietario)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Descargá tu cupón de pago con QR, consultá la liquidación de las 9 UFs, tus turnos de
                limpieza y votá presupuestos.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>Ingresar como Vecino</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Accesos Directos a Módulos Específicos */}
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-left">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Accesos Directos a Módulos Clave</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <Link
              href="/admin/expensas/liquidacion"
              className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition flex flex-col gap-1.5"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200">Liquidación 9 UFs</span>
              <span className="text-[11px] text-slate-400">Estado de Caja y Planilla</span>
            </Link>

            <Link
              href="/vecino/votaciones"
              className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition flex flex-col gap-1.5"
            >
              <Vote className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-slate-200">Votaciones</span>
              <span className="text-[11px] text-slate-400">Consenso & Presupuestos</span>
            </Link>

            <Link
              href="/vecino/limpieza"
              className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition flex flex-col gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-slate-200">Limpieza Rotativa</span>
              <span className="text-[11px] text-slate-400">Cronograma 4 Semanas</span>
            </Link>

            <Link
              href="/login"
              className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 transition flex flex-col gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-slate-200">Pantalla de Login</span>
              <span className="text-[11px] text-slate-400">Auth y Credenciales</span>
            </Link>
          </div>
        </div>

        {/* Footer Institucional */}
        <footer className="text-xs text-slate-500 flex flex-wrap items-center justify-center gap-2">
          <span>DeveloPet Friendly</span>
          <span>•</span>
          <span>Prácticas Profesionalizantes IV</span>
          <span>•</span>
          <span>IFTS 29</span>
        </footer>
      </div>
    </main>
  );
}
