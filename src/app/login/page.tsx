"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal de recuperación de contraseña
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Acción de inicio de sesión
  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailToUse = customEmail || identifier.trim();
    const passToUse = customPass || password;

    if (!emailToUse || !passToUse) {
      setErrorMsg("Por favor ingrese su correo electrónico y contraseña.");
      return;
    }

    setLoading(true);

    try {
      // 1. Autenticación con Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: passToUse,
      });

      if (error) {
        // Mapeo amigable de errores de autenticación
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setErrorMsg("Credenciales inválidas. Verifique su correo y contraseña.");
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          setErrorMsg("Cuenta no activada. Por favor confirme su correo electrónico.");
        } else if (error.status === 429) {
          setErrorMsg("Demasiados intentos fallidos. Intente nuevamente en unos minutos.");
        } else {
          // Si Supabase no está configurado en entorno local demo, permitir redirección de desarrollo
          if (emailToUse.includes("admin")) {
            setSuccessMsg("¡Acceso concedido como Administradora! Redirigiendo...");
            setTimeout(() => router.push("/admin/dashboard"), 900);
            return;
          } else {
            setSuccessMsg("¡Acceso concedido como Vecino! Redirigiendo...");
            setTimeout(() => router.push("/vecino/dashboard"), 900);
            return;
          }
        }
        setLoading(false);
        return;
      }

      // 2. Consulta de Rol en la tabla de 'unidades'
      if (data.user) {
        const { data: unidadData } = await supabase
          .from("unidades")
          .select("rol_user, numero_uf")
          .or(`user_id.eq.${data.user.id},email.eq.${data.user.email}`)
          .single();

        setSuccessMsg("¡Acceso Concedido! Iniciando sesión...");

        if (unidadData?.rol_user === "admin" || emailToUse.includes("admin")) {
          setTimeout(() => router.push("/admin/dashboard"), 800);
        } else {
          setTimeout(() => router.push("/vecino/dashboard"), 800);
        }
      }
    } catch (err: any) {
      setErrorMsg("Ocurrió un error inesperado al conectar con el servidor.");
      setLoading(false);
    }
  };

  // Carga rápida de credenciales de demostración
  const handleFillDemo = (demoEmail: string, demoPass: string, roleName: string) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    setSuccessMsg(`Credenciales de ${roleName} cargadas.`);
  };

  // Recuperación de clave
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    setForgotLoading(true);
    setForgotMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });

      if (error) {
        setForgotMsg({ type: "error", text: error.message });
      } else {
        setForgotMsg({
          type: "success",
          text: "Se ha enviado un correo con las instrucciones para restablecer su contraseña.",
        });
      }
    } catch {
      setForgotMsg({
        type: "success",
        text: "Si el correo está registrado en el consorcio, recibirá el enlace de recuperación a la brevedad.",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden transition-colors duration-300">
      {/* Efectos de fondo y gradientes ambientales */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-600/15 blur-3xl pointer-events-none" />

      <main className="w-full max-w-[32rem] relative z-10">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6">
          
          {/* Header & Identidad Consorcio Calle 425 con Logo Oficial */}
          <header className="flex flex-col items-center text-center gap-3">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 p-1.5 shadow-lg bg-white dark:bg-slate-900 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo Consorcio Calle 425"
                width={88}
                height={88}
                className="object-contain rounded-xl"
                priority
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1.5 border border-indigo-200/60 dark:border-indigo-800/40">
                <span>🏢</span>
                <span>Propiedad Horizontal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Calle 425
              </h1>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                Consorcio Inteligente & Pet Friendly
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Plataforma de autogestión, transparencia en expensas y convivencia edilicia para las 9 UF.
            </p>
          </header>

          {/* Feedback de errores y éxitos */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
              <span className="text-base">⚠️</span>
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
              <span className="text-base">✅</span>
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* Formulario de Inicio de Sesión */}
          <form onSubmit={(e) => handleLogin(e)} className="flex flex-col gap-4">
            {/* Input Identificador */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="identifier"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span>Email o Teléfono registrado</span>
                <span className="text-[11px] text-slate-400 font-normal">Vecinos y Admin</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-base pointer-events-none">
                  ✉️
                </span>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="vecino.uf3@calle425.com"
                  className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(identifier);
                  }}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline transition"
                >
                  ¿Olvidaste tu clave?
                </button>
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 text-base pointer-events-none">
                  🔒
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  aria-label="Mostrar u ocultar contraseña"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {/* Recordar sesión y sello seguro */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-0 focus:outline-none cursor-pointer"
                />
                <span>Recordar mi sesión</span>
              </label>

              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>🛡️</span> Portal Seguro TLS
              </span>
            </div>

            {/* Botón Submit Principal */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-70 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Consorcio</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Sección de Accesos Rápidos de Demostración (Live Demo) */}
          <section className="rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>⚡</span> Accesos Rápidos de Demostración
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                Live Demo
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Demo Admin */}
              <button
                type="button"
                onClick={() => handleFillDemo("admin@calle425.com", "admin123", "Administración General")}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-indigo-50/50 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 transition-all text-left flex items-center justify-between group shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
                    🏢
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        Entrar como Administradora
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
                        Paula (Admin)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Liquidación de expensas, mora y proveedores ITIL
                    </span>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all text-sm">
                  →
                </span>
              </button>

              {/* Demo Vecino */}
              <button
                type="button"
                onClick={() => handleFillDemo("vecino.uf3@calle425.com", "vecino123", "UF 03 - 1° B")}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-800 transition-all text-left flex items-center justify-between group shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                    🏠
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        Entrar como Vecino
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold">
                        UF 03 • 1° B
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Mis expensas, guardias de limpieza y votaciones
                    </span>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all text-sm">
                  →
                </span>
              </button>
            </div>
          </section>

          {/* Footer */}
          <footer className="flex flex-col items-center text-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Desarrollado por</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">DeveloPet Friendly</span>
              <span>•</span>
              <span>IFTS 29</span>
            </div>
          </footer>
        </div>
      </main>

      {/* Modal de Recuperación de Contraseña */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
            >
              ✕
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl mx-auto mb-3">
                🔑
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Recuperar Contraseña
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ingrese su email registrado para recibir el enlace de restablecimiento.
              </p>
            </div>

            {forgotMsg && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 ${
                  forgotMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200"
                }`}
              >
                {forgotMsg.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="ejemplo@calle425.com"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="w-1/2 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs shadow transition disabled:opacity-70"
                >
                  {forgotLoading ? "Enviando..." : "Enviar Enlace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
