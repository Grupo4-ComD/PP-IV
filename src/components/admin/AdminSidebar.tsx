"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  Wrench,
  Settings,
  LogOut,
  Building2,
  ShieldCheck,
  PlusCircle,
  Menu,
  X,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar el menú automáticamente si se navega a otra ruta en móvil
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    {
      label: "Panel Central",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin/dashboard",
    },
    {
      label: "Generar Expensas",
      href: "/admin/expensas/generar",
      icon: PlusCircle,
      active: pathname.startsWith("/admin/expensas/generar"),
    },
    {
      label: "Liquidación Expensas",
      href: "/admin/expensas/liquidacion",
      icon: Receipt,
      active: pathname.startsWith("/admin/expensas/liquidacion"),
    },
    {
      label: "Mesa ITIL & Proveedores",
      href: "/admin/mesa-ayuda",
      icon: Wrench,
      active: pathname.startsWith("/admin/mesa-ayuda"),
    },
    {
      label: "Configuración Consorcio",
      href: "/admin/configuracion",
      icon: Settings,
      active: pathname.startsWith("/admin/configuracion"),
    },
  ];

  return (
    <>
      {/* Botón flotante para móviles (Hamburger Menu) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl cursor-pointer hover:bg-emerald-500 transition-colors active:scale-95"
        aria-label="Abrir menú"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay o telón de fondo oscuro al abrir en móviles */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menú Lateral */}
      <aside 
        className={`fixed inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition duration-300 ease-in-out w-72 bg-slate-950 text-slate-300 flex flex-col justify-between p-6 shrink-0 border-r border-slate-800/80 shadow-xl z-50 h-[100dvh] overflow-y-auto`}
      >
        <div className="flex flex-col gap-6">
          {/* Header Administración con Logo Oficial */}
          <div className="flex items-center gap-3 px-1">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-800 shadow-md bg-white shrink-0">
              <Image
                src="/logo.png"
                alt="Logo Consorcio 425"
                fill
                sizes="44px"
                className="object-contain p-0.5"
                priority
              />
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

          {/* Menú de Navegación con Active State */}
          <nav className="space-y-1.5" aria-label="Navegación del Administrador">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    item.active
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-1 ring-emerald-500"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      item.active
                        ? "bg-white/20 text-white"
                        : "bg-slate-900 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-950/50"
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer de Usuario Admin */}
        <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-white">Paula Admin</p>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-500 truncate">admin@calle425.com</p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-400 font-medium transition cursor-pointer p-1.5 rounded-lg hover:bg-slate-900"
            title="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5 stroke-[2]" />
            <span>Salir</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
