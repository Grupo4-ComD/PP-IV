"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Sparkles,
  LifeBuoy,
  Vote,
  PhoneCall,
  LogOut,
  Building2,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

interface VecinoSidebarProps {
  unidad?: {
    numero_uf?: number | string;
    piso_depto?: string;
    propietario_nombre?: string;
  };
}

export default function VecinoSidebar({ unidad }: VecinoSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Cerrar el menú automáticamente si se navega a otra ruta en móvil
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    {
      href: "/vecino/dashboard",
      label: "Panel Principal",
      icon: LayoutDashboard,
      description: "Estado de cuenta y expensas",
    },
    {
      href: "/vecino/limpieza",
      label: "Turnos de Limpieza",
      icon: Sparkles,
      description: "Cronograma rotativo 9 UFs",
    },
    {
      href: "/vecino/mesa-ayuda",
      label: "Mesa de Ayuda ITIL",
      icon: LifeBuoy,
      description: "Reclamos e incidentes",
    },
    {
      href: "/vecino/votaciones",
      label: "Votaciones y Asambleas",
      icon: Vote,
      description: "Presupuestos de proveedores",
    },
  ];

  const ufNumero = unidad?.numero_uf ? String(unidad.numero_uf).padStart(2, "0") : "03";
  const depto = unidad?.piso_depto || "1° B";
  const nombre = unidad?.propietario_nombre || "Gómez, Sofía";

  return (
    <>
      {/* Botón flotante para móviles (Hamburger Menu) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:bg-indigo-500 transition-colors active:scale-95"
        aria-label="Abrir menú"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay o telón de fondo oscuro al abrir en móviles */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menú Lateral */}
      <aside 
        className={`fixed inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition duration-300 ease-in-out w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-6 shrink-0 z-50 h-[100dvh] overflow-y-auto`}
      >
        <div className="flex flex-col gap-6">
          {/* Header Consorcio & Brand con Logo Oficial */}
          <div className="flex items-center gap-3 px-1">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm bg-white shrink-0">
              <Image
                src="/logo.png"
                alt="Logo Consorcio Inteligente Calle 425"
                fill
                sizes="44px"
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
                  Calle 425
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Consorcio Inteligente
              </p>
            </div>
          </div>

          {/* Tarjeta de UF de Residente */}
          <div className="bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs backdrop-blur-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Unidad Funcional
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Al Día
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  UF {ufNumero} • {depto}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {nombre}
                </p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          {/* Navegación del Portal con Iconos Sobrios */}
          <nav className="space-y-1.5" aria-label="Navegación principal de vecino">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-500"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50"
                      }`}
                    >
                      <Icon className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="leading-tight">{item.label}</span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isActive
                        ? "text-indigo-200 opacity-100 translate-x-0"
                        : "text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Guardia y Urgencias 24h & Footer */}
        <div className="flex flex-col gap-3 pt-4 mt-4">
          <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <PhoneCall className="w-4 h-4 stroke-[2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Guardia 24h
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                Plomería & Gas
              </span>
              <a
                href="tel:08004253343"
                className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5 hover:underline"
              >
                0800-425-EDIF
              </a>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="text-[11px] font-medium text-slate-400">
              v2.4 • Consorcio
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-medium transition cursor-pointer bg-transparent border-none p-0"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2]" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
